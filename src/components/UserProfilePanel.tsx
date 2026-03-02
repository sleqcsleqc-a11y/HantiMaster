import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Key, 
  Send,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface UserProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfilePanel: React.FC<UserProfilePanelProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [requestText, setRequestText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', address: '' });

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditForm({
        phone: user?.phone || '',
        address: user?.address || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await api.updateGovernanceUser(user.id, editForm, user.id);
      await refreshUser();
      setIsEditing(false);
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to update profile', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !requestText.trim()) return;

    setIsSubmitting(true);
    try {
      await api.submitPermissionRequest({
        user_id: user.id,
        requested_permission: requestText,
        reason: 'User requested access via profile panel'
      });
      setSubmitStatus('success');
      setRequestText('');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to submit request', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl z-[110] overflow-y-auto"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">My Profile</h3>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Identity */}
              <div className="flex flex-col items-center text-center space-y-4 p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <div className="w-24 h-24 rounded-3xl bg-violet-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-violet-600/20">
                  {user?.first_name[0]}{user?.last_name[0]}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{user?.first_name} {user?.last_name}</h4>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Shield size={14} className="text-violet-600" />
                    <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">{user?.role_name}</span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Contact Information</h5>
                  <button 
                    onClick={handleEditToggle}
                    className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    {isEditing ? 'Cancel' : <><Edit2 size={10} /> Edit</>}
                  </button>
                </div>
                <div className="vintsy-card p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Mail size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Phone size={18} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Telephone</p>
                      {isEditing ? (
                        <input 
                          type="tel"
                          value={editForm.phone}
                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{user?.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <MapPin size={18} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Address</p>
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editForm.address}
                          onChange={e => setEditForm({...editForm, address: e.target.value})}
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{user?.address || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14} /> Save Changes</>}
                    </button>
                  )}
                </div>
              </div>

              {/* Request Access Section */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 flex items-center gap-2">
                  <Key size={14} />
                  Request Additional Access
                </h5>
                <form onSubmit={handleRequestAccess} className="vintsy-card p-6 space-y-4">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Need access to a specific property or administrative module? Submit a request to the system administrator.
                  </p>
                  <textarea 
                    value={requestText}
                    onChange={e => setRequestText(e.target.value)}
                    placeholder="Describe the access or permissions you require..."
                    className="w-full h-32 p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
                    required
                  />
                  <button 
                    type="submit"
                    disabled={isSubmitting || !requestText.trim()}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        Submit Request
                      </>
                    )}
                  </button>

                  {submitStatus === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                    >
                      <CheckCircle2 size={14} />
                      Request submitted successfully
                    </motion.div>
                  )}

                  {submitStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                    >
                      <AlertCircle size={14} />
                      Failed to submit request
                    </motion.div>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
