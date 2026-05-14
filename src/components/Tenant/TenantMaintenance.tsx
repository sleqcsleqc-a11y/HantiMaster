import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Wrench, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  X,
  ChevronRight,
  Camera
} from 'lucide-react';
import { api } from '../../services/api';
import { MaintenanceRequest, Tenant } from '../../types';

export const TenantMaintenance: React.FC = () => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    image_url: '',
    image_asset_id: ''
  });
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const tenantData = await api.getTenantByUserId(user.id);
      if (tenantData) {
        setTenant(tenantData);
        const requestsData = await api.getTenantMaintenanceRequests(tenantData.id);
        setRequests(requestsData);
      }
    } catch (error) {
      console.error("Failed to load maintenance data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      try {
        setUploading(true);
        const { id, url } = await api.uploadAsset(file, user.id);
        setRequestForm({ ...requestForm, image_url: url, image_asset_id: id });
      } catch (error) {
        console.error('Error uploading media:', error);
        alert('Failed to upload media. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      await api.createMaintenance({
        ...requestForm,
        unit_id: tenant.unit_id,
        tenant_id: tenant.id,
        image_url: requestForm.image_url || undefined,
        image_asset_id: requestForm.image_asset_id || undefined,
        priority: requestForm.priority as any
      });
      setShowAddModal(false);
      setRequestForm({ title: '', description: '', priority: 'Medium', image_url: '', image_asset_id: '' });
      loadData();
    } catch (error) {
      console.error("Failed to submit request", error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading maintenance...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Service</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Maintenance Requests</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest"
        >
          <Plus size={16} />
          New Request
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {requests.length > 0 ? (
          requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="vintsy-card p-8 flex items-center gap-8 group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-md ${
                request.priority === 'Emergency' ? 'bg-red-50 text-red-600 border-red-100' :
                request.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                'bg-violet-50 text-violet-600 border-violet-100'
              }`}>
                <Wrench size={24} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{request.title}</h4>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                    request.priority === 'Emergency' ? 'bg-red-50 text-red-600 border-red-100' :
                    request.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    'bg-violet-50 text-violet-600 border-violet-100'
                  }`}>
                    {request.priority}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-2xl font-medium">{request.description}</p>
                {request.image_url && (
                  <div className="mb-4">
                    {request.image_url.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={request.image_url || null} controls className="w-48 h-auto max-h-48 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700" />
                    ) : (
                      <img src={request.image_url || null} alt="Request" className="w-24 h-24 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700" />
                    )}
                  </div>
                )}
                <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <span className="flex items-center gap-2">
                    <Clock size={12} className="text-violet-700 dark:text-violet-400" />
                    Submitted on {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Status</span>
                  <div className={`flex items-center gap-2 font-bold text-sm ${
                    request.status === 'Completed' ? 'text-emerald-600' : 'text-orange-600'
                  }`}>
                    {request.status === 'Completed' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    {request.status}
                  </div>
                </div>
                <button className="w-12 h-12 rounded-xl border border-violet-100 dark:border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-violet-700 transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="vintsy-card p-12 text-center">
            <Wrench size={48} className="mx-auto text-zinc-200 mb-4" />
            <p className="text-zinc-500 font-medium">No maintenance requests found.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-violet-600 font-bold text-sm hover:underline"
            >
              Submit your first request
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-violet-100 dark:border-zinc-800"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">New Request</h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">What's the issue?</label>
                  <input 
                    type="text" 
                    required
                    value={requestForm.title}
                    onChange={e => setRequestForm({...requestForm, title: e.target.value})}
                    className="vintsy-input w-full"
                    placeholder="e.g., Kitchen sink leak"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Details</label>
                  <textarea 
                    required
                    value={requestForm.description}
                    onChange={e => setRequestForm({...requestForm, description: e.target.value})}
                    className="vintsy-input w-full min-h-[120px]"
                    placeholder="Please describe the problem in detail..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Priority</label>
                    <select 
                      value={requestForm.priority}
                      onChange={e => setRequestForm({...requestForm, priority: e.target.value})}
                      className="vintsy-input w-full appearance-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Photos / Videos (Optional)</label>
                    <div className="flex items-center gap-4">
                      {requestForm.image_url && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                          {requestForm.image_url.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={requestForm.image_url || null} className="w-full h-full object-cover" />
                          ) : (
                            <img src={requestForm.image_url || null} alt="Preview" className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*,video/*"
                          onChange={handleMediaUpload}
                          className="hidden"
                          id="maintenance-media-upload"
                        />
                        <label 
                          htmlFor="maintenance-media-upload"
                          className={`w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:text-violet-600 hover:border-violet-300 transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Camera size={18} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload Photo/Video'}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full vintsy-button-primary py-4 text-xs uppercase tracking-widest mt-4">
                  Submit Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
