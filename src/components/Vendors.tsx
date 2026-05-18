
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
  User,
  Star,
  FileCheck,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vendor } from '../types';
import { api } from '../services/api';

export const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [woStatusFilter, setWoStatusFilter] = useState('All');
  const [woSortOrder, setWoSortOrder] = useState<'newest' | 'oldest'>('newest');

  // New review form
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: '' });

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

  const [certFile, setCertFile] = useState<File | null>(null);
  const [uploadingCert, setUploadingCert] = useState(false);

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

  const loadVendorDetails = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setLoadingDetails(true);
    try {
      const [ops, revs] = await Promise.all([
        api.getVendorWorkOrders(vendor.id),
        api.getVendorReviews(vendor.id)
      ]);
      setWorkOrders(ops || []);
      setReviews(revs || []);
    } catch (err) {
      console.error('Failed to load vendor details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    try {
      // Use current user id or a dummy uuid for now if not available
      const { data: { user } } = await supabase.auth.getUser();
      await api.addVendorReview({
        vendor_id: selectedVendor.id,
        rating: reviewForm.rating,
        review_text: reviewForm.review_text,
        user_id: user?.id || '' // Assuming there's a valid user
      });
      setReviewForm({ rating: 5, review_text: '' });
      loadVendorDetails(selectedVendor);
      fetchVendors(); // Update list to reflect new rating
    } catch (err) {
      console.error(err);
      alert('Failed to add review');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let certUrl = formData.certification_url;
    if (certFile) {
       setUploadingCert(true);
       try {
         const { data: { user } } = await supabase.auth.getUser();
         const res = await api.uploadAsset(certFile, user?.id || 'system');
         certUrl = res.url;
       } catch (err) {
         console.error('Failed to upload file', err);
         alert('Failed to upload file');
       }
       setUploadingCert(false);
    }

    const payload = {
      ...formData,
      certification_url: certUrl,
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
    setCertFile(null);
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
      rating: 5.0
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
    (selectedCategory === 'All' || v.category === selectedCategory) &&
    (selectedRating === 'All' || 
     (selectedRating === '4+' && v.rating && v.rating >= 4) ||
     (selectedRating === '3+' && v.rating && v.rating >= 3))
  ).sort((a, b) => {
    if (selectedRating === 'High') return (b.rating || 0) - (a.rating || 0);
    if (selectedRating === 'Low') return (a.rating || 0) - (b.rating || 0);
    return 0; // maintain original sorting (by name) otherwise
  });

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
          <select 
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-white text-zinc-600 border-2 border-zinc-100 hover:border-zinc-300 outline-none appearance-none cursor-pointer"
          >
            <option value="All">All Ratings</option>
            <option value="4+">4.0+ Stars</option>
            <option value="3+">3.0+ Stars</option>
            <option value="High">Highest Rated</option>
            <option value="Low">Lowest Rated</option>
          </select>
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
                      <Star className={`w-4 h-4 ${vendor.rating && vendor.rating >= 4 ? 'text-amber-400 fill-amber-400' : ''}`} />
                      <span className="text-sm font-medium">{vendor.rating ? `${vendor.rating} / 5.0` : 'Not Rated'}</span>
                    </div>
                    {vendor.insurance_expiry && (
                       <div className="flex items-center gap-3 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                         <ShieldCheck className={`w-4 h-4 ${new Date(vendor.insurance_expiry) > new Date() ? 'text-emerald-500' : 'text-red-500'}`} />
                         <span className={`text-sm font-medium ${new Date(vendor.insurance_expiry) < new Date() ? 'text-red-500' : ''}`}>
                           Insurance {new Date(vendor.insurance_expiry) > new Date() ? 'Valid until' : 'Expired'} {new Date(vendor.insurance_expiry).toLocaleDateString()}
                         </span>
                       </div>
                    )}
                    {vendor.certification_url && (
                        <div className="flex items-center gap-3 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                          <FileCheck className="w-4 h-4 text-violet-500" />
                          <a href={vendor.certification_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-violet-600 hover:underline">
                            View Certifications
                          </a>
                        </div>
                    )}
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
                    <button 
                      onClick={() => loadVendorDetails(vendor)}
                      className="text-zinc-900 font-black text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                    >
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
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Certification Upload</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                        className="vintsy-input w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {formData.certification_url && (
                        <a href={formData.certification_url} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-800 shrink-0">
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rating (0-5)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="5"
                      step="0.1"
                      className="vintsy-input w-full"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value) || 0})}
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
      {/* Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="vintsy-card w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl bg-white flex flex-col"
          >
            <div className="p-8 border-b border-zinc-100 flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                  {selectedVendor.company_name}
                  <span className="px-3 py-1 bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-widest rounded-full leading-none">
                    {selectedVendor.category}
                  </span>
                </h3>
                <div className="flex items-center gap-4 mt-3">
                   <div className="flex items-center gap-1.5 text-zinc-500 font-medium text-sm">
                     <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                     {selectedVendor.rating ? selectedVendor.rating.toFixed(1) : 'No Ratings'}
                   </div>
                   <div className="flex items-center gap-1.5 text-zinc-500 font-medium text-sm">
                     <User className="w-4 h-4" />
                     {selectedVendor.contact_person}
                   </div>
                   <div className="flex items-center gap-1.5 text-zinc-500 font-medium text-sm">
                     <Phone className="w-4 h-4" />
                     {selectedVendor.phone}
                   </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVendor(null)}
                className="p-2 hover:bg-zinc-100 rounded-xl transition-colors shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50">
              {loadingDetails ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Work Orders */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center gap-2">
                       <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                         <Wrench className="w-4 h-4" /> Associated Work Orders
                       </h4>
                     </div>
                     <div className="flex items-center gap-2 mb-4">
                       <select 
                         className="vintsy-input py-1.5 px-3 text-xs w-full sm:w-auto"
                         value={woStatusFilter}
                         onChange={e => setWoStatusFilter(e.target.value)}
                       >
                         <option value="All">All Statuses</option>
                         <option value="Sent">Sent</option>
                         <option value="In Progress">In Progress</option>
                         <option value="Completed">Completed</option>
                       </select>
                       <select 
                         className="vintsy-input py-1.5 px-3 text-xs w-full sm:w-auto"
                         value={woSortOrder}
                         onChange={e => setWoSortOrder(e.target.value as any)}
                       >
                         <option value="newest">Newest First</option>
                         <option value="oldest">Oldest First</option>
                       </select>
                     </div>
                     <div className="space-y-3">
                       {workOrders.filter(wo => woStatusFilter === 'All' || wo.status === woStatusFilter).sort((a,b) => {
                         const dateA = new Date(a.created_at).getTime();
                         const dateB = new Date(b.created_at).getTime();
                         return woSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                       }).length === 0 ? (
                         <div className="p-6 bg-white rounded-2xl border border-zinc-100 text-center text-sm font-medium text-zinc-400">
                           No work orders match the criteria.
                         </div>
                       ) : (
                         workOrders.filter(wo => woStatusFilter === 'All' || wo.status === woStatusFilter)
                         .sort((a,b) => {
                           const dateA = new Date(a.created_at).getTime();
                           const dateB = new Date(b.created_at).getTime();
                           return woSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                         })
                         .map(wo => (
                           <div key={wo.id} className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex flex-col gap-2">
                             <div className="flex justify-between items-start">
                               <span className="font-bold text-zinc-900 text-sm">{wo.maintenance_requests?.title || 'Unknown Task'}</span>
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                                 wo.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                 wo.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                 'bg-amber-50 text-amber-700 border-amber-200'
                               }`}>
                                 {wo.status}
                               </span>
                             </div>
                             <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                               <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {wo.maintenance_requests?.units?.properties?.name || 'Unknown Property'} - Unit {wo.maintenance_requests?.units?.unit_number || '?'}</span>
                               <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(wo.created_at).toLocaleDateString()}</span>
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                  </div>

                  {/* Reviews */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                       <Star className="w-4 h-4" /> Performance Reviews
                     </h4>

                     <form onSubmit={handleAddReview} className="p-5 bg-white rounded-2xl border border-violet-100 shadow-sm space-y-4">
                       <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Rating</label>
                         <div className="flex gap-2">
                           {[1,2,3,4,5].map(star => (
                             <button
                               key={star}
                               type="button"
                               onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                               className={`p-2 rounded-xl transition-all ${reviewForm.rating >= star ? 'bg-amber-50 text-amber-500 scale-110' : 'bg-zinc-50 text-zinc-300'}`}
                             >
                               <Star className={`w-5 h-5 ${reviewForm.rating >= star ? 'fill-amber-500' : ''}`} />
                             </button>
                           ))}
                         </div>
                       </div>
                       <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Review Comment</label>
                         <textarea
                           required
                           rows={3}
                           placeholder="How was their service?"
                           className="vintsy-input w-full resize-none"
                           value={reviewForm.review_text}
                           onChange={e => setReviewForm(prev => ({ ...prev, review_text: e.target.value }))}
                         />
                       </div>
                       <button type="submit" className="vintsy-button-primary w-full text-xs">
                         Submit Review
                       </button>
                     </form>

                     <div className="space-y-4">
                       {reviews.length === 0 ? (
                         <div className="text-center text-sm font-medium text-zinc-400 py-4">No reviews yet.</div>
                       ) : (
                         reviews.map(rev => (
                           <div key={rev.id} className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-2">
                                 <div className="flex">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'}`} />
                                   ))}
                                 </div>
                                 <span className="text-xs font-bold text-zinc-700">{rev.reviewer_name}</span>
                               </div>
                               <span className="text-[10px] uppercase font-bold text-zinc-400">
                                 {new Date(rev.created_at).toLocaleDateString()}
                               </span>
                             </div>
                             <p className="text-sm font-medium text-zinc-600 leading-relaxed">"{rev.review_text}"</p>
                           </div>
                         ))
                       )}
                     </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

