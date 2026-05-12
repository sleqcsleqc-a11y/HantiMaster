import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Lock,
  Building2,
  Key
} from 'lucide-react';
import { api } from '../services/api';
import { FinanceStats } from '../types';
import { RequestPermissionModal } from './RequestPermissionModal';

export const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    if (hasPermission('FINANCE', 'view')) {
      api.getFinanceStats(user?.id).then(data => {
        setStats(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [hasPermission, user]);

  const kpis = [
    { 
      label: user?.role_name === 'Property Owner' ? 'Portfolio Value' : 'Total Revenue', 
      value: user?.role_name === 'Property Owner' 
        ? `$${((stats?.total_revenue ?? 0) * 12 * 15).toLocaleString()}` // Mock valuation based on revenue
        : `$${(stats?.total_revenue ?? 0).toLocaleString()}`, 
      change: '+12.5%', 
      trend: 'up',
      icon: user?.role_name === 'Property Owner' ? Building2 : TrendingUp,
      permission: 'FINANCE'
    },
    { 
      label: user?.role_name === 'Property Owner' ? 'Occupancy Rate' : 'Active Tenants', 
      value: user?.role_name === 'Property Owner' 
        ? `${Math.round(((stats?.active_tenants ?? 0) / ((stats?.active_tenants ?? 1) + 2)) * 100)}%` // Mock occupancy
        : (stats?.active_tenants.toString() ?? '0'), 
      change: '+3%', 
      trend: 'up',
      icon: Users,
      permission: 'TENANT_MANAGEMENT'
    },
    { 
      label: 'Pending Payments', 
      value: stats ? `$${(stats.pending_payments ?? 0).toLocaleString()}` : '$0', 
      change: '-2.4%', 
      trend: 'down',
      icon: Clock,
      permission: 'FINANCE'
    },
    { 
      label: 'Open Requests', 
      value: '12', 
      change: '+2', 
      trend: 'up',
      icon: AlertCircle,
      permission: 'MAINTENANCE'
    },
  ].filter(kpi => hasPermission(kpi.permission, 'view'));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Welcome back, {user?.first_name}</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Here's what's happening with your portfolio today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="vintsy-card p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 p-2.5 rounded-xl border border-violet-100 dark:border-zinc-800 shadow-sm">
                <kpi.icon size={20} />
              </div>
              <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                kpi.trend === 'up' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
              }`}>
                {kpi.change}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
        {kpis.length === 0 && (
          <div className="lg:col-span-4 p-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center">
            <Lock size={32} className="mx-auto text-zinc-400 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">No high-level metrics available for your role.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 vintsy-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Recent Activity</h3>
            <button className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-4 p-4 bg-violet-50/20 dark:bg-zinc-800/30 border border-violet-50 dark:border-zinc-800 rounded-2xl group hover:border-violet-300 dark:hover:border-violet-500 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-700 border border-violet-100 dark:border-zinc-600 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-violet-700 transition-all duration-300 shadow-sm">
                  <Users size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">New lease signed for Unit 101</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-medium">2 hours ago • John Doe</p>
                </div>
                <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        <div className="vintsy-card p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8">Maintenance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Urgent Repairs</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">03</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <div className="h-full bg-red-500 w-1/4" />
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">In Progress</span>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">05</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <div className="h-full bg-orange-500 w-1/2" />
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Completed</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">24</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full mt-8 vintsy-button-secondary text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Key size={14} />
            Request Permission
          </button>
        </div>
      </div>
      
      <RequestPermissionModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </div>
  );
};
