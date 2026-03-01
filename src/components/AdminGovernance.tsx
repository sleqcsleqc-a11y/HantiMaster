import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  Key, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronRight,
  UserPlus,
  Lock,
  Unlock,
  MoreVertical,
  Search,
  Filter,
  ArrowUpRight,
  Activity,
  LayoutDashboard,
  ShieldAlert,
  UserCheck,
  UserX,
  Settings,
  History,
  Fingerprint,
  Database,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User, Role, PermissionRequest, AuditLog } from '../types';

type GovernanceTab = 
  | 'dashboard' 
  | 'users' 
  | 'roles' 
  | 'matrix' 
  | 'requests' 
  | 'security' 
  | 'rules';

export const AdminGovernance: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<GovernanceTab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [matrix, setMatrix] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [highRiskAction, setHighRiskAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    riskLevel: 'High' | 'Critical';
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, rolesData, requestsData, auditData, matrixData] = await Promise.all([
        api.getGovernanceStats(),
        api.getGovernanceUsers(),
        api.getRoles(),
        api.getPermissionRequests(),
        api.getAuditLogs(),
        api.getGovernanceMatrix()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setRoles(rolesData);
      setRequests(requestsData);
      setAuditLogs(auditData);
      setMatrix(matrixData);
    } catch (error) {
      console.error("Failed to load governance data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestReview = async (requestId: number, status: 'Approved' | 'Denied', expirationDate?: string) => {
    await api.reviewPermissionRequest(requestId, { 
      status, 
      reviewed_by: currentUser?.id,
      expiration_date: expirationDate
    });
    loadData();
  };

  if (!hasPermission('ADMIN_GOVERNANCE', 'view')) {
    return (
      <div className="p-8 h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-zinc-400" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Access Restricted</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
            You do not have the required permissions to access the Admin Control Center.
          </p>
        </div>
      </div>
    );
  }

  const sidebarSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
      ]
    },
    {
      title: 'User Governance',
      items: [
        { id: 'users', label: 'All Users', icon: Users },
        { id: 'roles', label: 'Role Management', icon: Shield },
        { id: 'matrix', label: 'Permission Matrix', icon: Database },
      ]
    },
    {
      title: 'Requests',
      items: [
        { id: 'requests', label: 'Permission Requests', icon: Key },
      ]
    },
    {
      title: 'Security',
      items: [
        { id: 'security', label: 'Security & Audit', icon: ShieldAlert },
      ]
    },
    {
      title: 'System Rules',
      items: [
        { id: 'rules', label: 'System Rules', icon: Settings },
      ]
    }
  ];

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white dark:bg-zinc-950">
      {/* Local Sidebar */}
      <aside className="w-64 border-r border-zinc-100 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="p-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Admin Control</h3>
          <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">Governance Hub</p>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
          {sidebarSections.map(section => (
            <div key={section.title} className="space-y-1">
              <h4 className="px-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                {section.title}
              </h4>
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === item.id 
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex-1">
              <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">System Status</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Operational • v2.4.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-zinc-50/30 dark:bg-zinc-950/30">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-8"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-900/30', tab: 'users' },
                  { label: 'Suspended', value: stats?.suspended_users, icon: UserX, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-100 dark:border-red-900/30', tab: 'users' },
                  { label: 'Pending Requests', value: stats?.pending_requests, icon: Key, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-100 dark:border-orange-900/30', tab: 'requests' },
                  { label: 'Risk Alerts', value: 2, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/10', border: 'border-rose-100 dark:border-rose-900/30', tab: 'security' },
                  { label: 'Expiring Access', value: 5, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-100 dark:border-amber-900/30', tab: 'requests' },
                ].map(stat => (
                  <button 
                    key={stat.label} 
                    onClick={() => setActiveTab(stat.tab as any)}
                    className={`vintsy-card p-5 text-left hover:scale-[1.02] transition-transform ${stat.bg} ${stat.border}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`${stat.color} p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm`}>
                        <stat.icon size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-zinc-400" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stat.value || 0}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Role Distribution Chart */}
                <div className="lg:col-span-2 vintsy-card p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Role Distribution</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">User count per assigned role</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500"><Filter size={14} /></button>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.role_distribution || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="role" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#18181b', 
                            border: 'none', 
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="vintsy-card p-8">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-6">Recent Governance Activity</h4>
                  <div className="space-y-6">
                    {[
                      { user: 'Admin', action: 'granted finance.export_report', target: 'John D.', time: '10m ago', icon: Key, color: 'text-violet-600' },
                      { user: 'HR Manager', action: 'suspended user', target: 'Sarah M.', time: '1h ago', icon: UserX, color: 'text-red-600' },
                      { user: 'System', action: 'denied permission request', target: 'Finance Team', time: '3h ago', icon: XCircle, color: 'text-orange-600' },
                      { user: 'Admin', action: 'updated role hierarchy', target: 'Staff', time: '5h ago', icon: Shield, color: 'text-blue-600' },
                      { user: 'Sarah M.', action: 'requested access', target: 'Maintenance', time: '8h ago', icon: Info, color: 'text-amber-600' },
                    ].map((activity, i) => (
                      <div key={i} className="flex gap-4">
                        <div className={`w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center ${activity.color} shrink-0`}>
                          <activity.icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-900 dark:text-white leading-relaxed">
                            <span className="font-bold">{activity.user}</span> {activity.action} <span className="font-bold">{activity.target}</span>
                          </p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-8 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-violet-600 transition-colors border-t border-zinc-100 dark:border-zinc-800">
                    View Full Audit Log
                  </button>
                </div>
              </div>

              {/* Quick Actions & System Health */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="vintsy-card p-8">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-6">Security Monitoring</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">Failed Login Threshold</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">3 attempts from IP 192.168.1.45</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-bold uppercase tracking-widest text-violet-600 hover:underline">Investigate</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                          <Fingerprint size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">MFA Compliance</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">85% of users have MFA enabled</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-bold uppercase tracking-widest text-violet-600 hover:underline">Enforce</button>
                    </div>
                  </div>
                </div>

                <div className="vintsy-card p-8">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-6">System Housekeeping</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group">
                      <History size={20} className="text-zinc-400 group-hover:text-violet-600 mb-3" />
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Rotate API Keys</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Last rotated 30 days ago</p>
                    </button>
                    <button className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group">
                      <Database size={20} className="text-zinc-400 group-hover:text-violet-600 mb-3" />
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Clean Audit Logs</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Logs older than 90 days</p>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-white">User Governance</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage user accounts, roles, and security status</p>
                </div>
                <button className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <UserPlus size={14} />
                  Add New User
                </button>
              </div>

              <div className="vintsy-card overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-4 items-center justify-between">
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search by name, email..." 
                      className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 outline-none">
                      <option>All Roles</option>
                      {roles.map(r => <option key={r.id}>{r.name}</option>)}
                    </select>
                    <select className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 outline-none">
                      <option>All Status</option>
                      <option>Active</option>
                      <option>Suspended</option>
                      <option>Locked</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">MFA</th>
                        <th className="px-6 py-4">Last Login</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {users.map(u => (
                        <tr 
                          key={u.id} 
                          onClick={() => setSelectedUser(u)}
                          className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-400 font-bold text-xs">
                                {u.first_name[0]}{u.last_name[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white">{u.first_name} {u.last_name}</p>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              {u.role_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                              u.status === 'Active' 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                                : u.status === 'Suspended'
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
                                : 'bg-zinc-50 dark:bg-zinc-900/20 text-zinc-700 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.mfa_enabled ? (
                              <Fingerprint size={16} className="text-emerald-500" />
                            ) : (
                              <Fingerprint size={16} className="text-zinc-300 dark:text-zinc-700" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                            {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <button className="p-2 text-zinc-400 hover:text-violet-600 transition-colors">
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
            </motion.div>
          )}
            <motion.div
              key="roles"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Role Management</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Define system roles and their baseline permissions</p>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition-colors">
                    Clone Role
                  </button>
                  <button className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest">
                    <Shield size={14} />
                    Create New Role
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {roles.map(role => (
                  <div 
                    key={role.id} 
                    onClick={() => setSelectedRole(role)}
                    className="vintsy-card p-6 flex items-center justify-between group cursor-pointer hover:border-violet-500/30 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role.is_locked ? 'bg-zinc-100 text-zinc-400' : 'bg-violet-50 text-violet-600'} border border-zinc-100 dark:border-zinc-800`}>
                        {role.is_locked ? <Lock size={20} /> : <Shield size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h5 className="text-sm font-bold text-zinc-900 dark:text-white">{role.name}</h5>
                          {role.is_locked && (
                            <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[8px] font-bold uppercase tracking-widest text-zinc-500">System Locked</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Assigned Users</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{users.filter(u => u.role_id === role.id).length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Risk Level</p>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          role.name === 'System Administrator' ? 'text-rose-600' : 
                          role.name === 'Finance Manager' ? 'text-orange-600' : 'text-emerald-600'
                        }`}>
                          {role.name === 'System Administrator' ? 'Critical' : 
                           role.name === 'Finance Manager' ? 'High' : 'Medium'}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-zinc-300 group-hover:text-violet-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Permission Matrix</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Interactive grid of all role-based permissions</p>
                </div>
                <button 
                  onClick={() => loadData()}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-violet-600 transition-colors"
                >
                  <Activity size={16} />
                </button>
              </div>

              <div className="vintsy-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 sticky left-0 bg-zinc-50 dark:bg-zinc-800 z-10 w-48">
                          Module / Action
                        </th>
                        {matrix?.roles.map((role: any) => (
                          <th key={role.id} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 min-w-[120px] text-center">
                            {role.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {matrix?.permissions.map((perm: any) => (
                        <tr key={perm.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-4 sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r border-zinc-100 dark:border-zinc-800">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white">{perm.module}</p>
                            <p className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{perm.action}</p>
                          </td>
                          {matrix?.roles.map((role: any) => {
                            const isAllowed = matrix.mappings.some((m: any) => m.role_id === role.id && m.permission_id === perm.id);
                            return (
                              <td key={role.id} className="px-6 py-4 text-center">
                                <button 
                                  onClick={async () => {
                                    if (role.is_locked) return;
                                    await api.updateRolePermission(role.id, perm.id, !isAllowed);
                                    loadData();
                                  }}
                                  disabled={role.is_locked}
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                    isAllowed 
                                      ? 'bg-emerald-500 text-white' 
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-700'
                                  } ${role.is_locked ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}`}
                                >
                                  {isAllowed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Permission Requests</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Review and approve user access escalation requests</p>
                </div>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                  <button className="px-4 py-1.5 rounded-lg bg-white dark:bg-zinc-700 text-[10px] font-bold uppercase tracking-widest text-violet-600 shadow-sm">Pending</button>
                  <button className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500">Approved</button>
                  <button className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500">Denied</button>
                </div>
              </div>

              <div className="space-y-4">
                {requests.length === 0 ? (
                  <div className="vintsy-card p-12 text-center">
                    <CheckCircle2 size={48} className="mx-auto text-zinc-200 mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">No pending permission requests.</p>
                  </div>
                ) : (
                  requests.map(req => (
                    <div key={req.id} className="vintsy-card p-6 flex items-center gap-6 group hover:border-violet-500/30 transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 border border-orange-100 dark:border-orange-800">
                        <Key size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{req.user_name}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Requested</span>
                          <span className="px-2 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-[9px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800">
                            {req.module} • {req.action}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">"{req.justification}"</p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            Submitted {new Date(req.created_at).toLocaleString()}
                          </p>
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${
                            req.module === 'Finance' ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            Impact: {req.module === 'Finance' ? 'High' : 'Medium'}
                          </span>
                        </div>
                      </div>
                      {req.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleRequestReview(req.id, 'Denied')}
                            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => handleRequestReview(req.id, 'Approved')}
                            className="px-4 py-2 rounded-xl bg-violet-700 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-violet-800 transition-colors shadow-md"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Security & Audit</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Monitor system alerts and track all administrative actions</p>
                </div>
                <button className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition-colors">
                  Export Audit Log
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Security Alerts</h5>
                  <div className="space-y-4">
                    {[
                      { title: 'Failed Login Threshold', desc: '3 attempts from IP 192.168.1.45', time: '2h ago', risk: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50' },
                      { title: 'Admin Role Assigned', desc: 'John D. assigned Admin role to Sarah M.', time: '5h ago', risk: 'Critical', color: 'text-rose-600', bg: 'bg-rose-50' },
                      { title: 'Suspicious Geographic Login', desc: 'Login from unusual location (Singapore)', time: '1d ago', risk: 'High', color: 'text-orange-600', bg: 'bg-orange-50' },
                    ].map((alert, i) => (
                      <div key={i} className="vintsy-card p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${alert.bg} dark:bg-zinc-800 flex items-center justify-center ${alert.color}`}>
                          <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{alert.title}</p>
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${alert.color}`}>{alert.risk}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{alert.desc}</p>
                          <p className="text-[9px] text-zinc-400 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Recent Audit Logs</h5>
                  <div className="vintsy-card overflow-hidden">
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {auditLogs.slice(0, 10).map(log => (
                        <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <Activity size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-900 dark:text-white truncate">
                              <span className="font-bold">{log.user_name || 'System'}</span> {log.action}
                            </p>
                            <p className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-zinc-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-white">System Rules</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Configure global security policies and system behavior</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="vintsy-card p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Lock size={20} className="text-violet-600" />
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Password Policy</h5>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Minimum Length</p>
                      <input type="number" defaultValue={12} className="w-16 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-center" />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Require Complexity</p>
                      <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Rotation Period (Days)</p>
                      <input type="number" defaultValue={90} className="w-16 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-center" />
                    </div>
                  </div>
                </div>

                <div className="vintsy-card p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Fingerprint size={20} className="text-violet-600" />
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest">MFA Settings</h5>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Enforce for Admins</p>
                      <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Enforce for Finance</p>
                      <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Optional for Others</p>
                      <div className="w-10 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full relative cursor-pointer">
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="vintsy-card p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={20} className="text-violet-600" />
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Role Hierarchy</h5>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-500 leading-relaxed">Define inheritance rules between roles to simplify permission management.</p>
                    <button className="w-full py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition-colors">
                      Configure Hierarchy
                    </button>
                  </div>
                </div>

                <div className="vintsy-card p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Key size={20} className="text-violet-600" />
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest">API & Session</h5>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Session Timeout (Min)</p>
                      <input type="number" defaultValue={30} className="w-16 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-center" />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Token Expiration (Days)</p>
                      <input type="number" defaultValue={7} className="w-16 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-center" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* User Detail Slide-over */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-400 font-bold text-xl">
                      {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedUser.first_name} {selectedUser.last_name}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <XCircle size={24} className="text-zinc-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Account Status</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{selectedUser.status}</p>
                    </div>
                    <button 
                      onClick={async () => {
                        const newStatus = selectedUser.status === 'Active' ? 'Suspended' : 'Active';
                        await api.updateGovernanceUser(selectedUser.id, { status: newStatus }, currentUser?.id);
                        setSelectedUser({ ...selectedUser, status: newStatus });
                        loadData();
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        selectedUser.status === 'Active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {selectedUser.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>

                  {/* Role & Permissions */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Role & Permissions</h4>
                    <div className="vintsy-card p-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Primary Role</p>
                        <select 
                          value={selectedUser.role_id}
                          onChange={async (e) => {
                            const newRoleId = parseInt(e.target.value);
                            await api.updateGovernanceUser(selectedUser.id, { role_id: newRoleId }, currentUser?.id);
                            const newRole = roles.find(r => r.id === newRoleId);
                            setSelectedUser({ ...selectedUser, role_id: newRoleId, role_name: newRole?.name || '' });
                            loadData();
                          }}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Overrides</p>
                          <button className="text-[10px] font-bold text-violet-600 hover:underline">Manage</button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                            <span className="text-zinc-600 dark:text-zinc-400">finance.export_report</span>
                            <span className="text-emerald-600 font-bold uppercase text-[9px]">Granted</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Security</h4>
                    <div className="vintsy-card p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Fingerprint size={16} className={selectedUser.mfa_enabled ? 'text-emerald-500' : 'text-zinc-300'} />
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">MFA Status</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedUser.mfa_enabled ? 'text-emerald-600' : 'text-zinc-400'}`}>
                          {selectedUser.mfa_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Clock size={16} className="text-zinc-400" />
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">Last Login</p>
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                        <button 
                          onClick={() => setHighRiskAction({
                            title: 'Reset User Password',
                            description: `Are you sure you want to trigger a password reset for ${selectedUser.first_name}? They will be logged out of all devices.`,
                            riskLevel: 'High',
                            onConfirm: () => {
                              // Logic for password reset
                              setHighRiskAction(null);
                            }
                          })}
                          className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition-colors"
                        >
                          Reset Password
                        </button>
                        <button 
                          onClick={() => setHighRiskAction({
                            title: 'Revoke All Sessions',
                            description: `This will immediately terminate all active sessions for ${selectedUser.first_name}. They will need to log in again.`,
                            riskLevel: 'High',
                            onConfirm: () => {
                              // Logic for session revocation
                              setHighRiskAction(null);
                            }
                          })}
                          className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Revoke Sessions
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Activity History */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Recent Activity</h4>
                    <div className="space-y-3">
                      {[
                        { action: 'Logged in from new IP', time: '2h ago', icon: Activity },
                        { action: 'Requested finance.export_report', time: '1d ago', icon: Key },
                        { action: 'Password changed', time: '5d ago', icon: Lock },
                      ].map((act, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <div className="w-6 h-6 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <act.icon size={12} />
                          </div>
                          <div className="flex-1">
                            <p className="text-zinc-900 dark:text-white">{act.action}</p>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{act.time}</p>
                          </div>
                        </div>
                      ))}
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
