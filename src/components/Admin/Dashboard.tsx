import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserX, 
  Key, 
  ShieldAlert, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Shield,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, auditData] = await Promise.all([
          api.getGovernanceStats(),
          api.getAuditLogs()
        ]);
        setStats(statsData);
        setAuditLogs(auditData.slice(0, 5));
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-4 h-32 bg-zinc-100 rounded-3xl" />
    <div className="grid grid-cols-2 gap-8 h-96 bg-zinc-100 rounded-3xl" />
  </div>;

  const summaryCards = [
    { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Suspended Accounts', value: stats?.suspended_users, icon: UserX, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { label: 'Pending Requests', value: stats?.pending_requests, icon: Key, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'High-Risk Alerts', value: 4, icon: ShieldAlert, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -4 }}
            className="vintsy-card p-6 group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${card.color} ${card.bg} p-3 rounded-2xl border ${card.border} shadow-sm group-hover:scale-110 transition-transform`}>
                <card.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                <TrendingUp size={12} />
                +12%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{card.label}</p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{card.value || 0}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Role Distribution */}
        <div className="vintsy-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Shield size={16} className="text-violet-500" />
              Role Distribution
            </h4>
            <button className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:underline">View Matrix</button>
          </div>
          <div className="space-y-6">
          {stats?.role_distribution?.map((role: any, idx: number) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-zinc-600">{role.role}</span>
                <span className="text-zinc-900">{role.count}</span>
              </div>
              <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(role.count / stats.total_users) * 100}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className="h-full bg-violet-600 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Governance Activity */}
      <div className="vintsy-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <History size={16} className="text-violet-500" />
            Recent Governance Activity
          </h4>
          <button className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:underline">View All Logs</button>
        </div>
        <div className="space-y-6">
          {auditLogs.map((log, idx) => (
            <div key={idx} className="flex gap-4 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-violet-500 transition-colors">
                  <Activity size={18} />
                </div>
                {idx !== auditLogs.length - 1 && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-6 bg-zinc-100" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <p className="text-sm font-bold text-zinc-900 mb-1">
                  <span className="text-violet-600">{log.user_name || 'System'}</span> {log.action}
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                  <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{log.entity_type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

      {/* Security Alerts Summary */}
      <div className="vintsy-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500" />
            Active Security Alerts
          </h4>
          <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-100">
            4 Critical Issues
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Suspicious Login', user: 'Unknown', risk: 'High', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            { title: 'Privilege Escalation', user: 'Sarah M.', risk: 'Medium', icon: Shield, color: 'text-orange-600', bg: 'bg-orange-50' },
            { title: 'Bulk Data Export', user: 'Frank F.', risk: 'Critical', icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map((alert, idx) => (
            <div key={idx} className={`${alert.bg} p-6 rounded-3xl border border-white/10 flex items-center gap-4`}>
              <div className={`${alert.color} p-3 rounded-2xl bg-white shadow-sm`}>
                <alert.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">{alert.title}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">User: {alert.user} • {alert.risk} Risk</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
