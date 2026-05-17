import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Send, Paperclip, MoreVertical, CheckCircle2, Circle, Bell, Users, Building2, X } from 'lucide-react';
import { api } from '../services/api';
import { Message, Tenant, Owner } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const Communication: React.FC = () => {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<{ id: string, type: string } | null>(null);
  const [message, setMessage] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Tenants' | 'Owners'>('Tenants');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessageRecipient, setNewMessageRecipient] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');

  useEffect(() => {
    loadData();
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
    
    // Subscribe to new messages via Supabase Realtime
    const messagesSubscription = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          loadMessages();
          if (notificationsEnabled && payload.eventType === 'INSERT' && payload.new.receiver_id === user?.id) {
            new Notification('New Message', {
              body: payload.new.content,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [user?.id, notificationsEnabled]);

  const loadData = async () => {
    const [t, o] = await Promise.all([
      api.getTenants(),
      api.getOwners()
    ]);
    setTenants(t);
    setOwners(o);
    await loadMessages();
  };

  const loadMessages = async () => {
    const msgs = await api.getMessages();
    setMessages(msgs);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    if (permission === 'granted') {
      new Notification('Notifications Enabled', {
        body: 'You will now receive alerts for new messages.',
      });
    }
  };

  const simulateIncomingMessage = async () => {
    // Simulate a message from a random tenant if available
    const availableTenants = tenants.filter(t => t.user_id);
    if (availableTenants.length > 0) {
      const randomTenant = availableTenants[Math.floor(Math.random() * availableTenants.length)];
      await api.sendMessage({
        sender_id: randomTenant.user_id!,
        sender_type: 'Tenant',
        receiver_id: user?.id,
        receiver_type: 'User',
        content: 'Hello, I have a question about my lease.',
        read: false
      });
      loadMessages();
      if (notificationsEnabled) {
        new Notification('New Message', {
          body: `${randomTenant.first_name} ${randomTenant.last_name}: Hello, I have a question about my lease.`,
        });
      }
    } else {
      alert('No tenants with user accounts found to simulate message.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChat || !user) return;

    await api.sendMessage({
      sender_id: user.id,
      sender_type: 'User',
      receiver_id: activeChat.id,
      receiver_type: activeChat.type,
      content: message,
      read: true
    });
    
    setMessage('');
    loadMessages();
  };

  const handleSendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !newMessageRecipient || !user) return;

    const [type, id] = newMessageRecipient.split('_');

    await api.sendMessage({
      sender_id: user.id,
      sender_type: 'User',
      receiver_id: id,
      receiver_type: type,
      content: newMessageContent,
      read: true
    });
    
    setNewMessageContent('');
    setNewMessageRecipient('');
    setShowNewMessageModal(false);
    setActiveChat({ id, type });
    loadMessages();
  };

  const conversations = useMemo(() => {
    if (user?.role_name === 'Tenant') {
      const chatMessages = messages.filter(m => 
        m.sender_id === user.id || m.receiver_id === user.id
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const lastMessage = chatMessages[0];
      const unreadCount = chatMessages.filter(m => m.sender_id !== user?.id && !m.read).length;

      return [{ 
        id: 'management', 
        type: 'System', 
        name: 'Property Management', 
        subtext: 'Support Team',
        lastMessage: lastMessage ? lastMessage.content : 'No messages yet',
        time: lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: unreadCount,
        timestamp: lastMessage ? new Date(lastMessage.timestamp).getTime() : 0
      }];
    }

    const list = activeTab === 'Tenants' 
      ? tenants.filter(t => t.user_id).map(t => ({ id: t.user_id!, type: 'Tenant', name: `${t.first_name} ${t.last_name}`, subtext: `Unit ${t.unit_number || 'N/A'}` }))
      : owners.filter(o => o.user_id).map(o => ({ id: o.user_id!, type: 'Owner', name: `${o.first_name} ${o.last_name}`, subtext: `${o.property_count || 0} Properties` }));

    return list.map(item => {
      const chatMessages = messages.filter(m => 
        (m.sender_id === item.id) || 
        (m.receiver_id === item.id)
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const lastMessage = chatMessages[0];
      const unreadCount = chatMessages.filter(m => m.sender_id !== user?.id && !m.read).length;

      return {
        ...item,
        lastMessage: lastMessage ? lastMessage.content : 'No messages yet',
        time: lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: unreadCount,
        timestamp: lastMessage ? new Date(lastMessage.timestamp).getTime() : 0
      };
    }).filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [tenants, owners, messages, activeTab, searchQuery, user]);

  const activeChatMessages = useMemo(() => {
    if (!activeChat) return [];
    
    if (user?.role_name === 'Tenant') {
      // Tenants only see messages involving them
      return messages.filter(m => 
        m.sender_id === user.id || m.receiver_id === user.id
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    return messages.filter(m => 
      (m.sender_id === activeChat.id) || 
      (m.receiver_id === activeChat.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, activeChat, user]);

  const activeChatDetails = useMemo(() => {
    if (!activeChat) return null;
    if (activeChat.type === 'System') {
      return { name: 'Property Management', subtext: 'Support Team', initials: 'PM' };
    }
    if (activeChat.type === 'Tenant') {
      const t = tenants.find(t => t.user_id === activeChat.id);
      return t ? { name: `${t.first_name} ${t.last_name}`, subtext: `Unit ${t.unit_number || 'N/A'}`, initials: `${t.first_name?.[0]}${t.last_name?.[0]}` } : null;
    } else {
      const o = owners.find(o => o.user_id === activeChat.id);
      return o ? { name: `${o.first_name} ${o.last_name}`, subtext: `${o.property_count || 0} Properties`, initials: `${o.first_name?.[0]}${o.last_name?.[0]}` } : null;
    }
  }, [activeChat, tenants, owners]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatMessages]);

  useEffect(() => {
    if (activeChat && user) {
      // Mark messages as read
      const unreadMessages = activeChatMessages.filter(m => m.sender_id !== user.id && !m.read);
      unreadMessages.forEach(m => {
        api.markMessageRead(m.id);
      });
      if (unreadMessages.length > 0) {
        loadMessages();
      }
    }
  }, [activeChat, activeChatMessages, user]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-1">Portal</h3>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight">Tenant Communication</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={requestNotificationPermission}
            className={`p-2.5 rounded-xl transition-colors border ${notificationsEnabled ? 'bg-violet-100 border-violet-200 text-violet-600' : 'bg-white/50 border-violet-100 text-zinc-400 hover:text-violet-600'}`}
            title={notificationsEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
          >
            <Bell size={16} />
          </button>
          {user?.role_name !== 'Tenant' && (
            <>
              <button 
                onClick={simulateIncomingMessage}
                className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest"
              >
                Simulate Message
              </button>
              <button 
                onClick={() => setShowNewMessageModal(true)}
                className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest"
              >
                New Message
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 vintsy-card flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-violet-50 flex flex-col bg-white/50">
          <div className="p-4 border-b border-violet-50 space-y-4">
            {user?.role_name !== 'Tenant' && (
              <div className="flex bg-zinc-100 p-1 rounded-xl">
                <button 
                  onClick={() => { setActiveTab('Tenants'); setActiveChat(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'Tenants' ? 'bg-white text-violet-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  <Users size={14} />
                  Tenants
                </button>
                <button 
                  onClick={() => { setActiveTab('Owners'); setActiveChat(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'Owners' ? 'bg-white text-violet-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  <Building2 size={14} />
                  Owners
                </button>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text" 
                placeholder="Search contacts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-violet-100 rounded-xl text-xs text-zinc-900 focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setActiveChat({ id: chat.id, type: chat.type })}
                className={`p-4 border-b border-violet-50 cursor-pointer transition-all duration-300 ${
                  activeChat?.id === chat.id && activeChat?.type === chat.type
                    ? 'bg-violet-50/50 border-l-4 border-l-violet-600' 
                    : 'hover:bg-violet-50/30 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-zinc-900">{chat.name}</h4>
                  <span className="text-[10px] text-zinc-400 font-medium">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-zinc-500 truncate pr-4">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-violet-600 font-bold uppercase tracking-widest mt-2">{chat.subtext}</p>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-500">
                No conversations found.
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white/30">
          {activeChat && activeChatDetails ? (
            <>
              <div className="p-6 border-b border-violet-50 flex justify-between items-center bg-white/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold text-xs border border-violet-800 shadow-md">
                    {activeChatDetails.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{activeChatDetails.name}</h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">{activeChatDetails.subtext}</p>
                  </div>
                </div>
                <button className="text-zinc-400 hover:text-violet-600 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col-reverse">
                <div className="space-y-6 flex flex-col">
                  {activeChatMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                          isMe 
                            ? 'bg-violet-600 text-white rounded-tr-sm' 
                            : 'bg-white text-zinc-900 border border-violet-100 rounded-tl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium mt-2 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </motion.div>
                    );
                  })}
                  {activeChatMessages.length === 0 && (
                    <div className="text-center text-xs text-zinc-500 py-8">
                      No messages yet. Send a message to start the conversation.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-violet-50 bg-white/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button type="button" className="p-2.5 text-zinc-400 hover:text-violet-600 transition-colors bg-white border border-violet-100 rounded-xl shadow-sm hover:shadow-md">
                    <Paperclip size={18} />
                  </button>
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..." 
                    className="flex-1 px-4 py-2.5 bg-white border border-violet-100 rounded-xl text-sm text-zinc-900 focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400 shadow-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!message.trim()}
                    className="p-2.5 bg-violet-600 text-white rounded-xl shadow-md hover:bg-violet-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm font-medium">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNewMessageModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-violet-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900">New Message</h3>
                <button 
                  onClick={() => setShowNewMessageModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSendNewMessage} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Recipient</label>
                  <select 
                    value={newMessageRecipient}
                    onChange={e => setNewMessageRecipient(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-violet-100 rounded-xl text-sm text-zinc-900 focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                  >
                    <option value="">Select a recipient...</option>
                    <optgroup label="Tenants">
                      {tenants.filter(t => t.user_id).map(t => (
                        <option key={`Tenant_${t.user_id}`} value={`Tenant_${t.user_id}`}>
                          {t.first_name} {t.last_name} (Unit {t.unit_number})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Owners">
                      {owners.filter(o => o.user_id).map(o => (
                        <option key={`Owner_${o.user_id}`} value={`Owner_${o.user_id}`}>
                          {o.first_name} {o.last_name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Message</label>
                  <textarea 
                    value={newMessageContent}
                    onChange={e => setNewMessageContent(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-violet-100 rounded-xl text-sm text-zinc-900 focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all resize-none"
                    placeholder="Type your message here..."
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowNewMessageModal(false)}
                    className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!newMessageRecipient || !newMessageContent.trim()}
                    className="vintsy-button-primary text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
