import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  Download, 
  Calendar, 
  ShieldCheck, 
  Info,
  ExternalLink,
  Clock,
  Eye,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Tenant } from '../../types';

export const TenantLease: React.FC = () => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          const tenantData = await api.getTenantByUserId(user.id);
          if (tenantData) {
            setTenant(tenantData);
          }
        } catch (error) {
          console.error("Failed to load lease data", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading lease details...</div>;

  const leaseTerms = [
    { label: 'Lease Start', value: tenant?.lease_start ? new Date(tenant.lease_start).toLocaleDateString() : 'N/A', icon: Calendar },
    { label: 'Lease End', value: tenant?.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : 'N/A', icon: Clock },
    { label: 'Monthly Rent', value: `$${tenant?.rent_amount?.toLocaleString() || '0'}`, icon: ShieldCheck },
    { label: 'Security Deposit', value: '$2,500', icon: Info }, // Mocked for now
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="mb-12">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-1">Documentation</h3>
        <p className="text-2xl font-bold text-zinc-900 tracking-tight">Lease & Documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lease Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="vintsy-card p-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">Lease Summary</h4>
            <div className="space-y-6">
              {leaseTerms.map((term) => (
                <div key={term.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                    <term.icon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{term.label}</p>
                    <p className="text-sm font-bold text-zinc-900">{term.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => alert('Downloading full lease agreement...')}
              className="w-full mt-10 vintsy-button-primary py-3 flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download Full Lease
            </button>
          </div>

          <div className="vintsy-card p-8 bg-emerald-50 border-emerald-100">
            <div className="flex items-center gap-3 mb-4 text-emerald-700">
              <ShieldCheck size={20} />
              <h4 className="text-sm font-bold uppercase tracking-widest">Renter's Insurance</h4>
            </div>
            <p className="text-xs text-emerald-800 font-medium leading-relaxed mb-6">
              Your insurance policy is active and expires on Dec 31, 2023.
            </p>
            <button className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              Update Policy <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="vintsy-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Shared Documents</h4>
              <button className="text-xs font-bold text-violet-600 hover:underline">Upload New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Community Rules.pdf', size: '1.2 MB', date: 'Oct 12, 2022', content: 'Community rules and regulations for all residents...' },
                { name: 'Move-in Checklist.pdf', size: '450 KB', date: 'Jan 01, 2023', content: 'Checklist for move-in inspection and key handover...' },
                { name: 'Utility Information.pdf', size: '890 KB', date: 'Jan 01, 2023', content: 'Contact details and setup instructions for electricity, water, and internet...' },
                { name: 'Parking Permit.pdf', size: '320 KB', date: 'Jan 05, 2023', content: 'Parking permit details for space #42...' },
              ].map((doc, index) => (
                <motion.div
                  key={doc.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-between group hover:border-violet-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-violet-600 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 truncate max-w-[120px]">{doc.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{doc.size} • {doc.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setViewingDoc(doc)}
                      className="p-2 text-zinc-300 hover:text-violet-600 transition-colors"
                      title="View Document"
                    >
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-zinc-300 hover:text-violet-600 transition-colors" title="Download">
                      <Download size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="vintsy-card p-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Community Notices</h4>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-violet-600 rounded-full" />
                  <p className="text-xs font-bold text-zinc-900">Trash Collection Update</p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Due to the holiday, trash collection will be delayed by one day this week.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-3xl w-full shadow-2xl border border-violet-100 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/20">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{viewingDoc.name}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Document Preview • {viewingDoc.size}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 min-h-[300px]">
                <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                  {viewingDoc.content}
                </p>
                <div className="mt-8 space-y-4">
                  <div className="h-4 bg-zinc-200 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-zinc-200 rounded-full w-1/2 animate-pulse" />
                  <div className="h-4 bg-zinc-200 rounded-full w-5/6 animate-pulse" />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all"
                >
                  Close Preview
                </button>
                <button className="flex-1 py-4 bg-violet-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-600/20">
                  Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
