import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus,
  MessageSquare,
  Home,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceRequest, Unit, Tenant } from '../types';

export const Maintenance: React.FC = () => {
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
    const [requestsData, unitsData, tenantsData] = await Promise.all([
      api.getMaintenance(),
      api.getUnits(),
      api.getTenants()
    ]);
    setRequests(requestsData);
    setUnits(unitsData);
    setTenants(tenantsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const priorityColors = {
    Emergency: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800',
    High: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800',
    Medium: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-800',
    Low: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
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
        {requests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="vintsy-card p-8 flex items-center gap-8 group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-md ${priorityColors[request.priority as keyof typeof priorityColors]}`}>
              <Wrench size={24} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">{request.title}</h4>
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${priorityColors[request.priority as keyof typeof priorityColors]}`}>
                  {request.priority}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-2xl font-medium">{request.description}</p>
              <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                <span className="flex items-center gap-2">
                  <Clock size={12} className="text-violet-700 dark:text-violet-400" />
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-2">
                  <Home size={12} className="text-violet-700 dark:text-violet-400" />
                  Unit {request.unit_number} • {request.first_name} {request.last_name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Status</span>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 size={16} />
                  {request.status}
                </div>
              </div>
              <button className="w-12 h-12 rounded-xl border border-violet-100 dark:border-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-600 hover:text-violet-700 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-500 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95">
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
            className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-violet-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Create Maintenance Request</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
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
