import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus,
  MessageSquare,
  Home,
  ChevronRight,
  X,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceRequest, Unit, Tenant } from '../types';

export const Maintenance: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [requestForm, setRequestForm] = useState<Partial<MaintenanceRequest>>({
    title: '',
    description: '',
    priority: 'Medium',
    unit_id: 0,
    tenant_id: 0
  });

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [requestsData, unitsData, tenantsData] = await Promise.all([
        api.getMaintenance(user.id),
        api.getUnits(),
        api.getTenants()
      ]);
      setRequests(requestsData);
      setUnits(unitsData);
      setTenants(tenantsData);
    } catch (error) {
      console.error("Failed to load maintenance data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!hasPermission('MAINTENANCE', 'view')) {
    return (
      <div className="p-8 h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-zinc-400" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mb-2">Access Restricted</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">
            You do not have the required permissions to view maintenance requests.
          </p>
        </div>
      </div>
    );
  }

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMaintenance(requestForm);
      setShowAddModal(false);
      setRequestForm({
        title: '',
        description: '',
        priority: 'Medium',
        unit_id: 0,
        tenant_id: 0
      });
      loadData();
    } catch (error) {
      console.error('Failed to add maintenance request:', error);
      alert('Failed to add maintenance request. Please check your connection and permissions.');
    }
  };

  const priorityColors = {
    Emergency: 'bg-red-50 text-red-700 border-red-100',
    High: 'bg-orange-50 text-orange-700 border-orange-100',
    Medium: 'bg-violet-50 text-violet-700 border-violet-100',
    Low: 'bg-zinc-50 text-zinc-500 border-zinc-100',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-1">Service</h3>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight">Maintenance Requests</p>
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
        {requests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="vintsy-card p-8 flex items-center gap-8 group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-md overflow-hidden ${priorityColors[request.priority as keyof typeof priorityColors]}`}>
              {request.image_url ? (
                <img src={request.image_url || null} alt="Request Media" className="w-full h-full object-cover" />
              ) : (
                <Wrench size={24} />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-bold text-zinc-900 tracking-tight group-hover:text-violet-700 transition-colors">{request.title}</h4>
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${priorityColors[request.priority as keyof typeof priorityColors]}`}>
                  {request.priority}
                </span>
              </div>
              <p className="text-sm text-zinc-500 mb-4 max-w-2xl font-medium">{request.description}</p>
              <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <span className="flex items-center gap-2">
                  <Clock size={12} className="text-violet-700" />
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-2">
                  <Home size={12} className="text-violet-700" />
                  Unit {request.unit_number} • {request.first_name} {request.last_name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Status</span>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 size={16} />
                  {request.status}
                </div>
              </div>
              <button className="w-12 h-12 rounded-xl border border-violet-100 flex items-center justify-center text-zinc-300 hover:text-violet-700 hover:border-violet-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95">
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-violet-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900">Create Maintenance Request</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  value={requestForm.title}
                  onChange={e => setRequestForm({...requestForm, title: e.target.value})}
                  className="vintsy-input w-full"
                  placeholder="e.g., Leaking faucet in kitchen"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  required
                  value={requestForm.description}
                  onChange={e => setRequestForm({...requestForm, description: e.target.value})}
                  className="vintsy-input w-full min-h-[100px]"
                  placeholder="Provide details about the issue..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Unit</label>
                  <select 
                    required
                    value={requestForm.unit_id || ''}
                    onChange={e => {
                      const unitId = Number(e.target.value);
                      const tenant = tenants.find(t => t.unit_id === unitId);
                      setRequestForm({
                        ...requestForm, 
                        unit_id: unitId,
                        tenant_id: tenant ? tenant.id : 0
                      });
                    }}
                    className="vintsy-input w-full appearance-none"
                  >
                    <option value="">Select a unit...</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.property_name} - Unit {u.unit_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Priority</label>
                  <select 
                    value={requestForm.priority}
                    onChange={e => setRequestForm({...requestForm, priority: e.target.value as any})}
                    className="vintsy-input w-full appearance-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Photo / Video (Optional)</label>
                <div className="flex items-center gap-4">
                  {requestForm.image_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200">
                      <img src={requestForm.image_url || null} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && user) {
                        try {
                          const { id, url } = await api.uploadAsset(file, user.id);
                          setRequestForm({ ...requestForm, image_url: url, image_asset_id: id });
                        } catch (error) {
                          console.error('Error uploading media:', error);
                          alert('Failed to upload media. Please try again.');
                        }
                      }
                    }}
                    className="vintsy-input w-full"
                  />
                </div>
              </div>
              <button type="submit" className="w-full vintsy-button-primary py-3 mt-6">
                Submit Request
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
