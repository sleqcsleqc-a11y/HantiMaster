import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Lock, 
  Unlock, 
  MoreVertical, 
  Shield, 
  Key, 
  History, 
  Activity,
  X,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { User, Role } from '../../types';

export const UserGovernance: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        api.getGovernanceUsers(),
        api.getRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUserStatus = async (userId: number, status: string) => {
    await api.updateGovernanceUser(userId, { status }, currentUser?.id);
    loadData();
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, status } : null);
    }
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="vintsy-card p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users by name, email, or role..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
            <Filter size={14} />
            Filters
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20">
            <UserPlus size={14} />
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="vintsy-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                <th className="px-8 py-5">User Profile</th>
                <th className="px-8 py-5">Role & Scope</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Last Login</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.map(u => (
                <tr 
                  key={u.id} 
                  className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedUser(u);
                    setIsDrawerOpen(true);
                  }}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-400 font-bold text-sm shadow-sm">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 transition-colors">{u.first_name} {u.last_name}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {u.role_name}
                      </span>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">{u.property_scope} Scope</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      u.status === 'Active' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <Clock size={14} className="text-zinc-300" />
                      {u.last_login ? new Date(u.last_login).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => handleUserStatus(u.id, u.status === 'Active' ? 'Suspended' : 'Active')}
                        className={`p-2 rounded-xl transition-colors ${u.status === 'Active' ? 'text-zinc-400 hover:bg-red-50 hover:text-red-600' : 'text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                      >
                        {u.status === 'Active' ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-violet-600 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Slide-over */}
      <AnimatePresence>
        {isDrawerOpen && selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white dark:bg-zinc-900 shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">User Profile Panel</h3>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Header Info */}
                <div className="flex items-center gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                  <div className="w-20 h-20 rounded-3xl bg-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-violet-600/20">
                    {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{selectedUser.first_name} {selectedUser.last_name}</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2 text-sm mt-1">
                      <Mail size={14} />
                      {selectedUser.email}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        selectedUser.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {selectedUser.status}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-widest border border-violet-100">
                        {selectedUser.role_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sections */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Basic Info */}
                  <div className="vintsy-card p-6 space-y-4">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 size={12} />
                      Governance & Scope
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Assigned Role</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedUser.role_name}</p>
                      </div>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Property Scope</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedUser.property_scope}</p>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="vintsy-card p-6 space-y-4">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Shield size={12} />
                      Security & Access
                    </h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <Lock size={16} className="text-zinc-400" />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">MFA Status</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Enabled</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <History size={16} className="text-zinc-400" />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Last Login</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button className="px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                        Reset Password
                      </button>
                      <button className="px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                        Revoke Sessions
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-6 rounded-3xl border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/5 space-y-4">
                    <h5 className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={12} />
                      Danger Zone
                    </h5>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleUserStatus(selectedUser.id, selectedUser.status === 'Active' ? 'Suspended' : 'Active')}
                        className={`flex-1 px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          selectedUser.status === 'Active' 
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                        }`}
                      >
                        {selectedUser.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                      </button>
                      <button className="flex-1 px-4 py-3 rounded-2xl border border-red-200 dark:border-red-800 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                        Terminate User
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
