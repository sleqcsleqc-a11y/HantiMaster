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
  Lock,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceRequest, Unit, Tenant, Vendor } from '../types';
import { useToast } from '../contexts/ToastContext';

export const Maintenance: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [assigningVendor, setAssigningVendor] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
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
      const [requestsData, unitsData, tenantsData, vendorsData] = await Promise.all([
        api.getMaintenance(user.id),
        api.getUnits(),
        api.getTenants(),
        api.getVendors()
      ]);
      setRequests(requestsData);
      setUnits(unitsData);
      setTenants(tenantsData);
      setVendors(vendorsData);
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
      addToast('Maintenance request created successfully', 'success');
    } catch (error) {
      console.error('Failed to add maintenance request:', error);
      addToast('Failed to add maintenance request', 'error');
    }
  };

  const handleAssignVendor = async (requestId: number, vendorId: number) => {
    try {
      setAssigningVendor(true);
      await api.assignVendorToRequest(requestId, vendorId);
      addToast('Vendor assigned successfully', 'success');
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      console.error('Failed to assign vendor:', error);
      addToast('Failed to assign vendor', 'error');
    } finally {
      setAssigningVendor(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedRequest.vendor_id) return;

    try {
      await api.createMaintenanceInvoice(selectedRequest.id, selectedRequest.vendor_id, {
        amount: Number(invoiceForm.amount),
        description: invoiceForm.description,
        date: invoiceForm.date
      });
      addToast('Invoice recorded and request completed', 'success');
      setShowInvoiceModal(false);
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      console.error('Failed to create invoice:', error);
      addToast('Failed to record invoice', 'error');
    }
  };

  const handleUpdateStatus = async (requestId: number, status: string) => {
    try {
      await api.updateMaintenance(requestId, { status: status as any });
      addToast('Status updated successfully', 'success');
      loadData();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      addToast('Failed to update status', 'error');
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
              <button 
                onClick={() => setSelectedRequest(request)}
                className="w-12 h-12 rounded-xl border border-violet-100 flex items-center justify-center text-zinc-300 hover:text-violet-700 hover:border-violet-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
              >
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

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-violet-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border mb-2 inline-block ${priorityColors[selectedRequest.priority as keyof typeof priorityColors]}`}>
                  {selectedRequest.priority} Priority
                </span>
                <h3 className="text-2xl font-bold text-zinc-900">{selectedRequest.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Unit Information</label>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Home size={16} className="text-violet-600" />
                    <span className="text-sm font-bold text-zinc-900">Unit {selectedRequest.unit_number}</span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">Tenant: {selectedRequest.first_name} {selectedRequest.last_name}</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Status Control</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedRequest.status}
                    onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value)}
                    className="flex-1 vintsy-input py-2 text-sm"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Issue Description</label>
              <p className="text-sm text-zinc-600 leading-relaxed font-medium bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                {selectedRequest.description}
              </p>
            </div>

            {selectedRequest.image_url && (
              <div className="mb-8">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Attachments</label>
                <div className="rounded-2xl overflow-hidden border border-zinc-200">
                  <img src={selectedRequest.image_url || null} alt="Attachment" className="w-full h-auto max-h-[300px] object-cover" />
                </div>
              </div>
            )}

            <div className="border-t border-zinc-100 pt-8">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Vendor Assignment</label>
              <div className="space-y-4">
                {selectedRequest.vendor_id ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Briefcase size={20} className="text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Assigned Vendor</p>
                        <p className="text-xs text-emerald-600">{vendors.find(v => v.id === selectedRequest.vendor_id)?.company_name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setInvoiceForm({
                          amount: '',
                          description: selectedRequest.title,
                          date: new Date().toISOString().split('T')[0]
                        });
                        setShowInvoiceModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                    >
                      Complete & Add Invoice
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select 
                      className="w-full vintsy-input appearance-none"
                      onChange={(e) => {
                        const vendorId = Number(e.target.value);
                        if (vendorId) handleAssignVendor(selectedRequest.id, vendorId);
                      }}
                      disabled={assigningVendor}
                    >
                      <option value="">Select a professional vendor...</option>
                      {vendors.filter(v => v.status === 'Active').map(v => (
                        <option key={v.id} value={v.id}>{v.company_name} ({v.category})</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-400 font-medium italic">Assigning a vendor will automatically generate a work order and notify the service provider.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {showInvoiceModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-violet-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900">Record Vendor Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Invoice Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={invoiceForm.amount}
                  onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                  className="vintsy-input w-full"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date" 
                    required
                    value={invoiceForm.date}
                    onChange={e => setInvoiceForm({...invoiceForm, date: e.target.value})}
                    className="vintsy-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Category</label>
                  <div className="vintsy-input w-full bg-zinc-50 text-zinc-400 flex items-center">Maintenance</div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Memo / Notes</label>
                <textarea 
                  value={invoiceForm.description}
                  onChange={e => setInvoiceForm({...invoiceForm, description: e.target.value})}
                  className="vintsy-input w-full min-h-[80px]"
                />
              </div>
              <button type="submit" className="w-full vintsy-button-primary py-3">Finalize Work Order</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
