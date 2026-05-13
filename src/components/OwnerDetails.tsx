import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Building2, CircleDollarSign, Users, Wrench, Download, User, Calendar, FileText, Mail, Phone, Globe, Shield, ChevronRight, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Owner, Property } from '../types';

interface OwnerDetailsProps {
  ownerId: number;
  onBack: () => void;
  onSelectProperty: (id: number) => void;
}

export const OwnerDetails: React.FC<OwnerDetailsProps> = ({ ownerId, onBack, onSelectProperty }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'transactions' | 'documents'>('overview');
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState<Partial<Owner>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documentForm, setDocumentForm] = useState({ name: '', url: '', type: 'Contract' });

  useEffect(() => {
    api.getOwner(ownerId).then(data => {
      setOwner(data);
      setPersonalForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        nationality: data.nationality || '',
        dob: data.dob || '',
        id_type: data.id_type || 'Passport',
        id_number: data.id_number || '',
        id_expiry: data.id_expiry || ''
      });
      setLoading(false);
    });
  }, [ownerId]);

  const handleSavePersonal = async () => {
    if (personalForm.email && !personalForm.email.includes('@')) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    try {
      await api.updateOwner(ownerId, { ...personalForm, admin_id: user?.id });
      setIsEditingPersonal(false);
      const updatedOwner = await api.getOwner(ownerId);
      setOwner(updatedOwner);
      addToast('Personal information updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update owner:', error);
      addToast('Failed to update owner information', 'error');
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.uploadOwnerDocument(ownerId, documentForm);
    setShowUploadModal(false);
    setDocumentForm({ name: '', url: '', type: 'Contract' });
    api.getOwner(ownerId).then(setOwner);
  };

  if (loading || !owner) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-violet-600 dark:text-violet-400 animate-pulse uppercase tracking-widest text-xs font-bold">Loading Owner Details...</div>
      </div>
    );
  }

  const properties = owner.properties || [];
  const totalValue = properties.reduce((sum, p) => sum + (p.property_value || 0), 0);
  const totalUnits = properties.reduce((sum, p) => sum + (p.unit_count || 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User size={16} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Building2 size={16} /> },
    { id: 'transactions', label: 'Transactions', icon: <CircleDollarSign size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-xs uppercase tracking-widest font-bold"
          >
            <ArrowLeft size={14} />
            Back to Directory
          </button>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Owner Profile</h3>
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">{owner.first_name} {owner.last_name}</h2>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <Download size={14} />
            Export Portfolio
          </button>
        </div>
      </div>

      <div className="vintsy-card p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-white flex items-center justify-center font-bold text-3xl shadow-xl shadow-violet-600/20">
            {owner.first_name?.[0]}{owner.last_name?.[0]}
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500 justify-center md:justify-start mt-2">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-violet-600" />
                {owner.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-violet-600" />
                {owner.phone}
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-violet-600" />
                {properties.length} Properties
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-violet-100 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
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
                layoutId="activeTabOwner"
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
                    Personal & Identification Data
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
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">First Name</label>
                      <input 
                        type="text" 
                        value={personalForm.first_name}
                        onChange={e => setPersonalForm({...personalForm, first_name: e.target.value})}
                        className="vintsy-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Last Name</label>
                      <input 
                        type="text" 
                        value={personalForm.last_name}
                        onChange={e => setPersonalForm({...personalForm, last_name: e.target.value})}
                        className="vintsy-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Email</label>
                      <input 
                        type="email" 
                        value={personalForm.email}
                        onChange={e => setPersonalForm({...personalForm, email: e.target.value})}
                        className="vintsy-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Phone</label>
                      <input 
                        type="tel" 
                        value={personalForm.phone}
                        onChange={e => setPersonalForm({...personalForm, phone: e.target.value})}
                        className="vintsy-input w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Residential Address</label>
                      <input 
                        type="text" 
                        value={personalForm.address}
                        onChange={e => setPersonalForm({...personalForm, address: e.target.value})}
                        className="vintsy-input w-full"
                      />
                    </div>
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
                        <option value="Passport">Passport</option>
                        <option value="National ID">National ID</option>
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
                    <div className="md:col-span-2 pt-4">
                      <button 
                        onClick={handleSavePersonal}
                        className="vintsy-button-primary w-full"
                      >
                        Update Personal Information
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Residential Address</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{owner.address || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Nationality</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{owner.nationality || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Date of Birth</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{owner.dob ? new Date(owner.dob).toLocaleDateString() : 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Identification Type</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{owner.id_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">ID Number</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{owner.id_number || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">ID Expiry Date</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{owner.id_expiry ? new Date(owner.id_expiry).toLocaleDateString() : 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="vintsy-card p-6 bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800">
                  <p className="text-violet-600 dark:text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-2">Portfolio Value</p>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">${totalValue.toLocaleString()}</h4>
                </div>
                <div className="vintsy-card p-6">
                  <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Units</p>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalUnits}</h4>
                </div>
                <div className="vintsy-card p-6">
                  <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Properties</p>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{properties.length}</h4>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Managed Properties</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="vintsy-card group cursor-pointer overflow-hidden"
                    onClick={() => onSelectProperty(property.id)}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={property.image_url} 
                        alt={property.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-4">
                        <h4 className="text-sm font-bold text-white tracking-tight">{property.name}</h4>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Units</span>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">{property.unit_count}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Occupancy</span>
                          <p className="text-xs font-bold text-violet-600">{Math.round(property.occupancy_rate ?? 0)}%</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Value</span>
                          <p className="text-xs font-bold text-emerald-600">${((property.property_value ?? 0) / 1000000).toFixed(1)}M</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="vintsy-card p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8 flex items-center gap-2">
                <CircleDollarSign size={16} />
                Rent Payment History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-violet-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Property</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tenant</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Amount</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-50 dark:divide-zinc-800">
                    {owner.transactions?.map((tx) => (
                      <tr key={tx.id} className="hover:bg-violet-50/30 transition-colors">
                        <td className="p-4 text-sm text-zinc-900 dark:text-white">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="p-4 text-sm text-zinc-900 dark:text-white font-medium">{tx.property_name}</td>
                        <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400">{tx.tenant_name}</td>
                        <td className="p-4 text-sm font-bold text-emerald-600">${tx.amount.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                            tx.status === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
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

          {activeTab === 'documents' && (
            <div className="vintsy-card p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                  <FileText size={16} />
                  Owner Documents
                </h3>
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="vintsy-button-primary text-[10px] uppercase tracking-widest"
                >
                  Upload Document
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owner.documents?.map(doc => (
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
                {(!owner.documents || owner.documents.length === 0) && (
                  <div className="md:col-span-2 py-12 text-center text-zinc-500 text-sm italic">
                    No documents uploaded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="vintsy-card p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {owner.activities?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((activity, idx) => (
                <div key={activity.id} className="flex gap-4 relative">
                  {idx !== (owner.activities?.length || 0) - 1 && (
                    <div className="absolute left-2 top-6 bottom-0 w-px bg-violet-100 dark:bg-zinc-800" />
                  )}
                  <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 z-10 mt-1 flex items-center justify-center ${
                    activity.type === 'Payment' ? 'bg-emerald-500' :
                    activity.type === 'Property' ? 'bg-violet-500' :
                    activity.type === 'Document' ? 'bg-blue-500' :
                    'bg-zinc-400'
                  }`} />
                  <div>
                    <p className="text-sm text-zinc-900 dark:text-white font-medium">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        activity.type === 'Payment' ? 'bg-emerald-100 text-emerald-700' :
                        activity.type === 'Property' ? 'bg-violet-100 text-violet-700' :
                        activity.type === 'Document' ? 'bg-blue-100 text-blue-700' :
                        'bg-zinc-100 text-zinc-600'
                      }`}>
                        {activity.type}
                      </span>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{new Date(activity.date).toLocaleDateString()} • {new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!owner.activities || owner.activities.length === 0) && (
                <p className="text-sm text-zinc-500 italic">No recent activity recorded.</p>
              )}
            </div>
          </div>

          <div className="vintsy-card p-8 bg-zinc-900 text-white">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Quick Support</h3>
            <div className="space-y-4">
              <button className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                <Mail size={16} className="text-violet-400" />
                Email Owner
              </button>
              <button className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                <Phone size={16} className="text-violet-400" />
                Call Owner
              </button>
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-violet-100 dark:border-zinc-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Document Name</label>
                <input 
                  type="text" 
                  required
                  value={documentForm.name}
                  onChange={e => setDocumentForm({...documentForm, name: e.target.value})}
                  className="vintsy-input w-full"
                  placeholder="e.g. Management Agreement 2024"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Document Type</label>
                <select 
                  value={documentForm.type}
                  onChange={e => setDocumentForm({...documentForm, type: e.target.value})}
                  className="vintsy-input w-full appearance-none"
                >
                  <option value="Contract">Contract</option>
                  <option value="ID">Identification</option>
                  <option value="Tax">Tax Document</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Document URL (Mock)</label>
                <input 
                  type="text" 
                  required
                  value={documentForm.url}
                  onChange={e => setDocumentForm({...documentForm, url: e.target.value})}
                  className="vintsy-input w-full"
                  placeholder="https://example.com/doc.pdf"
                />
              </div>
              <button type="submit" className="w-full vintsy-button-primary py-3 mt-6">
                Upload Document
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
