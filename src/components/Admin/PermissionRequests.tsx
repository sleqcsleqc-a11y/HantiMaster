import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Shield, 
  Calendar, 
  FileText, 
  MoreVertical, 
  ChevronRight,
  Search,
  Filter,
  Activity,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PermissionRequest } from '../../types';

export const PermissionRequests: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Denied' | 'Expired'>('Pending');
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPermissionRequests();
      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [expirationDate, setExpirationDate] = useState<string>('');

  const handleReview = async (requestId: number, status: 'Approved' | 'Denied') => {
    await api.reviewPermissionRequest(requestId, { 
      status, 
      reviewed_by: currentUser?.id,
      expiration_date: expirationDate || null
    });
    loadData();
    setIsReviewOpen(false);
    setExpirationDate('');
    addToast(`Request ${status.toLowerCase()} successfully`, 'success');
  };

  const filteredRequests = requests.filter(r => r.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Tabs & Filters */}
      <div className="vintsy-card p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 w-full md:w-auto">
          {['Pending', 'Approved', 'Denied', 'Expired'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-400 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search requests..." 
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <button className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />)}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="vintsy-card p-16 text-center">
            <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-200">
              <CheckCircle2 size={40} />
            </div>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No {activeTab} Requests</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">All permission requests have been processed for this category.</p>
          </div>
        ) : (
          filteredRequests.map(req => (
            <motion.div 
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="vintsy-card p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-violet-200 dark:hover:border-violet-800 transition-all cursor-pointer"
              onClick={() => {
                setSelectedRequest(req);
                setIsReviewOpen(true);
              }}
            >
              <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 border border-orange-100 dark:border-orange-800 shadow-sm group-hover:scale-110 transition-transform">
                <Key size={28} />
              </div>
              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">{req.user_name}</h4>
                  <span className="hidden md:block w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-[9px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800">
                      {req.module} • {req.action}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                      req.module.includes('FINANCE') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {req.module.includes('FINANCE') ? 'High Risk' : 'Standard'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic font-medium">"{req.justification}"</p>
                <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(req.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Activity size={12} /> Priority: Medium</span>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end gap-3">
                {activeTab === 'Pending' ? (
                  <div className="flex gap-2">
                    <button className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                      Decline
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20">
                      Approve
                    </button>
                  </div>
                ) : (
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {req.status}
                  </div>
                )}
                <ChevronRight size={18} className="text-zinc-300 group-hover:text-violet-500 transition-colors" />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Review Slide-over */}
      <AnimatePresence>
        {isReviewOpen && selectedRequest && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white dark:bg-zinc-900 shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                    <Key size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Review Permission Request</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Governance approval workflow</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReviewOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Risk Analysis */}
                <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle size={20} />
                    <h5 className="text-sm font-bold uppercase tracking-widest">Risk Analysis Summary</h5>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/30">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Impact Level</p>
                      <p className="text-sm font-bold text-red-600">High Impact</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/30">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Module Risk</p>
                      <p className="text-sm font-bold text-red-600">Sensitive Data</p>
                    </div>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium leading-relaxed">
                    Granting this permission allows the user to export financial reports. This action is audited and requires justification.
                  </p>
                </div>

                {/* Request Details */}
                <div className="space-y-6">
                  <div className="vintsy-card p-6 space-y-6">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} />
                      Request Details
                    </h5>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">User</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{selectedRequest.user_name}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Permission</span>
                        <span className="px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-widest border border-violet-100">
                          {selectedRequest.module} • {selectedRequest.action}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Submitted</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{new Date(selectedRequest.created_at).toLocaleString()}</span>
                      </div>
                      <div className="space-y-2 pt-2">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Expiration Date (Optional)</span>
                        <input 
                          type="date"
                          value={expirationDate}
                          onChange={e => setExpirationDate(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                      <div className="space-y-2 pt-2">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Justification</span>
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 italic">
                          "{selectedRequest.justification}"
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Past History */}
                  <div className="vintsy-card p-6 space-y-4">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={14} />
                      User Request History
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">2 Approved Requests</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <XCircle size={14} className="text-red-500" />
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">0 Denied Requests</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex flex-col gap-4">
                {selectedRequest.status === 'Pending' ? (
                  <>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleReview(selectedRequest.id, 'Denied')}
                        className="flex-1 px-8 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                      >
                        Deny Request
                      </button>
                      <button 
                        onClick={() => handleReview(selectedRequest.id, 'Approved')}
                        className="flex-1 px-8 py-4 rounded-2xl bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20"
                      >
                        Approve Request
                      </button>
                    </div>
                    <button className="w-full px-8 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                      Request More Information
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsReviewOpen(false)}
                    className="w-full px-8 py-4 rounded-2xl bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Close Review
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
