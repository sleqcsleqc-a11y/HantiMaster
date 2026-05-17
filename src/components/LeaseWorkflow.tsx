import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Home, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  Search,
  DollarSign,
  Calendar,
  Clock,
  Briefcase,
  ChevronDown,
  Globe,
  Settings,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Tenant, Property, LeaseTerms, DocumentTemplate } from '../types';

interface LeaseWorkflowProps {
  onClose: () => void;
  onComplete: () => void;
}

export const LeaseWorkflow: React.FC<LeaseWorkflowProps> = ({ onClose, onComplete }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  
  // Data State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  
  // Selection State
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [tenantSearch, setTenantSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  
  // Auto-select property if tenant has unit_id
  useEffect(() => {
    if (selectedTenant && selectedTenant.unit_id && properties.length > 0) {
      const propWithUnit = properties.find(p => (p.units || []).some((u: any) => u.id === selectedTenant.unit_id));
      if (propWithUnit) {
        setSelectedProperty(propWithUnit);
        const unit = (propWithUnit.units || []).find((u: any) => u.id === selectedTenant.unit_id);
        setSelectedUnit(unit);
      }
    }
  }, [selectedTenant, properties]);
  
  // Validation State
  const [validationResult, setValidationResult] = useState<{ eligible: boolean, message?: string } | null>(null);
  
  // Terms State
  const [terms, setTerms] = useState<Partial<LeaseTerms>>({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    duration_months: 12,
    payment_frequency: 'Monthly',
    payment_day: 1,
    security_deposit: 0,
    late_fee: 0,
    grace_period: 5,
    notice_period: 30,
    payment_methods: ['Bank Transfer'],
    utilities_tenant: ['Electricity', 'Internet', 'Generator'],
    utilities_landlord: ['Water', 'Security', 'Waste Collection'],
    pet_policy: 'No pets allowed unless written approval provided',
    smoking_policy: 'No smoking',
    furnished: false,
    is_commercial: false
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [tData, pData, tempLines] = await Promise.all([
        api.getTenants(),
        api.getOperationalProperties(),
        api.getDocumentTemplates()
      ]);
      setTenants(tData);
      setProperties(pData);
      setTemplates(tempLines);
    } catch (error) {
      addToast('Failed to load workflow data', 'error');
    }
  };

  const handleNextStep = async () => {
    if (step === 2) {
      // Step 2 to 3: Eligibility Check
      if (!selectedTenant || !selectedProperty) return;
      setValidating(true);
      try {
        const result = await api.validateLeaseEligibility(
          selectedProperty.id, 
          selectedTenant.id, 
          terms.start_date || '',
          selectedUnit?.id
        );
        setValidationResult(result);
        
        // Always advance to step 3 to show the result (eligible or failure message)
        if (result.eligible) {
          // Auto-fill defaults from property/unit
          setTerms(prev => ({
            ...prev,
            rent_amount: selectedUnit?.rent_amount || (selectedProperty.property_value ? (selectedProperty.property_value / 100) : 1000),
            furnished: selectedProperty.is_furnished || false,
            security_deposit: selectedUnit?.rent_amount || prev.rent_amount || 1000,
            late_fee: Math.round((selectedUnit?.rent_amount || prev.rent_amount || 1000) * 0.1)
          }));
        }
        setStep(3);
      } catch (error) {
        addToast('Validation failed', 'error');
      } finally {
        setValidating(false);
      }
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleFinish = async () => {
    if (!user || !selectedTenant || !selectedProperty || !terms.start_date || !terms.end_date) return;
    
    // Use selectedUnit if set, otherwise fallback to first unit
    const unitToLease = selectedUnit || (selectedProperty.units && selectedProperty.units.length > 0 
      ? selectedProperty.units[0] 
      : null);

    const finalTerms: LeaseTerms = {
      ...(terms as LeaseTerms),
      tenant_id: selectedTenant.id,
      property_id: selectedProperty.id,
      unit_id: unitToLease?.id || 0,
    };
    
    setLoading(true);
    try {
      await api.createTenancyWorkflow(finalTerms, user.id);
      addToast('Tenancy workflow initiated successfully', 'success');
      onComplete();
    } catch (error) {
      console.error(error);
      addToast('Failed to finalize tenancy', 'error');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Tenant', icon: User },
    { id: 2, name: 'Property', icon: Home },
    { id: 3, name: 'Eligibility', icon: ShieldCheck },
    { id: 4, name: 'Terms', icon: Settings },
    { id: 5, name: 'Preview', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-zinc-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-6xl h-full max-h-[900px] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
               <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">HantiMaster Lease Workflow</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Operational Tenancy Orchestration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-zinc-50 rounded-2xl text-zinc-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="px-12 py-8 bg-zinc-50/50 flex justify-between items-center relative overflow-hidden">
           {steps.map((s, idx) => {
             const Icon = s.icon;
             const isActive = step === s.id;
             const isCompleted = step > s.id;
             
             return (
               <div key={s.id} className="flex items-center gap-4 relative z-10">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                   isActive ? 'bg-zinc-900 text-white shadow-xl scale-110' : 
                   isCompleted ? 'bg-emerald-500 text-white' : 'bg-white text-zinc-300 border border-zinc-200'
                 }`}>
                   {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest hidden lg:block ${
                   isActive ? 'text-zinc-900' : 'text-zinc-400'
                 }`}>
                   {s.name}
                 </span>
                 {idx < steps.length - 1 && (
                   <div className="w-8 h-px bg-zinc-200 ml-4 hidden lg:block" />
                 )}
               </div>
             )
           })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Select Tenant Profile</h3>
                  <p className="text-sm text-zinc-500 font-medium">Step 1: A tenancy agreement can only be created for existing verified tenants.</p>
                </div>

                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by name, ID (T00023), or phone..."
                    className="vintsy-input w-full pl-16 pr-6 py-5 text-lg"
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {tenants
                    .filter(t => `${t.first_name} ${t.last_name} ${t.tenant_id_number} ${t.phone}`.toLowerCase().includes(tenantSearch.toLowerCase()))
                    .sort((a, b) => {
                      if (a.status === 'Prospective' && b.status !== 'Prospective') return -1;
                      if (a.status !== 'Prospective' && b.status === 'Prospective') return 1;
                      return 0;
                    })
                    .map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setSelectedTenant(t)}
                      className={`flex items-center justify-between p-6 rounded-3xl border transition-all text-left group ${
                        selectedTenant?.id === t.id 
                          ? 'border-violet-600 bg-violet-50/50 ring-4 ring-violet-50' 
                          : 'border-zinc-100 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                         <div className={`p-4 rounded-2xl ${selectedTenant?.id === t.id ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                            <User size={24} />
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-zinc-900">{t.first_name} {t.last_name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                t.status === 'Prospective' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                t.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-zinc-50 text-zinc-500 border-zinc-200'
                              }`}>
                                {t.status || 'Active'}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Tenant ID: {t.tenant_id_number || 'T-PROV'} • {t.phone}</p>
                         </div>
                      </div>
                      {selectedTenant?.id === t.id && <CheckCircle2 className="text-violet-600" size={24} />}
                    </button>
                  ))}
                  
                  <button className="flex items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed border-zinc-100 hover:border-violet-300 text-zinc-400 hover:text-violet-600 transition-all text-xs font-bold uppercase tracking-widest">
                    <Plus size={18} />
                    Create New Tenant Profile
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="space-y-2">
                   <div className="flex items-center gap-3 mb-2">
                      <span className="px-2.5 py-1 bg-zinc-100 rounded-lg text-[8px] font-black text-zinc-400 uppercase tracking-widest">Tenant Selected</span>
                      <span className="text-xs font-bold text-zinc-900">{selectedTenant?.first_name} {selectedTenant?.last_name}</span>
                   </div>
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Select Eligible Property</h3>
                  <p className="text-sm text-zinc-500 font-medium">Step 2: Only properties marked as Vacant or Future Available can be leased.</p>
                </div>

                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by property name, address, or unit..."
                    className="vintsy-input w-full pl-16 pr-6 py-5 text-lg"
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {properties
                    .filter(p => {
                      const unitString = (p.units || []).map((u: any) => u.unit_number).join(' ');
                      return `${p.name} ${p.address} ${p.status} ${unitString}`.toLowerCase().includes(propertySearch.toLowerCase());
                    })
                    .map(p => (
                    <div key={p.id} className="space-y-2">
                      <button 
                        onClick={() => {
                          setSelectedProperty(p);
                          if (p.units && p.units.length > 0) {
                            setSelectedUnit(p.units[0]);
                          } else {
                            setSelectedUnit(null);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all text-left group ${
                          selectedProperty?.id === p.id 
                            ? 'border-violet-600 bg-violet-50/50 ring-4 ring-violet-50' 
                            : 'border-zinc-100 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-5">
                           <div className={`p-4 rounded-2xl ${selectedProperty?.id === p.id ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                              <Home size={24} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-zinc-900">{p.name} {p.units && p.units.length === 1 ? `| Unit ${p.units[0].unit_number}` : ''}</p>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                 {p.bedrooms || 0} Bed • {p.status || 'Active'} {p.available_from ? `(from ${new Date(p.available_from).toLocaleDateString()})` : ''} • ${p.property_value ? (p.property_value/100).toLocaleString() : '1,500'}/mo
                              </p>
                           </div>
                        </div>
                        {selectedProperty?.id === p.id && !p.units?.length ? <CheckCircle2 className="text-violet-600" size={24} /> : null}
                      </button>

                      {selectedProperty?.id === p.id && p.units && p.units.length > 1 && (
                        <div className="ml-16 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {p.units.map((u: any) => (
                            <button
                              key={u.id}
                              onClick={() => setSelectedUnit(u)}
                              className={`p-3 rounded-2xl border text-center transition-all ${
                                selectedUnit?.id === u.id
                                  ? 'border-violet-600 bg-violet-600 text-white shadow-lg'
                                  : 'border-zinc-100 hover:border-zinc-300 bg-zinc-50 text-zinc-600'
                              }`}
                            >
                              <p className="text-[10px] font-black uppercase tracking-widest">Unit {u.unit_number}</p>
                              <p className={`text-[8px] font-bold ${selectedUnit?.id === u.id ? 'text-violet-200' : 'text-zinc-400'}`}>${u.rent_amount}/mo</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && validationResult && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto text-center space-y-8"
              >
                <div className={`w-24 h-24 rounded-[2rem] mx-auto flex items-center justify-center ${validationResult.eligible ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                   {validationResult.eligible ? <ShieldCheck size={48} /> : <AlertCircle size={48} />}
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-zinc-900 tracking-tight">
                    {validationResult.eligible ? 'Asset Eligible' : 'Eligibility Check Failed'}
                  </h3>
                  <p className="text-zinc-500 font-medium leading-relaxed">
                    {validationResult.message || 'The property and tenant have passed initial compliance and eligibility checks.'}
                  </p>
                </div>

                {validationResult.eligible && (
                  <div className="vintsy-card p-8 bg-zinc-50 border-zinc-100 grid grid-cols-2 gap-4 text-left">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Lease Engine</p>
                        <p className="text-xs font-bold text-zinc-900">Residential Tenancy Workflow</p>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Jurisdiction</p>
                        <p className="text-xs font-bold text-zinc-900">Mogadishu, Somalia</p>
                     </div>
                  </div>
                )}
                
                {!validationResult.eligible && (
                  <button 
                    onClick={() => setStep(2)}
                    className="px-10 py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest"
                  >
                    Reselect Property
                  </button>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   {/* Left Column: Dates & Finance */}
                   <div className="space-y-8">
                     <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-4">Timeline & Financials</h4>
                     
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Start Date</label>
                           <input 
                             type="date"
                             value={terms.start_date}
                             onChange={(e) => setTerms({...terms, start_date: e.target.value})}
                             className="vintsy-input w-full p-4"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">End Date</label>
                           <input 
                             type="date"
                             value={terms.end_date}
                             onChange={(e) => setTerms({...terms, end_date: e.target.value})}
                             className="vintsy-input w-full p-4"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Monthly Rent (USD)</label>
                           <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                              <input 
                                type="number"
                                value={terms.rent_amount}
                                onChange={(e) => setTerms({...terms, rent_amount: Number(e.target.value)})}
                                className="vintsy-input w-full pl-10 pr-4 py-4"
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Security Deposit (USD)</label>
                           <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                              <input 
                                type="number"
                                value={terms.security_deposit}
                                onChange={(e) => setTerms({...terms, security_deposit: Number(e.target.value)})}
                                className="vintsy-input w-full pl-10 pr-4 py-4"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Grace Period</label>
                           <input 
                             type="number"
                             value={terms.grace_period}
                             onChange={(e) => setTerms({...terms, grace_period: Number(e.target.value)})}
                             className="vintsy-input w-full p-4"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Payment Day</label>
                           <input 
                             type="number"
                             min={1}
                             max={31}
                             value={terms.payment_day}
                             onChange={(e) => setTerms({...terms, payment_day: Number(e.target.value)})}
                             className="vintsy-input w-full p-4"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notice Period</label>
                           <input 
                             type="number"
                             value={terms.notice_period}
                             onChange={(e) => setTerms({...terms, notice_period: Number(e.target.value)})}
                             className="vintsy-input w-full p-4"
                           />
                        </div>
                     </div>
                   </div>

                   {/* Right Column: Policies & Utilities */}
                   <div className="space-y-8">
                     <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-4">Policies & Responsibilities</h4>
                     
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                           <div>
                              <p className="text-xs font-bold text-zinc-900">Commercial Lease</p>
                              <p className="text-[10px] text-zinc-500">Enable commercial-specific clauses</p>
                           </div>
                           <button 
                             onClick={() => setTerms({...terms, is_commercial: !terms.is_commercial})}
                             className={`w-12 h-6 rounded-full transition-colors relative ${terms.is_commercial ? 'bg-violet-600' : 'bg-zinc-300'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${terms.is_commercial ? 'left-7' : 'left-1'}`} />
                           </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                           <div>
                              <p className="text-xs font-bold text-zinc-900">Furnished Status</p>
                              <p className="text-[10px] text-zinc-500">Automatically include inventory list</p>
                           </div>
                           <button 
                             onClick={() => setTerms({...terms, furnished: !terms.furnished})}
                             className={`w-12 h-6 rounded-full transition-colors relative ${terms.furnished ? 'bg-violet-600' : 'bg-zinc-300'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${terms.furnished ? 'left-7' : 'left-1'}`} />
                           </button>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pet Policy</label>
                        <select 
                          value={terms.pet_policy}
                          onChange={(e) => setTerms({...terms, pet_policy: e.target.value})}
                          className="vintsy-input w-full p-4"
                        >
                          <option>No pets allowed unless written approval provided</option>
                          <option>Small pets allowed (under 10kg)</option>
                          <option>Pets allowed with additional deposit</option>
                          <option>Strictly no pets</option>
                        </select>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tenant Utilities</label>
                        <div className="flex flex-wrap gap-2">
                           {['Electricity', 'Water', 'Internet', 'Generator', 'Security', 'Waste'].map(util => (
                             <button
                               key={util}
                               onClick={() => {
                                 const current = terms.utilities_tenant || [];
                                 setTerms({
                                   ...terms,
                                   utilities_tenant: current.includes(util) 
                                     ? current.filter(u => u !== util) 
                                     : [...current, util]
                                 });
                               }}
                               className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                                 terms.utilities_tenant?.includes(util) 
                                   ? 'bg-zinc-900 text-white' 
                                   : 'bg-white border border-zinc-100 text-zinc-400 hover:border-zinc-300'
                               }`}
                             >
                               {util}
                             </button>
                           ))}
                        </div>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 xl:grid-cols-2 gap-12"
              >
                 <div className="space-y-8">
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Final Agreement Preview</h3>
                    <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white space-y-6">
                       <div className="flex items-center justify-between pb-6 border-b border-white/10">
                          <div className="flex items-center gap-3">
                             <Globe size={20} className="text-violet-400" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Bilingual Document Engine</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase p-2 bg-white/10 rounded-lg">Draft: v1.0</span>
                       </div>
                       
                       <div className="space-y-6">
                          <div className="bg-white/5 p-6 rounded-3xl space-y-4">
                             <h5 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Summary of Terms</h5>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <p className="text-[8px] text-white/40 font-bold uppercase">Landlord</p>
                                   <p className="text-xs font-bold truncate">Hanti Property Management</p>
                                </div>
                                <div>
                                   <p className="text-[8px] text-white/40 font-bold uppercase">Tenant</p>
                                   <p className="text-xs font-bold truncate">{selectedTenant?.first_name} {selectedTenant?.last_name}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] text-white/40 font-bold uppercase">Rent</p>
                                   <p className="text-xs font-bold">${terms.rent_amount}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] text-white/40 font-bold uppercase">Deposit</p>
                                   <p className="text-xs font-bold">${terms.security_deposit}</p>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-2">
                             <p className="text-xs text-white/80 font-medium leading-relaxed italic">
                                "This Residential Tenancy Agreement is constructed under the jurisdiction of the Federal Republic of Somalia and complies with HantiMaster's operational standards..."
                             </p>
                             <p className="text-xs text-white/40 font-medium leading-relaxed italic">
                                "Heshiiskan waxaa lagu maamuli doonaa sharciyada Jamhuuriyadda Federaalka Soomaaliya..."
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="vintsy-card p-8 space-y-4">
                       <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Related Documents to be Generated</h4>
                       <div className="space-y-2">
                          {['Move-in Checklist', 'Inventory Checklist', 'Key Handover Record', 'Security Deposit Receipt'].map(doc => (
                            <div key={doc} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                               <div className="w-2 h-2 rounded-full bg-emerald-500" />
                               <span className="text-xs font-bold text-zinc-900">{doc}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="vintsy-card p-12 bg-white flex flex-col justify-center items-center text-center space-y-8">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center">
                       <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Ready to Finalize?</h3>
                       <p className="text-sm text-zinc-400 font-medium max-w-sm">
                          Finalizing this workflow will update the property status, generate the tenancy agreement, and create all necessary operational tasks for the move-in process.
                       </p>
                    </div>
                    <button 
                      onClick={handleFinish}
                      disabled={loading}
                      className="w-full max-w-sm py-5 bg-zinc-900 text-white rounded-[2rem] text-sm font-bold uppercase tracking-[0.2em] shadow-2xl hover:opacity-90 transition-all flex items-center justify-center gap-4"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Finalize Tenancy
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-8 border-t border-zinc-100 flex items-center justify-between">
          <button 
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 1 || loading}
            className={`px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 border ${
              step === 1 ? 'invisible' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400'
            }`}
          >
            <ChevronLeft size={16} />
            Previous Step
          </button>

          <div className="hidden lg:flex items-center gap-3">
             {steps.map(s => (
               <div key={s.id} className={`w-2 h-2 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-zinc-900 w-6' : 'bg-zinc-200'}`} />
             ))}
          </div>

          <button 
            onClick={handleNextStep}
            disabled={
              (step === 1 && !selectedTenant) || 
              (step === 2 && !selectedProperty) ||
              (step === 3 && !validationResult?.eligible) ||
              step === 5 ||
              loading ||
              validating
            }
            className={`px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl ${
              (step === 1 && !selectedTenant) || (step === 2 && !selectedProperty) || validating
                ? 'bg-zinc-100 text-zinc-300' 
                : 'bg-zinc-900 text-white hover:opacity-90'
            }`}
          >
            {validating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {step === 3 ? 'Continue to Terms' : 'Proceed to Next Step'}
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
