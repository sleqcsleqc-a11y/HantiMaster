import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { Vendor, WorkOrder } from '../../types';

interface VendorDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          const vendorData = await api.getVendorByUserId(user.id);
          if (vendorData) {
            setVendor(vendorData);
            const woData = await api.getVendorWorkOrders(vendorData.id);
            setWorkOrders(woData.slice(0, 5));
          }
        } catch (error) {
          console.error("Failed to load vendor dashboard data", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Initializing Vendor Portal...</div>;

  const stats = [
    { label: 'Active Jobs', value: workOrders.filter(wo => wo.status === 'In Progress').length, icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { label: 'Completed', value: workOrders.filter(wo => wo.status === 'Completed').length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Earnings', value: '$12,450', icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
    { label: 'Avg Rating', value: vendor?.rating || '4.8', icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight tracking-tight">Welcome, {vendor?.company_name || user?.first_name}</h2>
        <p className="text-zinc-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
          {vendor?.category} • Certified Partner
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="vintsy-card p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.color} p-2.5 rounded-xl`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Work Orders */}
        <div className="lg:col-span-2 vintsy-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Current Assignments</h3>
            <button 
              onClick={() => setActiveTab('maintenance')}
              className="text-xs font-bold text-violet-600 hover:underline"
            >
              View All Work Orders
            </button>
          </div>
          <div className="space-y-4">
            {workOrders.length > 0 ? (
              workOrders.map((wo, index) => (
                <div 
                  key={wo.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-2xl group hover:border-violet-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-violet-700 group-hover:text-white transition-all">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{wo.request_title}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        {wo.property_name} • Unit {wo.unit_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                      wo.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {wo.status}
                    </span>
                    <button className="text-zinc-300 hover:text-violet-600 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-zinc-500 italic">No active jobs assigned yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats/Actions */}
        <div className="space-y-6">
          <div className="vintsy-card p-8 bg-zinc-900 text-white border-none">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Payment Status</h3>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pending Payout</p>
                <p className="text-3xl font-bold text-white">$1,200.00</p>
              </div>
              <div className="p-4 bg-zinc-800 rounded-2xl flex items-center gap-3">
                <Clock size={18} className="text-orange-400" />
                <p className="text-[10px] font-medium text-zinc-400 leading-relaxed">Next disbursement scheduled for Friday, Oct 13.</p>
              </div>
            </div>
          </div>

          <div className="vintsy-card p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Compliance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-zinc-700">Insurance</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-zinc-700">Certification</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
