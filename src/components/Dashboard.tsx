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

interface DashboardProps {
  onSelectProperty?: (id: number) => void;
  onSelectOwner?: (id: number) => void;
  setActiveTab?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectProperty, onSelectOwner, setActiveTab }) => {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const promises: Promise<any>[] = [];
        
        if (hasPermission('FINANCE', 'view')) {
          promises.push(api.getFinanceStats(user?.id).then(setStats));
        }
        
        // Always try to get activities if admin or manager
        promises.push(api.getAuditLogs().then(data => {
          // Sort by timestamp desc and take top 5
          const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setActivities(sorted.slice(0, 5));
        }));

        await Promise.all(promises);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [hasPermission, user]);

  const handleActivityClick = (activity: any) => {
    if (!setActiveTab) return;

    switch (activity.entity_type) {
      case 'Property':
        if (onSelectProperty && activity.entity_id) {
          onSelectProperty(activity.entity_id);
          setActiveTab('properties');
        } else {
          setActiveTab('properties');
        }
        break;
      case 'Owner':
        if (onSelectOwner && activity.entity_id) {
          onSelectOwner(activity.entity_id);
          setActiveTab('owners');
        } else {
          setActiveTab('owners');
        }
        break;
      case 'Tenant':
        setActiveTab('tenants');
        break;
      case 'MaintenanceRequest':
        setActiveTab('maintenance');
        break;
      case 'Task':
        setActiveTab('tasks');
        break;
      case 'LegalDocument':
        setActiveTab('lease');
        break;
      default:
        // Default mapping if type is unknown or general
        if (activity.action.toLowerCase().includes('property')) setActiveTab('properties');
        else if (activity.action.toLowerCase().includes('tenant')) setActiveTab('tenants');
        else if (activity.action.toLowerCase().includes('maintenance')) setActiveTab('maintenance');
        else if (activity.action.toLowerCase().includes('lease') || activity.action.toLowerCase().includes('document')) setActiveTab('lease');
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInMs = now.getTime() - then.getTime();
    const diffInHrs = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHrs < 1) {
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMins} minute${diffInMins === 1 ? '' : 's'} ago`;
    }
    if (diffInHrs < 24) {
      return `${diffInHrs} hour${diffInHrs === 1 ? '' : 's'} ago`;
    }
    const diffInDays = Math.floor(diffInHrs / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

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
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Welcome back, {user?.first_name}</h2>
        <p className="text-zinc-500 mt-1">Here's what's happening with your portfolio today.</p>
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
              <div className="text-violet-700 bg-violet-50 p-2.5 rounded-xl border border-violet-100 shadow-sm">
                <kpi.icon size={20} />
              </div>
              <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                kpi.trend === 'up' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                {kpi.change}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
        {kpis.length === 0 && (
          <div className="lg:col-span-4 p-12 bg-zinc-50 rounded-3xl border border-zinc-200 text-center">
            <Lock size={32} className="mx-auto text-zinc-400 mb-4" />
            <p className="text-zinc-500 text-sm font-medium">No high-level metrics available for your role.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 vintsy-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Activity</h3>
            <button className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <button 
                  key={index} 
                  onClick={() => handleActivityClick(activity)}
                  className="w-full flex items-center gap-4 p-4 bg-violet-50/20 border border-violet-50 rounded-2xl group hover:border-violet-300 hover:bg-white transition-all duration-300 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-violet-100 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-violet-700 transition-all duration-300 shadow-sm">
                    {activity.entity_type === 'Property' ? <Building2 size={18} /> : <Users size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-zinc-900 group-hover:text-violet-700 transition-colors">{activity.action}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                      {getTimeAgo(activity.timestamp)} • {activity.user_name}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-300 group-hover:text-violet-700 transition-colors" />
                </button>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No recent activity detected</p>
              </div>
            )}
          </div>
        </div>

        <div className="vintsy-card p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">Maintenance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Urgent Repairs</span>
                <span className="text-sm font-bold text-red-600">03</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                <div className="h-full bg-red-500 w-1/4" />
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <span className="text-sm text-zinc-600">In Progress</span>
                <span className="text-sm font-bold text-orange-600">05</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                <div className="h-full bg-orange-500 w-1/2" />
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="text-sm text-zinc-600">Completed</span>
                <span className="text-sm font-bold text-emerald-600">24</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
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
