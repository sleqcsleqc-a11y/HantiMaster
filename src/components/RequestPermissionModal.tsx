import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Key, Send, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface RequestPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestPermissionModal: React.FC<RequestPermissionModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    module: '',
    action: 'view',
    justification: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await api.submitPermissionRequest({
        user_id: user.id,
        ...form
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setForm({ module: '', action: 'view', justification: '' });
      }, 2000);
    } catch (error) {
      console.error("Failed to submit request", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
              <Key size={20} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Request Access</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <Send size={32} />
            </div>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Request Submitted</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Your request has been sent to the administrator for review.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Module</label>
              <select 
                required
                value={form.module}
                onChange={e => setForm({...form, module: e.target.value})}
                className="vintsy-input w-full appearance-none"
              >
                <option value="">Select a module...</option>
                <option value="FINANCE">Finance</option>
                <option value="PROPERTY_MANAGEMENT">Property Management</option>
                <option value="TENANT_MANAGEMENT">Tenant Management</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TASKS">Tasks</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Action</label>
              <select 
                required
                value={form.action}
                onChange={e => setForm({...form, action: e.target.value})}
                className="vintsy-input w-full appearance-none"
              >
                <option value="view">View</option>
                <option value="create">Create</option>
                <option value="edit">Edit</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Justification</label>
              <textarea 
                required
                value={form.justification}
                onChange={e => setForm({...form, justification: e.target.value})}
                className="vintsy-input w-full min-h-[100px]"
                placeholder="Why do you need this permission?"
              />
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex gap-3">
              <AlertCircle size={16} className="text-violet-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Requests are reviewed by the System Administrator. Temporary access may be granted for specific tasks.
              </p>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full vintsy-button-primary py-4 text-xs uppercase tracking-widest font-bold disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
