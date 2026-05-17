
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MoreVertical,
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vendor } from '../types';

export const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    category: 'Plumbing',
    status: 'Active',
    tax_id: '',
    address: '',
    insurance_url: '',
    insurance_expiry: '',
    certification_url: '',
    rating: 5.0
  });

  const categories = ['All', 'Plumbing', 'Electrical', 'HVAC', 'Cleaning', 'Landscaping', 'General Repair', 'Security', 'Painting'];

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('company_name', { ascending: true });
    
    if (error) console.error('Error fetching vendors:', error);
    else setVendors(data || []);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      insurance_expiry: formData.insurance_expiry ? formData.insurance_expiry : null
    };

    if (editingVendor) {
      const { error } = await supabase
        .from('vendors')
        .update(payload)
        .eq('id', editingVendor.id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('vendors')
        .insert([payload]);
      if (error) alert(error.message);
    }

    setIsModalOpen(false);
    setEditingVendor(null);
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      category: 'Plumbing',
      status: 'Active',
      tax_id: '',
      address: '',
      insurance_url: '',
      insurance_expiry: '',
      certification_url: '',
      rating: 0
    });
    fetchVendors();
  };

  const deleteVendor = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);
      if (error) alert(error.message);
      else fetchVendors();
    }
  };

  const filteredVendors = vendors.filter(v => 
    (v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     v.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === 'All' || v.category === selectedCategory)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">VENDORS</h2>
          <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs mt-1">Professional Network Management</p>
        </div>
        <button 
          onClick={() => {
            setEditingVendor(null);
            setFormData({
              company_name: '',
              contact_person: '',
              email: '',
              phone: '',
              category: 'Plumbing',
              status: 'Active',
              tax_id: '',
              address: '',
              insurance_url: '',
              insurance_expiry: '',
              certification_url: '',
              rating: 0
            });
            setIsModalOpen(true);
          }}
          className="vintsy-button-primary flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search vendors or specialties..."
            className="vintsy-input pl-12 w-full bg-white/50 backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 border-2 ${
                selectedCategory === cat 
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105' 
                  : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading && vendors.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className="vintsy-card h-64 animate-pulse bg-zinc-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode='popLayout'>
            {filteredVendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="vintsy-card group hover:scale-[1.02] transition-all duration-500 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-zinc-900 text-white rounded-2xl group-hover:rotate-6 transition-transform">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => {
                          setEditingVendor(vendor);
                          setFormData({
                            company_name: vendor.company_name || '',
                            contact_person: vendor.contact_person || '',
                            email: vendor.email || '',
                            phone: vendor.phone || '',
                            category: vendor.category || 'Plumbing',
                            status: vendor.status || 'Active',
                            tax_id: vendor.tax_id || '',
                            address: vendor.address || '',
                            insurance_url: vendor.insurance_url || '',
                            insurance_expiry: vendor.insurance_expiry || '',
                            certification_url: vendor.certification_url || '',
                            rating: vendor.rating || 5.0
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors"
                       >
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => deleteVendor(vendor.id)}
                         className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-zinc-900 mb-1 group-hover:translate-x-1 transition-transform tracking-tight">
                    {vendor.company_name.toUpperCase()}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {vendor.category}
                    </span>
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                      vendor.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {vendor.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">{vendor.contact_person}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm font-medium">{vendor.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium truncate">{vendor.email}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Verified Partner
                    </div>
                    <button className="text-zinc-900 font-black text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                      Profile <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="vintsy-card w-full max-w-2xl overflow-hidden shadow-2xl bg-white"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
                    {editingVendor ? 'UPDATE VENDOR' : 'NEW PARTNER REGISTER'}
                  </h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Vendor Integration Portal</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto px-1">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Company Name</label>
                    <input 
                      type="text" 
                      required
                      className="vintsy-input w-full"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Main Category</label>
                    <select 
                      className="vintsy-input w-full"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact Person</label>
                    <input 
                      type="text" 
                      required
                      className="vintsy-input w-full"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</label>
                    <select 
                      className="vintsy-input w-full"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending Validation</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Business Email</label>
                    <input 
                      type="email" 
                      required
                      className="vintsy-input w-full"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      className="vintsy-input w-full"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Office Address</label>
                    <input 
                      type="text" 
                      className="vintsy-input w-full"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Insurance Expiry</label>
                    <input 
                      type="date" 
                      className="vintsy-input w-full"
                      value={formData.insurance_expiry}
                      onChange={(e) => setFormData({...formData, insurance_expiry: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Insurance Doc URL</label>
                    <input 
                      type="text" 
                      placeholder="https://..."
                      className="vintsy-input w-full"
                      value={formData.insurance_url}
                      onChange={(e) => setFormData({...formData, insurance_url: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 mt-6 border-t border-zinc-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="vintsy-button-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="vintsy-button-primary flex-1"
                  >
                    {editingVendor ? 'Save Changes' : 'Register Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

