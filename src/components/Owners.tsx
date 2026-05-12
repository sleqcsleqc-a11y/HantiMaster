import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Building2, CircleDollarSign, ChevronRight, Search, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Owner } from '../types';

interface OwnersProps {
  onSelectOwner: (id: number) => void;
}

export const Owners: React.FC<OwnersProps> = ({ onSelectOwner }) => {
  const { user } = useAuth();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [ownerForm, setOwnerForm] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    phone: '', 
    address: '',
    property_ids: [] as number[]
  });

  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'property_count' | 'portfolio_value'; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState({ minProperties: 0, minPortfolioValue: 0 });

  const loadOwners = () => {
    api.getOwners().then(data => {
      setOwners(data);
      setLoading(false);
    });
    api.getProperties().then(setProperties);
  };

  useEffect(() => {
    loadOwners();
  }, []);

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerForm.email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    const { property_ids, ...data } = ownerForm;
    const { id } = await api.createOwner({ ...data, admin_id: user?.id });
    
    // Link properties if any
    if (property_ids.length > 0) {
      for (const propId of property_ids) {
        await api.updateProperty(propId, { owner_id: id });
      }
    }

    setShowAddOwner(false);
    setOwnerForm({ first_name: '', last_name: '', email: '', phone: '', address: '', property_ids: [] });
    loadOwners();
  };

  const filteredOwners = owners
    .filter(o => 
      (`${o.first_name} ${o.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (o.property_count || 0) >= filterConfig.minProperties &&
      (o.total_portfolio_value || 0) >= filterConfig.minPortfolioValue
    )
    .sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof Owner];
      let valB: any = b[sortConfig.key as keyof Owner];

      if (sortConfig.key === 'name') {
        valA = `${a.first_name} ${a.last_name}`.toLowerCase();
        valB = `${b.first_name} ${b.last_name}`.toLowerCase();
      } else if (sortConfig.key === 'portfolio_value') {
        valA = a.total_portfolio_value || 0;
        valB = b.total_portfolio_value || 0;
      } else if (sortConfig.key === 'property_count') {
        valA = a.property_count || 0;
        valB = b.property_count || 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Directory</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Property Owners</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Search owners..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs w-64 text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400"
            />
          </div>
          
          <select
            value={sortConfig.key}
            onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value as any })}
            className="px-4 py-2 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none"
          >
            <option value="name">Sort by Name</option>
            <option value="property_count">Sort by Properties</option>
            <option value="portfolio_value">Sort by Value</option>
          </select>

          <button
            onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
            className="p-2 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-zinc-500 hover:text-violet-600 transition-colors"
          >
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </button>

          <button 
            onClick={() => setShowAddOwner(true)}
            className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <Plus size={16} />
            Add Owner
          </button>
        </div>
      </div>

      {showAddOwner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-violet-100 dark:border-zinc-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Add New Owner</h3>
              <button 
                onClick={() => setShowAddOwner(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddOwner} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={ownerForm.first_name}
                    onChange={e => setOwnerForm({...ownerForm, first_name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={ownerForm.last_name}
                    onChange={e => setOwnerForm({...ownerForm, last_name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={ownerForm.email}
                  onChange={e => setOwnerForm({...ownerForm, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={ownerForm.phone}
                  onChange={e => setOwnerForm({...ownerForm, phone: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Address</label>
                <input 
                  type="text" 
                  value={ownerForm.address}
                  onChange={e => setOwnerForm({...ownerForm, address: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Link Properties</label>
                <select 
                  multiple
                  value={ownerForm.property_ids.map(String)}
                  onChange={e => {
                    const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => parseInt(option.value));
                    setOwnerForm({...ownerForm, property_ids: values});
                  }}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all h-24"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-widest font-bold">Hold Ctrl/Cmd to select multiple</p>
              </div>
              <button type="submit" className="w-full vintsy-button-primary py-3 mt-6">
                Save Owner
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOwners.map((owner, index) => (
          <motion.div
            key={owner.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectOwner(owner.id)}
            className="vintsy-card p-8 cursor-pointer group hover:border-violet-500 dark:hover:border-violet-500 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-violet-600/20 group-hover:scale-110 transition-transform duration-300">
                {owner.first_name?.[0]}{owner.last_name?.[0]}
              </div>
              <div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{owner.first_name} {owner.last_name}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{owner.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-violet-50 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Properties</p>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{owner.property_count}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Portfolio Value</p>
                <div className="flex items-center gap-2">
                  <CircleDollarSign size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">${((owner.total_portfolio_value ?? 0) / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-zinc-800 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <ChevronRight size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
