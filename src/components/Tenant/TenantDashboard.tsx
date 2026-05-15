import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Wrench, 
  FileText, 
  MessageSquare,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { Tenant, MaintenanceRequest } from '../../types';

interface TenantDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          const tenantData = await api.getTenantByUserId(user.id);
          if (tenantData) {
            setTenant(tenantData);
            const requestsData = await api.getTenantMaintenanceRequests(tenantData.id);
            setRequests(requestsData.slice(0, 3));
          }
        } catch (error) {
          console.error("Failed to load tenant dashboard data", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading your portal...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Welcome home, {user?.first_name}</h2>
        <p className="text-zinc-500 mt-1">
          {tenant?.property_name} • Unit {tenant?.unit_number}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rent Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="vintsy-card p-8 bg-gradient-to-br from-violet-600 to-violet-800 text-white border-none shadow-xl shadow-violet-600/20"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <CreditCard size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              Paid
            </span>
          </div>
          <div className="space-y-1 mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-200">Monthly Rent</p>
            <p className="text-4xl font-bold tracking-tight">${tenant?.rent_amount?.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setActiveTab('payments')}
            className="w-full py-3 bg-white text-violet-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-violet-50 transition-colors shadow-lg"
          >
            Make a Payment
          </button>
        </motion.div>

        {/* Maintenance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="vintsy-card p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Active Requests</h3>
              <Wrench size={20} className="text-violet-600" />
            </div>
            <div className="space-y-4">
              {requests.length > 0 ? (
                requests.map(req => (
                  <div key={req.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className={`w-2 h-2 rounded-full ${
                      req.status === 'Completed' ? 'bg-emerald-500' : 'bg-orange-500'
                    }`} />
                    <div className="flex-1 truncate">
                      <p className="text-xs font-bold text-zinc-900 truncate">{req.title}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{req.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 italic">No active maintenance requests.</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('maintenance')}
            className="w-full mt-6 vintsy-button-secondary text-[10px] uppercase tracking-widest"
          >
            Request Service
          </button>
        </motion.div>

        {/* Lease Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="vintsy-card p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Lease Info</h3>
              <FileText size={20} className="text-violet-600" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Ends On</span>
                <span className="text-xs font-bold text-zinc-900">
                  {tenant?.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Status</span>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('lease')}
            className="w-full mt-6 vintsy-button-secondary text-[10px] uppercase tracking-widest"
          >
            View Documents
          </button>
        </motion.div>
      </div>

      {/* Recent Communication */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 vintsy-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Announcements</h3>
            <button className="text-xs font-bold text-violet-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle size={16} className="text-violet-600" />
                <h4 className="text-sm font-bold text-zinc-900">Scheduled Maintenance: Water Main</h4>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Water will be temporarily unavailable on Tuesday between 10:00 AM and 2:00 PM for essential repairs.
              </p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-3">Posted 2 days ago</p>
            </div>
          </div>
        </div>

        <div className="vintsy-card p-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Quick Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={() => setActiveTab('communication')}
              className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-violet-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="text-violet-600" />
                <span className="text-xs font-bold text-zinc-900">Message Manager</span>
              </div>
              <ChevronRight size={16} className="text-zinc-300 group-hover:text-violet-600 transition-colors" />
            </button>
            <button 
              onClick={() => setActiveTab('lease')}
              className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-violet-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-violet-600" />
                <span className="text-xs font-bold text-zinc-900">Community Rules</span>
              </div>
              <ChevronRight size={16} className="text-zinc-300 group-hover:text-violet-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
