import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  CircleDollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Calendar,
  CreditCard,
  Banknote
} from 'lucide-react';
import { api } from '../services/api';
import { FinanceStats } from '../types';

export const Finance: React.FC = () => {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFinanceStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Financials</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Revenue & Performance</p>
        </div>
        <button className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest">
          <Download size={14} />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-violet-700 to-violet-900 text-white p-10 rounded-3xl relative overflow-hidden shadow-xl shadow-violet-600/20">
              <div className="relative z-10">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">Total Revenue</p>
                <h4 className="text-5xl font-bold tracking-tighter mb-8">${(stats?.total_revenue ?? 0).toLocaleString()}</h4>
                <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest">
                  <ArrowUpRight size={16} />
                  <span>+12.5% vs Last Month</span>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="vintsy-card p-10">
              <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Pending Collections</p>
              <h4 className="text-5xl font-bold text-zinc-900 dark:text-white tracking-tighter mb-8">${(stats?.pending_payments ?? 0).toLocaleString()}</h4>
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-widest">
                <Calendar size={16} />
                <span>Due in 4 days</span>
              </div>
            </div>
          </div>

          <div className="vintsy-card">
            <div className="p-8 border-b border-violet-50 dark:border-zinc-800 flex justify-between items-center">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Recent Transactions</h4>
              <button className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest hover:text-violet-700 dark:hover:text-violet-300 transition-colors">View All</button>
            </div>
            <div className="divide-y divide-violet-50 dark:divide-zinc-800">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="p-8 flex items-center justify-between hover:bg-violet-50/20 dark:hover:bg-zinc-800/30 transition-all duration-300 group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-zinc-800 border border-violet-100 dark:border-zinc-700 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:bg-violet-700 group-hover:text-white transition-all duration-300 shadow-sm">
                      {item % 2 === 0 ? <CreditCard size={20} /> : <Banknote size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Rent Payment - Unit 101</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">Feb 24, 2024 • John Doe</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">+$1,200.00</p>
                    <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="vintsy-card p-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8">Revenue Breakdown</h4>
            <div className="space-y-8">
              {[
                { label: 'Residential', value: 85, color: 'bg-violet-600 dark:bg-violet-500' },
                { label: 'Commercial', value: 10, color: 'bg-violet-400 dark:bg-violet-400' },
                { label: 'Late Fees', value: 3, color: 'bg-violet-300 dark:bg-violet-300' },
                { label: 'Other', value: 2, color: 'bg-violet-200 dark:bg-violet-200' },
              ].map((item) => (
                <div key={item.label} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-zinc-500 dark:text-zinc-400">{item.label}</span>
                    <span className="text-zinc-900 dark:text-white">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-violet-50 dark:bg-zinc-800 rounded-full overflow-hidden border border-violet-100 dark:border-zinc-700">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="vintsy-card p-8 bg-gradient-to-br from-violet-700 to-violet-900 text-white shadow-xl shadow-violet-600/20">
            <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-80">Quick Action</h4>
            <p className="text-white/80 text-xs mb-8 leading-relaxed font-medium">Generate owner statements for the current month with one click.</p>
            <button className="w-full py-3.5 bg-white text-violet-800 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-violet-50 transition-all shadow-lg active:scale-95">
              Generate Statements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
