import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowUpRight,
  X,
  ShieldCheck,
  Camera,
  FileText,
  Upload
} from 'lucide-react';
import { api } from '../../services/api';
import { Tenant } from '../../types';

export const TenantPayments: React.FC = () => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          const tenantData = await api.getTenantByUserId(user.id);
          if (tenantData) {
            setTenant(tenantData);
            const paymentsData = await api.getTenantPayments(tenantData.id);
            setPayments(paymentsData);
          }
        } catch (error) {
          console.error("Failed to load payment data", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !proofFile) return;
    
    setPaymentProcessing(true);
    try {
      await api.submitPaymentProof(tenant.id, tenant.rent_amount || 0, proofFile);
      setPaymentProcessing(false);
      setPaymentSuccess(true);
      
      // Refresh data
      const paymentsData = await api.getTenantPayments(tenant.id);
      setPayments(paymentsData);
      
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowPaymentModal(false);
        setProofFile(null);
      }, 3000);
    } catch (error) {
      console.error("Payment submission failed", error);
      alert("Failed to submit payment proof. Please try again.");
      setPaymentProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading payments...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Financial</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Rent & Payments</p>
        </div>
        <button 
          onClick={() => setShowPaymentModal(true)}
          className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest"
        >
          <Plus size={16} />
          Make a Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Balance */}
        <div className="lg:col-span-1 space-y-6">
          <div className="vintsy-card p-8 bg-zinc-900 text-white border-none shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-violet-600 p-3 rounded-2xl">
                <CreditCard size={24} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Next Due Date</p>
                <p className="text-sm font-bold">Oct 1, 2023</p>
              </div>
            </div>
            <div className="space-y-1 mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Balance</p>
              <p className="text-5xl font-bold tracking-tight">$0.00</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <p className="text-xs font-medium text-zinc-400">Your account is up to date.</p>
            </div>
          </div>

          <div className="vintsy-card p-6 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Payment Information</h4>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-900 dark:text-white mb-2">Bank Transfer Details</p>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500 uppercase tracking-widest">Bank</span>
                  <span className="text-zinc-900 dark:text-white font-bold">Vintsy Global Bank</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500 uppercase tracking-widest">Account Name</span>
                  <span className="text-zinc-900 dark:text-white font-bold">HantiMaster Property Mgmt</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500 uppercase tracking-widest">Account Number</span>
                  <span className="text-zinc-900 dark:text-white font-bold">0042 9981 2234</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 italic leading-relaxed">
              Please use your Unit Number as the payment reference. After transfer, upload your receipt below.
            </p>
          </div>
        </div>

        {/* Payment History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="vintsy-card p-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8">Payment History</h4>
            <div className="space-y-4">
              {payments.length > 0 ? (
                payments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 rounded-2xl group hover:border-violet-300 dark:hover:border-violet-500 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        payment.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {payment.status === 'Completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{payment.type} Payment</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                          {new Date(payment.date).toLocaleDateString()} • {payment.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">${payment.amount.toLocaleString()}</p>
                      <button className="p-2 text-zinc-400 hover:text-violet-600 transition-colors">
                        <Download size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertCircle size={32} className="mx-auto text-zinc-300 mb-4" />
                  <p className="text-sm text-zinc-500">No payment history found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-violet-100 dark:border-zinc-800"
            >
              {paymentSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Payment Successful!</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Your rent payment has been processed successfully.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/20">
                        <Camera size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Submit Evidence</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Proof of Payment</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal(false)}
                      className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handlePayment} className="space-y-6">
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount Paid</span>
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">${tenant?.rent_amount?.toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full mb-6" />
                      
                      <label className="block">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Upload Receipt / Screenshot</span>
                        <div className={`relative h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                          proofFile ? 'border-emerald-500 bg-emerald-50/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-zinc-700'
                        }`}>
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept="image/*,.pdf"
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                          />
                          {proofFile ? (
                            <>
                              <CheckCircle2 size={24} className="text-emerald-500 mb-2" />
                              <span className="text-xs font-bold text-zinc-900 dark:text-white">{proofFile.name}</span>
                              <span className="text-[10px] text-zinc-500">Click to change</span>
                            </>
                          ) : (
                            <>
                              <Upload size={24} className="text-zinc-400 mb-2" />
                              <span className="text-xs font-bold text-zinc-500">Drop file or click to upload</span>
                              <span className="text-[10px] text-zinc-400">JPG, PNG or PDF</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                      <ShieldCheck size={18} className="text-violet-600" />
                      <p className="text-[10px] font-medium text-violet-700 dark:text-violet-400">Our team will verify your payment within 24-48 hours.</p>
                    </div>

                    <button 
                      type="submit"
                      disabled={paymentProcessing || !proofFile}
                      className="w-full py-4 bg-violet-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {paymentProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        `Submit Proof of Payment`
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
