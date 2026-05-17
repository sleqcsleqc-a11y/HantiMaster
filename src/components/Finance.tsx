import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CircleDollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Calendar,
  CreditCard,
  Banknote,
  Lock,
  Building2,
  Zap,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { api } from '../services/api';
import { FinanceStats } from '../types';

export const Finance: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [rentRoll, setRentRoll] = useState<any[]>([]);
  const [engineProcessing, setEngineProcessing] = useState(false);
  const [view, setView] = useState<'overview' | 'rent-roll'>('overview');

  const runRentEngine = async () => {
    if (!confirm('Are you sure you want to run the automated rent engine? This will post rent charges for all active tenants for the current month.')) return;
    
    setEngineProcessing(true);
    try {
      const result = await api.postMonthlyRent();
      alert(`Rent Engine Complete!\n\nProcessed: ${result.processed} charges\nAlready Posted: ${result.already_posted} skipped`);
      // Refresh data
      const statsData = await api.getFinanceStats(user?.id);
      setStats(statsData);
      const txData = await api.getTransactions(10);
      setTransactions(txData);
    } catch (error) {
      console.error('Rent engine failed:', error);
      alert('Failed to run rent engine. See console for details.');
    } finally {
      setEngineProcessing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (hasPermission('FINANCE', 'view')) {
          const statsData = await api.getFinanceStats(user?.id);
          setStats(statsData);

          const flowData = await api.getCashFlowReport();
          setCashFlow(flowData);

          const txData = await api.getTransactions(10);
          setTransactions(txData);

          const vendorData = await api.getVendors();
          setVendors(vendorData);

          const rollData = await api.getRentRoll();
          setRentRoll(rollData);
        }
      } catch (error) {
        console.error('Error fetching financial reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasPermission, user]);

  // Transform cashFlow for chart
  const revenueData = cashFlow ? Object.entries(cashFlow).map(([month, values]: [string, any]) => ({
    name: month,
    income: values.payments,
    expenses: values.charges
  })).sort((a, b) => a.name.localeCompare(b.name)) : [];

  const rentRollChartData = rentRoll.reduce((acc: any[], tenant: any) => {
    const propName = tenant.units?.properties?.name || 'Unknown';
    const existing = acc.find(item => item.name === propName);
    const amount = Number(tenant.rent_amount) || 0;
    if (existing) {
      existing.value += amount;
    } else {
      acc.push({ name: propName, value: amount });
    }
    return acc;
  }, []);

  const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

  if (!hasPermission('FINANCE', 'view')) {
    return (
      <div className="p-8 h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-zinc-400" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mb-2">Access Restricted</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">
            You do not have the required permissions to view financial analytics. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const exportToPDF = async () => {
    const element = document.getElementById('finance-report');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('financial-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto" id="finance-report">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-1">Financials</h3>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight">Revenue & Performance</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex bg-white/50 border border-violet-100 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setView('overview')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 px-3 ${view === 'overview' ? 'bg-violet-100 text-violet-700' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <LayoutGrid size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Overview</span>
            </button>
            <button 
              onClick={() => setView('rent-roll')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 px-3 ${view === 'rent-roll' ? 'bg-violet-100 text-violet-700' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <List size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Rent Roll</span>
            </button>
          </div>
          <button 
            onClick={runRentEngine}
            disabled={engineProcessing}
            className="px-6 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            <Zap size={14} className={engineProcessing ? 'animate-pulse' : ''} />
            {engineProcessing ? 'Processing...' : 'Run Rent Engine'}
          </button>
          <button 
            onClick={exportToPDF}
            className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'overview' ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
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
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">Pending Collections</p>
              <h4 className="text-5xl font-bold text-zinc-900 tracking-tighter mb-8">${(stats?.pending_payments ?? 0).toLocaleString()}</h4>
              <div className="flex items-center gap-2 text-orange-700 text-xs font-bold uppercase tracking-widest">
                <Calendar size={16} />
                <span>Due in 4 days</span>
              </div>
            </div>
          </div>

          <div className="vintsy-card p-8 min-h-[400px] flex flex-col">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">Income vs Expenses</h4>
            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#71717a', fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#71717a', fontWeight: 600 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                  />
                  <Bar dataKey="income" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" fill="#c4b5fd" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="vintsy-card">
            <div className="p-8 border-b border-violet-50 flex justify-between items-center">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Ledger Activity</h4>
              <button className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors">Audit Full Ledger</button>
            </div>
            <div className="divide-y divide-violet-50">
              {transactions.length > 0 ? transactions.map((tx) => (
                <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-violet-50/20 transition-all duration-300 group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-zinc-400 group-hover:bg-violet-700 group-hover:text-white transition-all duration-300 shadow-sm">
                      {tx.type === 'Payment' ? <CreditCard size={20} /> : <Banknote size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{tx.category} - {tx.properties?.name || 'Property'}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
                        {new Date(tx.transaction_date || tx.created_at).toLocaleDateString()} • {tx.tenants?.first_name} {tx.tenants?.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'Payment' ? 'text-emerald-700' : 'text-zinc-900'}`}>
                      {tx.type === 'Payment' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${tx.status === 'Completed' ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-zinc-400 text-sm italic">
                  No transaction history recorded for the current period.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="vintsy-card p-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">Asset Yield Distribution</h4>
            <div className="space-y-8">
              {[
                { label: 'Residential Rent', value: 85, color: 'bg-violet-600' },
                { label: 'Commercial Leases', value: 10, color: 'bg-violet-400' },
                { label: 'Ancillary (Late Fees)', value: 3, color: 'bg-violet-300' },
                { label: 'Utility Rebill', value: 2, color: 'bg-violet-200' },
              ].map((item) => (
                <div key={item.label} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-zinc-500">{item.label}</span>
                    <span className="text-zinc-900">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-violet-50 rounded-full overflow-hidden border border-violet-100">
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

          <div className="vintsy-card p-8">
            <div className="flex justify-between items-center mb-8">
               <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Vendor Expenditure</h4>
               <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">{vendors.length} Partners</span>
            </div>
            <div className="space-y-6">
              {vendors.slice(0, 3).map(v => (
                <div key={v.id} className="flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
                       <Building2 size={14} />
                     </div>
                     <div>
                       <p className="text-xs font-bold text-zinc-900 truncate max-w-[120px]">{v.company_name}</p>
                       <p className="text-[10px] text-zinc-400 font-medium">{v.category}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-900">$0.00</p>
                    <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">YTD Spend</p>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-violet-100 rounded-xl text-[10px] font-bold text-violet-400 uppercase tracking-widest hover:border-violet-300 hover:text-violet-600 transition-all">
                Add New Professional Vendor
              </button>
            </div>
          </div>

          <div className="vintsy-card p-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">Track New Expense</h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await api.createExpenseTransaction({
                  amount: Number(f.get('amount')),
                  category: f.get('category') as string,
                  vendor_id: f.get('vendor_id') ? Number(f.get('vendor_id')) : undefined,
                  transaction_date: f.get('date') as string || new Date().toISOString().split('T')[0],
                  description: f.get('description') as string,
                });
                alert('Expense tracked successfully.');
                const txData = await api.getTransactions(10);
                setTransactions(txData);
                const flowData = await api.getCashFlowReport();
                setCashFlow(flowData);
                const statsData = await api.getFinanceStats(user?.id);
                setStats(statsData);
                (e.target as HTMLFormElement).reset();
              } catch (err) {
                console.error(err);
                alert('Failed to track expense.');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Description</label>
                <input required name="description" type="text" className="vintsy-input w-full" placeholder="Plumbing repair" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Amount</label>
                  <input required name="amount" type="number" step="0.01" className="vintsy-input w-full" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Category</label>
                  <select required name="category" className="vintsy-input w-full">
                    <option value="Maintenance">Maintenance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Taxes">Taxes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Vendor (Optional)</label>
                  <select name="vendor_id" className="vintsy-input w-full">
                    <option value="">-- None --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Date</label>
                  <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="vintsy-input w-full" />
                </div>
              </div>
              <button type="submit" className="w-full vintsy-button-primary mt-4 py-3">Record Expense</button>
            </form>
          </div>

          <div className="vintsy-card p-8 min-h-[350px] flex flex-col">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">Income Trends</h4>
            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#71717a', fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#71717a', fontWeight: 600 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(139, 92, 246, 0.2)', strokeWidth: 2 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="income" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
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
          </motion.div>
        ) : (
          <motion.div 
            key="rent-roll"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="vintsy-card p-8">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">Expected Monthly Rent by Property</h4>
                 <div className="h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={rentRollChartData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {rentRollChartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip 
                         formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Rent']}
                         contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                         itemStyle={{ color: '#fff' }}
                       />
                       <Legend verticalAlign="bottom" height={36}/>
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
              </div>
              
              <div className="vintsy-card p-8">
                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">Rent Roll Overview</h4>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Expected</p>
                     <p className="text-3xl font-bold text-zinc-900">${rentRoll.reduce((acc, t) => acc + (Number(t.rent_amount) || 0), 0).toLocaleString()}</p>
                   </div>
                   <div className="space-y-2">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Leases</p>
                     <p className="text-3xl font-bold text-zinc-900">{rentRoll.length}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="vintsy-card overflow-hidden">
              <div className="p-6 border-b border-violet-50">
                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Master Rent Roll</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-violet-50/20 border-b border-violet-100">
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tenant</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Property & Unit</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Lease Terms</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">M. Rent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-50">
                    {rentRoll.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-violet-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-zinc-900">{tenant.first_name} {tenant.last_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-zinc-900">{tenant.units?.properties?.name || 'N/A'}</p>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Unit {tenant.units?.unit_number || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${tenant.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {tenant.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-zinc-600 font-medium">
                            {tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString() : 'N/A'} - {tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-zinc-900">${(Number(tenant.rent_amount) || 0).toLocaleString()}</p>
                        </td>
                      </tr>
                    ))}
                    {rentRoll.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500 italic">No rent roll data found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
