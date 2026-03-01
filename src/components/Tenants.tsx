import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, Calendar, Search, Filter, ChevronRight, Plus, X, ArrowUpDown, Building2, Wrench, DollarSign, FileText, Printer, User } from 'lucide-react';
import { api } from '../services/api';
import { Tenant, Unit } from '../types';

export const Tenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [tenantDetails, setTenantDetails] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lease' | 'transactions' | 'maintenance' | 'documents'>('overview');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState<Partial<Tenant>>({});
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalDate, setRenewalDate] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documentForm, setDocumentForm] = useState({ name: '', url: '', type: 'ID' });
  
  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [propertyFilter, setPropertyFilter] = useState('All');
  
  // Sorting
  const [sortField, setSortField] = useState<'name' | 'unit' | 'lease_end'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [tenantForm, setTenantForm] = useState<Partial<Tenant>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    unit_id: 0,
    lease_start: new Date().toISOString().split('T')[0],
    lease_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });

  const loadData = async () => {
    const [tenantsData, unitsData] = await Promise.all([
      api.getTenants(),
      api.getUnits()
    ]);
    setTenants(tenantsData);
    setUnits(unitsData.filter(u => u.status === 'Vacant'));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      api.getTenant(selectedTenantId).then((data) => {
        setTenantDetails(data);
        setNotes(data.notes || '');
        setPersonalForm({
          nationality: data.nationality || '',
          dob: data.dob || '',
          id_type: data.id_type || 'National ID',
          id_number: data.id_number || '',
          id_expiry: data.id_expiry || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || ''
        });
      });
    } else {
      setTenantDetails(null);
    }
  }, [selectedTenantId]);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTenant(tenantForm);
    setShowAddModal(false);
    setTenantForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      unit_id: 0,
      lease_start: new Date().toISOString().split('T')[0],
      lease_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });
    loadData();
  };

  const uniqueProperties = Array.from(new Set(tenants.map(t => t.property_name).filter(Boolean)));

  const getTenantStatus = (tenant: Tenant) => {
    const today = new Date();
    const end = new Date(tenant.lease_end);
    return end >= today ? 'Active' : 'Past';
  };

  const filteredAndSortedTenants = useMemo(() => {
    let result = [...tenants];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query)
      );
    }

    // Filters
    if (statusFilter !== 'All') {
      result = result.filter(t => getTenantStatus(t) === statusFilter);
    }
    if (propertyFilter !== 'All') {
      result = result.filter(t => t.property_name === propertyFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      } else if (sortField === 'unit') {
        comparison = `${a.property_name} ${a.unit_number}`.localeCompare(`${b.property_name} ${b.unit_number}`);
      } else if (sortField === 'lease_end') {
        comparison = new Date(a.lease_end).getTime() - new Date(b.lease_end).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tenants, searchQuery, statusFilter, propertyFilter, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'unit' | 'lease_end') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPropertyFilter('All');
    setSortField('name');
    setSortDirection('asc');
  };

  const handleSaveNotes = async () => {
    if (!selectedTenantId) return;
    await api.updateTenant(selectedTenantId, { notes });
    setIsEditingNotes(false);
    api.getTenant(selectedTenantId).then(setTenantDetails);
  };

  const handleSavePersonal = async () => {
    if (!selectedTenantId) return;
    await api.updateTenant(selectedTenantId, personalForm);
    setIsEditingPersonal(false);
    api.getTenant(selectedTenantId).then(setTenantDetails);
  };

  const handleToggleReminders = async () => {
    if (!selectedTenantId || !tenantDetails) return;
    const newValue = !tenantDetails.auto_rent_reminders;
    await api.updateTenant(selectedTenantId, { auto_rent_reminders: newValue });
    api.getTenant(selectedTenantId).then(setTenantDetails);
  };

  const handleRenewLease = async () => {
    if (!selectedTenantId || !renewalDate) return;
    await api.updateTenant(selectedTenantId, { lease_end: renewalDate });
    setShowRenewalModal(false);
    api.getTenant(selectedTenantId).then(setTenantDetails);
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    await api.uploadTenantDocument(selectedTenantId, documentForm);
    setShowUploadModal(false);
    setDocumentForm({ name: '', url: '', type: 'ID' });
    api.getTenant(selectedTenantId).then(setTenantDetails);
  };

  if (selectedTenantId && tenantDetails) {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: <User size={16} /> },
      { id: 'lease', label: 'Lease Data', icon: <Building2 size={16} /> },
      { id: 'transactions', label: 'Transaction History', icon: <DollarSign size={16} /> },
      { id: 'maintenance', label: 'Tenant Requests', icon: <Wrench size={16} /> },
      { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    ];

    return (
      <div className="p-8 max-w-7xl mx-auto pb-24">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => setSelectedTenantId(null)}
            className="text-sm font-bold text-zinc-500 hover:text-violet-600 transition-colors flex items-center gap-2"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back to Directory
          </button>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowInvoiceModal(true)}
              className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest"
            >
              <FileText size={16} />
              Generate Invoice
            </button>
          </div>
        </div>

        <div className="vintsy-card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold text-3xl border-4 border-white dark:border-zinc-900 shadow-xl">
              {tenantDetails.first_name[0]}{tenantDetails.last_name[0]}
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2 justify-center md:justify-start">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {tenantDetails.first_name} {tenantDetails.last_name}
                </h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  getTenantStatus(tenantDetails) === 'Active' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {getTenantStatus(tenantDetails)} Tenant
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-violet-600" />
                  {tenantDetails.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-violet-600" />
                  {tenantDetails.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-violet-600" />
                  {tenantDetails.property_name}, Unit {tenantDetails.unit_number}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-violet-100 dark:border-zinc-800 mb-8 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-violet-600 dark:text-violet-400' 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400"
                />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="vintsy-card p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                      <User size={16} />
                      Personal Information & Identification
                    </h3>
                    <button 
                      onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                      className="text-[10px] font-bold uppercase tracking-widest text-violet-600 hover:underline"
                    >
                      {isEditingPersonal ? 'Cancel' : 'Edit Details'}
                    </button>
                  </div>
                  
                  {isEditingPersonal ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Nationality</label>
                        <input 
                          type="text" 
                          value={personalForm.nationality}
                          onChange={e => setPersonalForm({...personalForm, nationality: e.target.value})}
                          className="vintsy-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Date of Birth</label>
                        <input 
                          type="date" 
                          value={personalForm.dob}
                          onChange={e => setPersonalForm({...personalForm, dob: e.target.value})}
                          className="vintsy-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">ID Type</label>
                        <select 
                          value={personalForm.id_type}
                          onChange={e => setPersonalForm({...personalForm, id_type: e.target.value})}
                          className="vintsy-input w-full appearance-none"
                        >
                          <option value="National ID">National ID</option>
                          <option value="Passport">Passport</option>
                          <option value="Driver's License">Driver's License</option>
                          <option value="Government ID">Government ID</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">ID Number</label>
                        <input 
                          type="text" 
                          value={personalForm.id_number}
                          onChange={e => setPersonalForm({...personalForm, id_number: e.target.value})}
                          className="vintsy-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">ID Expiry</label>
                        <input 
                          type="date" 
                          value={personalForm.id_expiry}
                          onChange={e => setPersonalForm({...personalForm, id_expiry: e.target.value})}
                          className="vintsy-input w-full"
                        />
                      </div>
                      <div className="md:col-span-2 pt-4 border-t border-violet-50 dark:border-zinc-800">
                        <button 
                          onClick={handleSavePersonal}
                          className="vintsy-button-primary w-full"
                        >
                          Save Personal Information
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Nationality</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{tenantDetails.nationality || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Date of Birth</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{tenantDetails.dob ? new Date(tenantDetails.dob).toLocaleDateString() : 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{tenantDetails.id_type || 'ID'} Number</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{tenantDetails.id_number || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">ID Expiry Date</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{tenantDetails.id_expiry ? new Date(tenantDetails.id_expiry).toLocaleDateString() : 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="vintsy-card p-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8 flex items-center gap-2">
                    <Phone size={16} />
                    Emergency Contact
                  </h3>
                  {isEditingPersonal ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Contact Name</label>
                        <input 
                          type="text" 
                          value={personalForm.emergency_contact_name}
                          onChange={e => setPersonalForm({...personalForm, emergency_contact_name: e.target.value})}
                          className="vintsy-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Contact Phone</label>
                        <input 
                          type="tel" 
                          value={personalForm.emergency_contact_phone}
                          onChange={e => setPersonalForm({...personalForm, emergency_contact_phone: e.target.value})}
                          className="vintsy-input w-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Name</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{tenantDetails.emergency_contact_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Phone</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{tenantDetails.emergency_contact_phone || 'Not specified'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'lease' && (
              <div className="space-y-8">
                <div className="vintsy-card p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                      <Building2 size={16} />
                      Lease Information
                    </h3>
                    <button 
                      onClick={() => setShowRenewalModal(true)}
                      className="vintsy-button-primary text-[10px] uppercase tracking-widest"
                    >
                      Renew Lease
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Property</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{tenantDetails.property_name}</p>
                        <p className="text-xs text-zinc-500 mt-1">{tenantDetails.property_address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Unit Number</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">Unit {tenantDetails.unit_number}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Monthly Rent</p>
                        <p className="text-lg font-bold text-violet-600 dark:text-violet-400">${tenantDetails.rent_amount?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Lease Start Date</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{new Date(tenantDetails.lease_start).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Lease End Date</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{new Date(tenantDetails.lease_end).toLocaleDateString()}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-widest">Auto Reminders</span>
                          <button 
                            onClick={handleToggleReminders}
                            className={`w-10 h-5 rounded-full transition-colors relative ${tenantDetails.auto_rent_reminders ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${tenantDetails.auto_rent_reminders ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="vintsy-card p-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8 flex items-center gap-2">
                  <DollarSign size={16} />
                  Transaction History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-violet-50 dark:border-zinc-800">
                        <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                        <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</th>
                        <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Amount</th>
                        <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-violet-50 dark:divide-zinc-800">
                      {tenantDetails.transactions?.map(tx => (
                        <tr key={tx.id} className="hover:bg-violet-50/20 transition-colors">
                          <td className="py-5 text-sm text-zinc-900 dark:text-white">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="py-5 text-sm text-zinc-600 dark:text-zinc-400">{tx.type}</td>
                          <td className="py-5 text-sm font-bold text-zinc-900 dark:text-white">${tx.amount.toLocaleString()}</td>
                          <td className="py-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                              tx.status === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' 
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="vintsy-card p-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8 flex items-center gap-2">
                  <Wrench size={16} />
                  Maintenance Requests
                </h3>
                <div className="space-y-6">
                  {tenantDetails.maintenance?.map(req => (
                    <div key={req.id} className="p-6 rounded-2xl border border-violet-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{req.title}</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{req.description}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                          req.priority === 'Emergency' ? 'bg-red-50 text-red-700 border-red-100' :
                          req.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}>
                          {req.priority}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-violet-50 dark:border-zinc-800">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(req.created_at).toLocaleDateString()}</span>
                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">{req.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="vintsy-card p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                    <FileText size={16} />
                    Document Vault
                  </h3>
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="vintsy-button-primary text-[10px] uppercase tracking-widest"
                  >
                    Upload Document
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tenantDetails.documents?.map(doc => (
                    <div key={doc.id} className="p-4 rounded-xl border border-violet-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{doc.name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{doc.type} • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-zinc-400 hover:text-violet-600 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="vintsy-card p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Internal Notes</h3>
                <button 
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className="text-[10px] font-bold uppercase tracking-widest text-violet-600 hover:underline"
                >
                  {isEditingNotes ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {isEditingNotes ? (
                <div className="space-y-4">
                  <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="vintsy-input w-full min-h-[150px] text-sm"
                    placeholder="Add internal notes about this tenant..."
                  />
                  <button 
                    onClick={handleSaveNotes}
                    className="vintsy-button-primary w-full"
                  >
                    Save Notes
                  </button>
                </div>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap italic">
                  {tenantDetails.notes || 'No notes added yet.'}
                </p>
              )}
            </div>

            <div className="vintsy-card p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {tenantDetails.activities?.map((activity, idx) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    {idx !== (tenantDetails.activities?.length || 0) - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-px bg-violet-100 dark:bg-zinc-800" />
                    )}
                    <div className="w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-900/40 border-2 border-white dark:border-zinc-900 z-10 mt-1" />
                    <div>
                      <p className="text-sm text-zinc-900 dark:text-white font-medium">{activity.description}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-white print:p-0">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-violet-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto print:shadow-none print:border-none print:max-w-none print:w-full print:h-full print:overflow-visible print:p-0 print:dark:bg-white"
            >
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Monthly Rent Invoice</h3>
                <button 
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div id="invoice-content" className="p-8 bg-white text-black rounded-xl border border-zinc-200 print:border-none print:p-0">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h1 className="text-4xl font-black text-violet-700 tracking-tighter uppercase">Invoice</h1>
                    <p className="text-sm text-zinc-500 mt-2 font-medium">PropPulse Management</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-900">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-zinc-500 text-sm mt-1">Invoice #: INV-{tenantDetails.id}-{new Date().getMonth() + 1}{new Date().getFullYear()}</p>
                  </div>
                </div>
                
                <div className="mb-12">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2 mb-4">Bill To</h3>
                  <p className="font-bold text-lg text-zinc-900">{tenantDetails.first_name} {tenantDetails.last_name}</p>
                  <p className="text-zinc-600 mt-1">{tenantDetails.property_name}, Unit {tenantDetails.unit_number}</p>
                  <p className="text-zinc-600">{tenantDetails.property_address}</p>
                  <p className="text-zinc-600 mt-2">{tenantDetails.email}</p>
                  <p className="text-zinc-600">{tenantDetails.phone}</p>
                </div>
                
                <table className="w-full mb-12 text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-800">
                      <th className="py-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</th>
                      <th className="py-3 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-200">
                      <td className="py-6 text-zinc-900 font-medium">Monthly Rent - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                      <td className="py-6 text-right text-zinc-900 font-bold">${tenantDetails.rent_amount?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="flex justify-end">
                  <div className="w-1/2">
                    <div className="flex justify-between font-black text-2xl border-t-2 border-zinc-800 pt-4 text-zinc-900">
                      <span>Total Due</span>
                      <span>${tenantDetails.rent_amount?.toLocaleString()}</span>
                    </div>
                    <p className="text-right text-xs text-zinc-500 mt-2">Due upon receipt</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 mt-8 print:hidden">
                <button 
                  onClick={() => setShowInvoiceModal(false)} 
                  className="px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="vintsy-button-primary flex items-center gap-2 px-6 py-3"
                >
                  <Printer size={16} />
                  Print Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Directory</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Resident Management</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <Plus size={16} />
            Invite Tenant
          </button>
        </div>
      </div>

      <div className="vintsy-card p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="vintsy-input w-full pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Property</label>
            <select 
              value={propertyFilter}
              onChange={e => setPropertyFilter(e.target.value)}
              className="vintsy-input w-full appearance-none"
            >
              <option value="All">All Properties</option>
              {uniqueProperties.map(p => p && <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Status</label>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="vintsy-input w-full appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Past">Past</option>
            </select>
          </div>
          <button 
            onClick={clearFilters}
            className="w-full md:w-auto px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors uppercase tracking-widest"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="vintsy-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-violet-50/20 dark:bg-zinc-800/20 border-b border-violet-100 dark:border-zinc-800">
                <th 
                  className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] cursor-pointer hover:text-violet-600 transition-colors group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Resident Name
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortField === 'name' ? 'opacity-100 text-violet-600' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] cursor-pointer hover:text-violet-600 transition-colors group"
                  onClick={() => handleSort('unit')}
                >
                  <div className="flex items-center gap-2">
                    Unit & Property
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortField === 'unit' ? 'opacity-100 text-violet-600' : ''}`} />
                  </div>
                </th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Contact Info</th>
                <th 
                  className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] cursor-pointer hover:text-violet-600 transition-colors group"
                  onClick={() => handleSort('lease_end')}
                >
                  <div className="flex items-center gap-2">
                    Lease End Date
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortField === 'lease_end' ? 'opacity-100 text-violet-600' : ''}`} />
                  </div>
                </th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Status</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-50 dark:divide-zinc-800">
              {filteredAndSortedTenants.map((tenant, index) => (
                <motion.tr
                  key={tenant.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedTenantId(tenant.id)}
                  className="hover:bg-violet-50/30 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-700 dark:bg-violet-900/40 text-white dark:text-violet-400 flex items-center justify-center font-bold text-xs border border-violet-800 dark:border-violet-800 shadow-md">
                        {tenant.first_name[0]}{tenant.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{tenant.first_name} {tenant.last_name}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">#{tenant.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Unit {tenant.unit_number}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{tenant.property_name}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Mail size={12} className="text-zinc-300 dark:text-zinc-600" />
                        {tenant.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Phone size={12} className="text-zinc-300 dark:text-zinc-600" />
                        {tenant.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      <Calendar size={12} className="text-zinc-300 dark:text-zinc-600" />
                      <span>{new Date(tenant.lease_end).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-widest border ${
                      getTenantStatus(tenant) === 'Active'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'
                    }`}>
                      {getTenantStatus(tenant)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-zinc-300 dark:text-zinc-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-violet-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Add New Tenant</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTenant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={tenantForm.first_name}
                    onChange={e => setTenantForm({...tenantForm, first_name: e.target.value})}
                    className="vintsy-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={tenantForm.last_name}
                    onChange={e => setTenantForm({...tenantForm, last_name: e.target.value})}
                    className="vintsy-input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Email</label>
                  <input 
                    type="email" 
                    required
                    value={tenantForm.email}
                    onChange={e => setTenantForm({...tenantForm, email: e.target.value})}
                    className="vintsy-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Phone</label>
                  <input 
                    type="tel" 
                    required
                    value={tenantForm.phone}
                    onChange={e => setTenantForm({...tenantForm, phone: e.target.value})}
                    className="vintsy-input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Assign Unit</label>
                <select 
                  required
                  value={tenantForm.unit_id || ''}
                  onChange={e => setTenantForm({...tenantForm, unit_id: Number(e.target.value)})}
                  className="vintsy-input w-full appearance-none"
                >
                  <option value="">Select a vacant unit...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.property_name} - Unit {u.unit_number} (${u.rent_amount}/mo)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Lease Start</label>
                  <input 
                    type="date" 
                    required
                    value={tenantForm.lease_start}
                    onChange={e => setTenantForm({...tenantForm, lease_start: e.target.value})}
                    className="vintsy-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Lease End</label>
                  <input 
                    type="date" 
                    required
                    value={tenantForm.lease_end}
                    onChange={e => setTenantForm({...tenantForm, lease_end: e.target.value})}
                    className="vintsy-input w-full"
                  />
                </div>
              </div>
              <button type="submit" className="w-full vintsy-button-primary py-3 mt-6">
                Add Tenant
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
