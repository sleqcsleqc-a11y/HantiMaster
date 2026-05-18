import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { LeasingApplication } from '../types';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Briefcase,
  DollarSign,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../contexts/ToastContext';

export const Applications: React.FC = () => {
  const [applications, setApplications] = useState<LeasingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { addToast } = useToast();

  const statuses = ['Pending', 'Reviewing', 'Approved', 'Waitlisted', 'Rejected'];

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    try {
      const data = await api.getLeasingApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      addToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.updateLeasingApplication(id, { status: newStatus });
      addToast(`Status updated to ${newStatus}`, 'success');
      fetchApplications();
    } catch (error) {
      addToast('Failed to update status', 'error');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.applicant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.properties?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">LEASING PIPELINE</h2>
          <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs mt-1">Application Tracking & Onboarding</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search applicants, properties..."
            className="vintsy-input pl-12 w-full bg-white/50 backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              statusFilter === 'All' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 border border-zinc-200'
            }`}
          >
            All
          </button>
          {statuses.map(stat => (
            <button
              key={stat}
              onClick={() => setStatusFilter(stat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                statusFilter === stat 
                  ? (stat === 'Approved' ? 'bg-emerald-500 text-white' : 
                     stat === 'Rejected' ? 'bg-red-500 text-white' : 
                     stat === 'Reviewing' ? 'bg-blue-500 text-white' : 
                     stat === 'Waitlisted' ? 'bg-amber-500 text-white' : 
                     'bg-zinc-900 text-white')
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban / List Board */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="vintsy-card p-12 flex flex-col items-center justify-center text-center space-y-4">
           <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mb-4">
              <Users size={32} />
           </div>
           <h3 className="text-xl font-black text-zinc-900">No Applications Yet</h3>
           <p className="text-zinc-500 max-w-md">Your leasing pipeline is empty. When prospective tenants apply for properties, their applications will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
           {statuses.map(colStatus => (
             <div key={colStatus} className="bg-zinc-50/50 rounded-3xl border border-zinc-100 p-4 min-h-[500px]">
                <div className="flex justify-between items-center mb-6 px-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{colStatus}</h4>
                   <span className="text-xs font-bold text-zinc-400">
                     {filteredApplications.filter(a => a.status === colStatus).length}
                   </span>
                </div>
                <div className="space-y-4">
                   <AnimatePresence>
                     {filteredApplications.filter(a => a.status === colStatus).map(app => (
                       <motion.div
                         layout
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         key={app.id}
                         className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow group relative"
                       >
                          <div className="flex justify-between items-start mb-3">
                             <div className="font-black text-sm text-zinc-900 truncate pr-4">{app.applicant_name}</div>
                             <select
                                className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 text-[10px] bg-zinc-100 text-zinc-600 rounded p-1 font-bold outline-none cursor-pointer"
                                value={app.status}
                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                             >
                               {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </div>
                          
                          <div className="text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-4 truncate">
                             {app.properties?.name} {app.units ? `- Unit ${app.units.unit_number}` : ''}
                          </div>
                          
                          <div className="space-y-2 mb-4">
                             <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <DollarSign size={14} />
                                <span className="font-medium">${app.income_amount?.toLocaleString() || 'N/A'}/mo</span>
                             </div>
                             <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Briefcase size={14} />
                                <span className="font-medium truncate">{app.employment_status || 'Unspecified'}</span>
                             </div>
                             {app.credit_score && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                   <FileText size={14} />
                                   <span className="font-medium">Credit: {app.credit_score}</span>
                                </div>
                             )}
                          </div>

                          <div className="flex items-center gap-3 pt-4 border-t border-zinc-50 text-zinc-400">
                             <a href={`mailto:${app.applicant_email}`} className="hover:text-violet-600 transition-colors">
                                <Mail size={16} />
                             </a>
                             {app.applicant_phone && (
                               <a href={`tel:${app.applicant_phone}`} className="hover:text-violet-600 transition-colors">
                                  <Phone size={16} />
                               </a>
                             )}
                             {app.status === 'Approved' && (
                               <button 
                                 onClick={() => {
                                   addToast('Conversion feature is in development', 'info');
                                   // TODO: implement tenant creation workflow
                                 }}
                                 className="ml-auto text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full transition-colors flex items-center gap-1"
                               >
                                 <UserPlus size={12} />
                                 Convert
                               </button>
                             )}
                          </div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};
