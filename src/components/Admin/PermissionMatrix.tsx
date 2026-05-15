import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Database, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  Info, 
  Search, 
  Filter, 
  Download,
  AlertTriangle,
  Activity,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

export const PermissionMatrix: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

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
      console.error("Failed to load matrix", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePermission = async (roleId: number, permissionId: number, isGranted: boolean) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.is_locked) return;

    await api.updatePermissionMatrix({
      role_id: roleId,
      permission_id: permissionId,
      action: isGranted ? 'revoke' : 'grant',
      admin_id: user?.id
    });
    loadData();
  };

  const modules = Array.from(new Set(permissions.map(p => p.module as string)));
  const filteredModules = modules.filter(m => (m as string).toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="vintsy-card p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search modules or permissions..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">
            <Download size={14} />
            Export Matrix
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="vintsy-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50">
                <th className="px-8 py-6 min-w-[300px] border-b border-zinc-100">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <Database size={14} />
                    Module & Permission
                  </div>
                </th>
                {roles.map(role => (
                  <th key={role.id} className="px-6 py-6 min-w-[150px] border-b border-zinc-100 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${role.is_locked ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-violet-600'} shadow-sm`}>
                        {role.is_locked ? <Lock size={14} /> : <Shield size={14} />}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 truncate max-w-[120px]">
                        {role.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredModules.map(module => (
                <React.Fragment key={module}>
                  {/* Module Header Row */}
                  <tr 
                    className="bg-zinc-50/30 cursor-pointer hover:bg-zinc-50 transition-colors"
                    onClick={() => setExpandedModule(expandedModule === module ? null : module)}
                  >
                    <td className="px-8 py-4 font-bold text-sm text-zinc-900 flex items-center gap-3">
                      {expandedModule === module ? <ChevronDown size={16} className="text-violet-500" /> : <ChevronRight size={16} className="text-zinc-400" />}
                      {(module as string).replace('_', ' ')}
                    </td>
                    {roles.map(role => (
                      <td key={role.id} className="px-6 py-4 text-center">
                        <div className="h-1 w-8 bg-zinc-200 rounded-full mx-auto" />
                      </td>
                    ))}
                  </tr>

                  {/* Permission Rows */}
                  {expandedModule === module && permissions.filter(p => p.module === module).map(perm => (
                    <motion.tr 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={perm.id} 
                      className="group hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-12 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{perm.action}</span>
                        </div>
                      </td>
                      {roles.map(role => {
                        const isGranted = rolePermissions.some(rp => rp.role_id === role.id && rp.permission_id === perm.id);
                        return (
                          <td key={role.id} className="px-6 py-4 text-center">
                            <button
                              disabled={role.is_locked}
                              onClick={() => handleTogglePermission(role.id, perm.id, isGranted)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto transition-all ${
                                isGranted 
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                  : 'bg-zinc-100 text-zinc-300'
                              } ${role.is_locked ? 'cursor-not-allowed opacity-50' : 'hover:scale-110 active:scale-90'}`}
                            >
                              {isGranted ? <Check size={16} /> : <X size={16} />}
                            </button>
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="vintsy-card p-6 flex items-center gap-6">
          <div className="p-4 bg-violet-50 rounded-2xl text-violet-600 border border-violet-100 shadow-sm">
            <Info size={24} />
          </div>
          <div>
            <h5 className="text-sm font-bold text-zinc-900 mb-1">Matrix Legend</h5>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Allowed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-200" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Denied</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Locked Role</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vintsy-card p-6 flex items-center gap-6">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100 shadow-sm">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h5 className="text-sm font-bold text-zinc-900 mb-1">Governance Warning</h5>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
              Changes to the permission matrix are logged and audited. Modifying critical roles like Finance or Admin requires secondary approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
