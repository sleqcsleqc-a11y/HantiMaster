import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const RoleSwitcher: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 bg-zinc-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-zinc-800 hover:bg-zinc-800 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div className="text-left pr-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-none mb-1">Current Role</p>
            <p className="text-xs font-bold leading-none">{user.role_name}</p>
          </div>
          <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-4 right-0 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-800">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">User Menu</h4>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-2 border-t border-zinc-800">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};