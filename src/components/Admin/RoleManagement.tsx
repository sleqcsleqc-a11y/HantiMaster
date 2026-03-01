import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Plus, 
  Copy, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Check, 
  X,
  AlertTriangle,
  Info,
  Database,
  Users,
  Settings,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckSquare,
  Square
} from 'lucide-react';
import { api } from '../../services/api';
import { Role } from '../../types';

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, matrixData] = await Promise.all([
        api.getRoles(),
        api.getPermissionMatrix()
      ]);
      setRoles(rolesData);
      setPermissions(matrixData.permissions);
      setRolePermissions(matrixData.rolePermissions);
    } catch (error) {
      console.error("Failed to load roles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePermission = async (roleId: number, permissionId: number, isGranted: boolean) => {
    await api.updatePermissionMatrix({
      role_id: roleId,
      permission_id: permissionId,
      action: isGranted ? 'revoke' : 'grant'
    });
    loadData();
  };

  const modules = Array.from(new Set(permissions.map(p => p.module as string)));

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-600 rounded-2xl text-white shadow-lg shadow-violet-600/20">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Role Management</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Define system roles and module access levels</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
            <Copy size={14} />
            Clone Role
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20">
            <Plus size={14} />
            Create Role
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="vintsy-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              <th className="px-8 py-5">Role Name</th>
              <th className="px-8 py-5">Description</th>
              <th className="px-8 py-5">Risk Level</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {roles.map(role => (
              <tr 
                key={role.id} 
                className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedRole(role);
                  setIsEditorOpen(true);
                }}
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${role.is_locked ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-violet-600'} dark:bg-opacity-10`}>
                      {role.is_locked ? <Lock size={14} /> : <Shield size={14} />}
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 transition-colors">{role.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs truncate">{role.description}</p>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                    role.name.includes('Admin') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {role.name.includes('Admin') ? 'Critical' : 'Standard'}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {role.is_locked ? (
                      <span className="flex items-center gap-1 text-amber-600"><Lock size={12} /> Locked</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600"><Unlock size={12} /> Editable</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="p-2 text-zinc-400 hover:text-violet-600 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Editor Slide-over */}
      <AnimatePresence>
        {isEditorOpen && selectedRole && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditorOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-3xl bg-white dark:bg-zinc-900 shadow-2xl z-[70] flex flex-col"
            >
              {/* Header */}
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Role Editor: {selectedRole.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Configure granular permissions for this role</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {selectedRole.is_locked && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl flex items-center gap-4">
                    <AlertTriangle className="text-amber-600" size={20} />
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-widest">
                      This role is locked for governance compliance. Permissions cannot be modified.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-8">
                  {modules.map(module => (
                    <div key={module} className="vintsy-card p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2">
                          <Database size={16} className="text-violet-500" />
                          {(module as string).replace('_', ' ')} Module
                        </h4>
                        <div className="h-px flex-1 mx-6 bg-zinc-100 dark:bg-zinc-800" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {permissions.filter(p => p.module === module).map(perm => {
                          const isGranted = rolePermissions.some(rp => rp.role_id === selectedRole.id && rp.permission_id === perm.id);
                          return (
                            <button
                              key={perm.id}
                              disabled={selectedRole.is_locked}
                              onClick={() => handleTogglePermission(selectedRole.id, perm.id, isGranted)}
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                isGranted 
                                  ? 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400' 
                                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-400'
                              } ${selectedRole.is_locked ? 'cursor-not-allowed opacity-80' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                              <div className="flex items-center gap-3">
                                {isGranted ? <CheckSquare size={18} /> : <Square size={18} />}
                                <span className="text-[10px] font-bold uppercase tracking-widest">{perm.action}</span>
                              </div>
                              {isGranted && <Check size={14} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex justify-end gap-4">
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="px-8 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Close Editor
                </button>
                {!selectedRole.is_locked && (
                  <button className="px-8 py-3 rounded-2xl bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20">
                    Save Changes
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
