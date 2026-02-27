import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Send, Paperclip, MoreVertical, CheckCircle2, Circle, Bell } from 'lucide-react';

export const Communication: React.FC = () => {
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [message, setMessage] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  React.useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

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

  const simulateIncomingMessage = () => {
    if (notificationsEnabled) {
      new Notification('New Message', {
        body: 'Sarah Smith: When is the next community meeting?',
      });
    } else {
      alert('Please enable notifications first.');
    }
  };

  const chats = [
    { id: 1, name: 'John Doe', unit: 'Unit 101', lastMessage: 'Thanks for fixing the sink!', time: '10:30 AM', unread: 0 },
    { id: 2, name: 'Sarah Smith', unit: 'Unit 204', lastMessage: 'When is the next community meeting?', time: 'Yesterday', unread: 2 },
    { id: 3, name: 'Mike Johnson', unit: 'Unit 305', lastMessage: 'I will be out of town next week.', time: 'Mon', unread: 0 },
    { id: 4, name: 'Emily Davis', unit: 'Unit 112', lastMessage: 'Can I get an extra parking spot?', time: 'Sun', unread: 1 },
  ];

  const messages = [
    { id: 1, sender: 'John Doe', text: 'Hi, the sink in the kitchen is leaking.', time: '09:00 AM', isMe: false },
    { id: 2, sender: 'Admin', text: 'Hello John, I will send maintenance right away.', time: '09:15 AM', isMe: true },
    { id: 3, sender: 'John Doe', text: 'Thanks for fixing the sink!', time: '10:30 AM', isMe: false },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Portal</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Tenant Communication</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={requestNotificationPermission}
            className={`p-2.5 rounded-xl transition-colors border ${notificationsEnabled ? 'bg-violet-100 border-violet-200 text-violet-600 dark:bg-violet-900/40 dark:border-violet-800 dark:text-violet-400' : 'bg-white/50 border-violet-100 text-zinc-400 hover:text-violet-600 dark:bg-zinc-800/50 dark:border-zinc-700 dark:hover:text-violet-400'}`}
            title={notificationsEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
          >
            <Bell size={16} />
          </button>
          <button 
            onClick={simulateIncomingMessage}
            className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            Simulate Message
          </button>
          <button className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest">
            New Message
          </button>
        </div>
      </div>

      <div className="flex-1 vintsy-card flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-violet-50 dark:border-zinc-800 flex flex-col bg-white/50 dark:bg-zinc-900/50">
          <div className="p-4 border-b border-violet-50 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`p-4 border-b border-violet-50 dark:border-zinc-800 cursor-pointer transition-all duration-300 ${
                  activeChat === chat.id 
                    ? 'bg-violet-50/50 dark:bg-zinc-800/50 border-l-4 border-l-violet-600' 
                    : 'hover:bg-violet-50/30 dark:hover:bg-zinc-800/30 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{chat.name}</h4>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate pr-4">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-widest mt-2">{chat.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white/30 dark:bg-zinc-950/30">
          {activeChat ? (
            <>
              <div className="p-6 border-b border-violet-50 dark:border-zinc-800 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-700 dark:bg-violet-900/40 text-white dark:text-violet-400 flex items-center justify-center font-bold text-xs border border-violet-800 dark:border-violet-800 shadow-md">
                    JD
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">John Doe</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-medium">Unit 101 • Active</p>
                  </div>
                </div>
                <button className="text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                      msg.isMe 
                        ? 'bg-violet-600 text-white rounded-tr-sm' 
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-violet-100 dark:border-zinc-700 rounded-tl-sm'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-2 px-1">{msg.time}</span>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 border-t border-violet-50 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button className="p-2.5 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors bg-white dark:bg-zinc-800 border border-violet-100 dark:border-zinc-700 rounded-xl shadow-sm hover:shadow-md">
                    <Paperclip size={18} />
                  </button>
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..." 
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400 shadow-sm"
                  />
                  <button className="p-2.5 bg-violet-600 text-white rounded-xl shadow-md hover:bg-violet-700 transition-colors active:scale-95">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm font-medium">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
