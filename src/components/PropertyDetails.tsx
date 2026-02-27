import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Home, 
  Plus, 
  ArrowLeft, 
  Edit3, 
  Image as ImageIcon, 
  Upload,
  CheckCircle2,
  X,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../services/api';
import { Property, Unit, PropertyImage, Owner } from '../types';

interface PropertyDetailsProps {
  propertyId: number;
  onBack: () => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ propertyId, onBack }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddImage, setShowAddImage] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);

  // Form states
  const [editForm, setEditForm] = useState<Partial<Property>>({});
  const [unitForm, setUnitForm] = useState({ unit_number: '', rent_amount: 0, status: 'Vacant' as const });
  const [imageForm, setImageForm] = useState({ image_url: '' });

  useEffect(() => {
    loadData();
    api.getOwners().then(setOwners);
  }, [propertyId]);

  const loadData = async () => {
    setLoading(true);
    const [p, u, i] = await Promise.all([
      api.getProperty(propertyId),
      api.getPropertyUnits(propertyId),
      api.getPropertyImages(propertyId)
    ]);
    setProperty(p);
    setEditForm(p);
    setUnits(u);
    setImages(i);
    setLoading(false);
  };

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateProperty(propertyId, {
      ...editForm,
      owner_id: editForm.owner_id ? Number(editForm.owner_id) : undefined
    });
    setIsEditing(false);
    loadData();
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addPropertyUnit(propertyId, unitForm);
    setShowAddUnit(false);
    setUnitForm({ unit_number: '', rent_amount: 0, status: 'Vacant' });
    loadData();
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addPropertyImage(propertyId, imageForm);
    setShowAddImage(false);
    setImageForm({ image_url: '' });
    loadData();
  };

  const exportToPDF = async () => {
    const element = document.getElementById('property-report');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`property-${property?.name.replace(/\s+/g, '-').toLowerCase()}-report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading || !property) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-violet-600 dark:text-violet-400 animate-pulse uppercase tracking-widest text-xs font-bold">Loading Property Details...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24" id="property-report">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-xs uppercase tracking-widest font-bold"
            data-html2canvas-ignore
          >
            <ArrowLeft size={14} />
            Back to Portfolio
          </button>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">{property.type}</h3>
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">{property.name}</h2>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mt-2">
              <MapPin size={14} className="text-violet-600 dark:text-violet-400" />
              <span>{property.address}</span>
            </div>
            {property.owner_name && (
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                <span className="font-bold">Owner:</span> {property.owner_name}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3" data-html2canvas-ignore>
          <button 
            onClick={exportToPDF}
            className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <Download size={14} />
            Export PDF
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <Edit3 size={14} />
            Edit Property
          </button>
          <button 
            onClick={() => setShowAddUnit(true)}
            className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <Plus size={14} />
            Add Unit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info & Gallery */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <div className="vintsy-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Image Gallery</h4>
              <button 
                onClick={() => setShowAddImage(true)}
                className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-2 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                <Upload size={12} />
                Upload Image
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="aspect-video rounded-2xl overflow-hidden border border-violet-100 dark:border-zinc-800 group relative shadow-md">
                <img 
                  src={property.image_url} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                  alt="Main"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-violet-700 text-white text-[8px] font-bold uppercase rounded-lg shadow-xl">Main</div>
              </div>
              {images.map((img) => (
                <div key={img.id} className="aspect-video rounded-2xl overflow-hidden border border-violet-100 dark:border-zinc-800 group shadow-md relative">
                  <img 
                    src={img.image_url} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                    alt="Gallery"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Units Table */}
          <div className="vintsy-card">
            <div className="p-8 border-b border-violet-50 dark:border-zinc-800 flex justify-between items-center">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Units Inventory</h4>
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Total: {units.length} Units
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-violet-50/50 dark:bg-zinc-800/50 border-b border-violet-50 dark:border-zinc-800">
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Unit #</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Rent Amount</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50 dark:divide-zinc-800">
                  {units.map((unit) => (
                    <tr key={unit.id} className="hover:bg-violet-50/20 dark:hover:bg-zinc-800/30 transition-all duration-300 group">
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900 dark:text-white">Unit {unit.unit_number}</td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900 dark:text-white">${unit.rent_amount.toLocaleString()}</td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                          unit.status === 'Occupied' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                            : 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-800'
                        }`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-zinc-300 dark:text-zinc-600 hover:text-violet-700 dark:hover:text-violet-400 transition-colors">
                          <Edit3 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="vintsy-card p-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8">Performance</h4>
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-500 dark:text-zinc-400">Occupancy Rate</span>
                  <span className="text-zinc-900 dark:text-white">{Math.round(property.occupancy_rate ?? 0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-violet-50 dark:bg-zinc-800 rounded-full overflow-hidden border border-violet-100 dark:border-zinc-700">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${property.occupancy_rate ?? 0}%` }}
                    className="h-full bg-violet-600 dark:bg-violet-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-violet-50/30 dark:bg-zinc-800/50 border border-violet-50 dark:border-zinc-800 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Total Units</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{property.unit_count}</p>
                </div>
                <div className="p-4 bg-violet-50/30 dark:bg-zinc-800/50 border border-violet-50 dark:border-zinc-800 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Type</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{property.type}</p>
                </div>
                <div className="col-span-2 p-4 bg-violet-50/30 dark:bg-zinc-800/50 border border-violet-50 dark:border-zinc-800 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Property Value</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${(property.property_value ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="vintsy-card p-8 bg-gradient-to-br from-violet-700 to-violet-900 text-white shadow-xl shadow-violet-600/20">
            <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-80">Property Manager</h4>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white text-violet-800 flex items-center justify-center font-bold text-xs shadow-lg">AD</div>
              <div>
                <p className="text-sm font-bold">Admin User</p>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Senior Manager</p>
              </div>
            </div>
            <button className="w-full py-3.5 bg-white text-violet-800 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-violet-50 transition-all shadow-lg active:scale-95">
              Contact Manager
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg vintsy-card p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Edit Property</h3>
                <button onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateProperty} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Property Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="vintsy-input w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Address</label>
                  <input 
                    type="text" 
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="vintsy-input w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Type</label>
                    <select 
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="vintsy-input w-full appearance-none"
                    >
                      <option>Residential</option>
                      <option>Commercial</option>
                      <option>Industrial</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Property Value</label>
                    <input 
                      type="number" 
                      value={editForm.property_value || ''}
                      onChange={(e) => setEditForm({ ...editForm, property_value: Number(e.target.value) })}
                      className="vintsy-input w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Owner</label>
                  <select 
                    value={editForm.owner_id || ''}
                    onChange={(e) => setEditForm({ ...editForm, owner_id: Number(e.target.value) })}
                    className="vintsy-input w-full appearance-none"
                  >
                    <option value="">Select an owner...</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.first_name} {o.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Main Image URL</label>
                  <input 
                    type="text" 
                    value={editForm.image_url}
                    onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                    className="vintsy-input w-full"
                  />
                </div>
                <button type="submit" className="w-full vintsy-button-primary py-4 text-xs uppercase tracking-widest">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddUnit(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg vintsy-card p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Add New Unit</h3>
                <button onClick={() => setShowAddUnit(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddUnit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Unit Number</label>
                    <input 
                      type="text" 
                      required
                      value={unitForm.unit_number}
                      onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                      placeholder="e.g. 101A"
                      className="vintsy-input w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Monthly Rent</label>
                    <input 
                      type="number" 
                      required
                      value={unitForm.rent_amount}
                      onChange={(e) => setUnitForm({ ...unitForm, rent_amount: Number(e.target.value) })}
                      className="vintsy-input w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Initial Status</label>
                  <select 
                    value={unitForm.status}
                    onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value as any })}
                    className="vintsy-input w-full appearance-none"
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                </div>
                <button type="submit" className="w-full vintsy-button-primary py-4 text-xs uppercase tracking-widest">
                  Create Unit
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddImage(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg vintsy-card p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Upload Gallery Image</h3>
                <button onClick={() => setShowAddImage(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddImage} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Image URL</label>
                  <input 
                    type="text" 
                    required
                    value={imageForm.image_url}
                    onChange={(e) => setImageForm({ ...imageForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="vintsy-input w-full"
                  />
                </div>
                <button type="submit" className="w-full vintsy-button-primary py-4 text-xs uppercase tracking-widest">
                  Add to Gallery
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
