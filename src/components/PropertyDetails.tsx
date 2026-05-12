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
  Circle,
  X,
  Download,
  FileText,
  ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { api } from '../services/api';
import { Property, Unit, PropertyImage, Owner, PropertyDocument } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface PropertyDetailsProps {
  propertyId: number;
  onBack: () => void;
  onSelectOwner: (id: number) => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ propertyId, onBack, onSelectOwner }) => {
  const { user, hasPermission } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddImage, setShowAddImage] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [tenants, setTenants] = useState<any[]>([]); // For tenant assignment
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Unit Filtering & Sorting State
  const [filterStatus, setFilterStatus] = useState<'All' | 'Occupied' | 'Vacant'>('All');
  const [filterTenant, setFilterTenant] = useState('');
  const [sortField, setSortField] = useState<'unit_number' | 'rent_amount' | 'status'>('unit_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Unit Details/Edit State
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isUnitEditMode, setIsUnitEditMode] = useState(false);
  const [unitEditForm, setUnitEditForm] = useState<Partial<Unit> & { tenant_first_name?: string, tenant_last_name?: string }>({});

  // Form states
  const [editForm, setEditForm] = useState<Partial<Property>>({});
  const [unitForm, setUnitForm] = useState({ unit_number: '', rent_amount: 0, status: 'Vacant' as const });
  const [imageForm, setImageForm] = useState({ image_url: '' });
  const [documentForm, setDocumentForm] = useState({ name: '', url: '', type: 'Contract' });

  const availableAmenities = ['Pool', 'Gym', 'Parking', 'Elevator', 'Security', 'Laundry', 'Balcony', 'Pet Friendly', 'WiFi'];

  useEffect(() => {
    loadData();
    api.getOwners().then(setOwners);
    api.getTenants().then(setTenants);
  }, [propertyId]);

  const loadData = async () => {
    setLoading(true);
    const [p, u, i, d] = await Promise.all([
      api.getProperty(propertyId),
      api.getPropertyUnits(propertyId),
      api.getPropertyImages(propertyId),
      api.getPropertyDocuments(propertyId)
    ]);
    setProperty(p);
    setEditForm(p);
    setUnits(u);
    setImages(i);
    setDocuments(d);
    setLoading(false);
  };

  const filteredAndSortedUnits = units
    .filter(unit => {
      if (filterStatus !== 'All' && unit.status !== filterStatus) return false;
      if (filterTenant && !unit.tenant_name?.toLowerCase().includes(filterTenant.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'unit_number') {
        comparison = a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true });
      } else if (sortField === 'rent_amount') {
        comparison = a.rent_amount - b.rent_amount;
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleUnitClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setUnitEditForm({
      ...unit,
      tenant_first_name: unit.tenant_name?.split(' ')[0] || '',
      tenant_last_name: unit.tenant_name?.split(' ').slice(1).join(' ') || ''
    });
    setIsUnitEditMode(false);
    setIsUnitModalOpen(true);
  };

  const handleSaveUnitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    // Check for duplicate unit number if it was changed
    if (unitEditForm.unit_number && unitEditForm.unit_number.toLowerCase() !== selectedUnit.unit_number.toLowerCase()) {
      const isDuplicate = units.some(u => u.unit_number.toLowerCase() === unitEditForm.unit_number!.toLowerCase());
      if (isDuplicate) {
        alert(`Unit number "${unitEditForm.unit_number}" already exists in this property.`);
        return;
      }
    }

    try {
      // Update Unit
      await api.updateUnit(selectedUnit.id, {
        unit_number: unitEditForm.unit_number,
        rent_amount: unitEditForm.rent_amount,
        status: unitEditForm.status
      });

      // Update Tenant if exists and names changed
      if (selectedUnit.tenant_id && (unitEditForm.tenant_first_name || unitEditForm.tenant_last_name)) {
        await api.updateTenant(selectedUnit.tenant_id, {
          first_name: unitEditForm.tenant_first_name,
          last_name: unitEditForm.tenant_last_name,
          notes: unitEditForm.notes
        });
      }

      // If assigning a new tenant (simplified logic for now - ideally use createTenant)
      // For this demo, we'll assume we are just updating existing tenant details linked to the unit
      
      setIsUnitModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to update unit details:', error);
      alert('Failed to update unit details');
    }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      try {
        setUploading(true);
        const { id, url } = await api.uploadAsset(file, user.id);
        setEditForm({ ...editForm, image_url: url, image_asset_id: id });
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        setLocalPreview(null);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate unit number
    const isDuplicate = units.some(u => u.unit_number.toLowerCase() === unitForm.unit_number.toLowerCase());
    if (isDuplicate) {
      alert(`Unit number "${unitForm.unit_number}" already exists in this property.`);
      return;
    }

    try {
      await api.addPropertyUnit(propertyId, unitForm);
      setShowAddUnit(false);
      setUnitForm({ unit_number: '', rent_amount: 0, status: 'Vacant' });
      loadData();
    } catch (error) {
      console.error('Failed to add unit:', error);
      alert('Failed to add unit. Please try again.');
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      try {
        setUploading(true);
        const { id, url } = await api.uploadAsset(file, user.id);
        setImageForm({ image_url: url });
      } catch (error) {
        console.error('Error uploading gallery image:', error);
        alert('Failed to upload image. Please try again.');
        setLocalPreview(null);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageForm.image_url) {
      alert('Please upload an image first.');
      return;
    }
    if (editingImageId) {
      await api.updatePropertyImage(editingImageId, imageForm.image_url);
    } else {
      await api.addPropertyImage(propertyId, imageForm);
    }
    setShowAddImage(false);
    setEditingImageId(null);
    setImageForm({ image_url: '' });
    setLocalPreview(null);
    loadData();
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      await api.uploadPropertyDocument(propertyId, documentForm, user.id);
      setShowAddDocument(false);
      setDocumentForm({ name: '', url: '', type: 'Contract' });
      loadData();
    }
  };

  const handleToggleUnitStatus = async (unit: Unit) => {
    const newStatus = unit.status === 'Vacant' ? 'Occupied' : 'Vacant';
    await api.updateUnit(unit.id, { status: newStatus });
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
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-4">
              {property.name}
              <div className="flex gap-2">
                <span className={`text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold border ${
                  property.status === 'For Sale' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                  property.status === 'Sold' ? 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' :
                  property.status === 'Rented' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                  property.status === 'Under Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                }`}>
                  {property.status || 'Active'}
                </span>
                {property.is_furnished && (
                  <span className="text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                    Furnished
                  </span>
                )}
              </div>
            </h2>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mt-2">
              <MapPin size={14} className="text-violet-600 dark:text-violet-400" />
              <span>{property.address}</span>
            </div>
            {property.owner_name && (
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                <span className="font-bold">Owner:</span> 
                <button 
                  onClick={() => property.owner_id && onSelectOwner(property.owner_id)}
                  className="text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                >
                  {property.owner_name}
                </button>
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
          {hasPermission('PROPERTY_MANAGEMENT', 'edit') && (
            <button 
              onClick={() => setIsEditing(true)}
              className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest"
            >
              <Edit3 size={14} />
              Edit Property
            </button>
          )}
          {hasPermission('PROPERTY_MANAGEMENT', 'create') && (
            <button 
              onClick={() => setShowAddUnit(true)}
              className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest"
            >
              <Plus size={14} />
              Add Unit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info & Gallery */}
        <div className="lg:col-span-2 space-y-8">
          <div className="vintsy-card p-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">Description</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
              {property.description || 'No description provided.'}
            </p>
          </div>

          {/* Gallery */}
          <div className="vintsy-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Image Gallery</h4>
              {hasPermission('PROPERTY_MANAGEMENT', 'edit') && (
                <button 
                  onClick={() => setShowAddImage(true)}
                  className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-2 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                >
                  <Upload size={12} />
                  Upload Image
                </button>
              )}
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
                  {hasPermission('PROPERTY_MANAGEMENT', 'edit') && (
                    <button 
                      onClick={() => {
                        setEditingImageId(img.id);
                        setImageForm({ image_url: img.image_url });
                        setShowAddImage(true);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-zinc-900/90 text-violet-600 dark:text-violet-400 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-violet-50 dark:hover:bg-zinc-800"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="vintsy-card p-8">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8">Amenities</h4>
            <div className="flex flex-wrap gap-3">
              {property.amenities && JSON.parse(property.amenities).length > 0 ? (
                JSON.parse(property.amenities).map((amenity: string) => (
                  <span key={amenity} className="px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-xs font-bold rounded-xl border border-violet-100 dark:border-violet-800/30 flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    {amenity}
                  </span>
                ))
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No amenities listed.</p>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="vintsy-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Property Documents</h4>
              {(hasPermission('PROPERTY_MANAGEMENT', 'edit') || user?.role_name === 'Property Owner') && (
                <button 
                  onClick={() => setShowAddDocument(true)}
                  className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-2 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                >
                  <Upload size={12} />
                  Upload Document
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(doc => (
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
              {documents.length === 0 && (
                <div className="md:col-span-2 py-12 text-center text-zinc-500 text-sm italic">
                  No documents uploaded yet.
                </div>
              )}
            </div>
          </div>

          {/* Units Table */}
          <div className="vintsy-card">
            <div className="p-8 border-b border-violet-50 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Units Inventory</h4>
                <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                  Total: {filteredAndSortedUnits.length} Units
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="vintsy-input py-2 text-xs w-32"
                >
                  <option value="All">All Status</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Vacant">Vacant</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Filter by Tenant..." 
                  value={filterTenant}
                  onChange={(e) => setFilterTenant(e.target.value)}
                  className="vintsy-input py-2 text-xs w-40"
                />
                <select 
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="vintsy-input py-2 text-xs w-32"
                >
                  <option value="unit_number">Unit Number</option>
                  <option value="rent_amount">Rent Amount</option>
                  <option value="status">Status</option>
                </select>
                <button 
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-violet-50/50 dark:bg-zinc-800/50 border-b border-violet-50 dark:border-zinc-800">
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Unit #</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Tenant</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Rent Amount</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50 dark:divide-zinc-800">
                  {filteredAndSortedUnits.map((unit) => (
                    <tr 
                      key={unit.id} 
                      onClick={() => handleUnitClick(unit)}
                      className="hover:bg-violet-50/20 dark:hover:bg-zinc-800/30 transition-all duration-300 group cursor-pointer"
                    >
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900 dark:text-white">Unit {unit.unit_number}</td>
                      <td className="px-8 py-5 text-sm text-zinc-600 dark:text-zinc-400">
                        {unit.tenant_name || <span className="text-zinc-300 dark:text-zinc-600 italic">Vacant</span>}
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900 dark:text-white">${unit.rent_amount.toLocaleString()}</td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                          unit.status === 'Occupied' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                            : 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-800'
                        }`}>
                          {unit.status === 'Occupied' ? <CheckCircle2 size={10} /> : <Circle size={10} />}
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
            <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-80">Property Owner</h4>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white text-violet-800 flex items-center justify-center font-bold text-xs shadow-lg">
                {property.owner_name ? `${property.owner_name.split(' ')[0][0]}${property.owner_name.split(' ')[1]?.[0] || ''}` : 'N/A'}
              </div>
              <div>
                <p className="text-sm font-bold">{property.owner_name || 'No Owner Assigned'}</p>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Owner</p>
              </div>
            </div>
            {property.owner_name && (
              <div className="flex flex-col gap-2">
                {property.owner_email && (
                  <a href={`mailto:${property.owner_email}`} className="w-full text-center py-3.5 bg-white text-violet-800 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-violet-50 transition-all shadow-lg active:scale-95">
                    Email Owner
                  </a>
                )}
                {property.owner_phone && (
                  <a href={`tel:${property.owner_phone}`} className="w-full text-center py-3.5 bg-violet-800/50 text-white border border-violet-500/30 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-violet-800 transition-all shadow-lg active:scale-95">
                    Call Owner
                  </a>
                )}
              </div>
            )}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 mt-6">
                    <input 
                      type="checkbox" 
                      id="edit_is_furnished"
                      checked={editForm.is_furnished || false}
                      onChange={e => setEditForm({...editForm, is_furnished: e.target.checked})}
                      className="w-4 h-4 text-violet-600 rounded border-zinc-300 focus:ring-violet-600"
                    />
                    <label htmlFor="edit_is_furnished" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Is Furnished?</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Description</label>
                    <textarea 
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="vintsy-input w-full"
                      rows={2}
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {availableAmenities.map(amenity => {
                      const currentAmenities = JSON.parse(editForm.amenities || '[]');
                      const isSelected = currentAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => {
                            const newAmenities = isSelected 
                              ? currentAmenities.filter((a: string) => a !== amenity)
                              : [...currentAmenities, amenity];
                            setEditForm({...editForm, amenities: JSON.stringify(newAmenities)});
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected 
                              ? 'bg-violet-600 text-white shadow-md' 
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Property Image</label>
                  <div className="space-y-4">
                    <div className="w-full h-48 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-800/50 relative group">
                      {(localPreview || editForm.image_url) ? (
                        <>
                          <img src={localPreview || editForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <p className="text-white text-xs font-bold uppercase tracking-widest">Change Image</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                          <Building2 size={32} />
                          <span className="text-[10px] uppercase tracking-widest font-bold">No Image Selected</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="edit-property-image-upload"
                      />
                      <label 
                        htmlFor="edit-property-image-upload"
                        className={`inline-block px-6 py-3 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? 'Uploading...' : 'Choose Image'}
                      </label>
                    </div>
                    <p className="text-center text-[9px] text-zinc-400 uppercase tracking-widest font-bold">PNG, JPG up to 5MB. Auto-resized to fit.</p>
                  </div>
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Gallery Image</label>
                  <div className="space-y-4">
                    <div className="w-full h-48 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-800/50 relative group">
                      {(localPreview || imageForm.image_url) ? (
                        <>
                          <img src={localPreview || imageForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <p className="text-white text-xs font-bold uppercase tracking-widest">Change Image</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <ImageIcon size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No image selected</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleGalleryImageUpload}
                        className="hidden"
                        id="gallery-image-upload"
                      />
                      <label 
                        htmlFor="gallery-image-upload"
                        className={`inline-block px-6 py-3 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? 'Uploading...' : 'Choose Image'}
                      </label>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={!imageForm.image_url || uploading} className="w-full vintsy-button-primary py-4 text-xs uppercase tracking-widest disabled:opacity-50">
                  {editingImageId ? 'Update Image' : 'Add to Gallery'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
        {showAddDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddDocument(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg vintsy-card p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Upload Document</h3>
                <button onClick={() => setShowAddDocument(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddDocument} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Document Name</label>
                  <input 
                    type="text" 
                    required
                    value={documentForm.name}
                    onChange={e => setDocumentForm({...documentForm, name: e.target.value})}
                    className="vintsy-input w-full"
                    placeholder="e.g. Lease Agreement"
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
                    <option value="Inspection">Inspection</option>
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
        {isUnitModalOpen && selectedUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUnitModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg vintsy-card p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  {isUnitEditMode ? 'Edit Unit Details' : `Unit ${selectedUnit.unit_number} Details`}
                </h3>
                <div className="flex gap-2">
                  {!isUnitEditMode && (
                    <button 
                      onClick={() => setIsUnitEditMode(true)}
                      className="text-violet-600 hover:text-violet-700 text-xs font-bold uppercase tracking-widest"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => setIsUnitModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><X size={20} /></button>
                </div>
              </div>

              {isUnitEditMode ? (
                <form onSubmit={handleSaveUnitDetails} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Unit Number</label>
                      <input 
                        type="text" 
                        value={unitEditForm.unit_number || ''}
                        onChange={e => setUnitEditForm({...unitEditForm, unit_number: e.target.value})}
                        className="vintsy-input w-full"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Rent Amount</label>
                      <input 
                        type="number" 
                        value={unitEditForm.rent_amount}
                        onChange={e => setUnitEditForm({...unitEditForm, rent_amount: Number(e.target.value)})}
                        className="vintsy-input w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Status</label>
                      <select 
                        value={unitEditForm.status}
                        onChange={e => setUnitEditForm({...unitEditForm, status: e.target.value as any})}
                        className="vintsy-input w-full appearance-none"
                      >
                        <option value="Vacant">Vacant</option>
                        <option value="Occupied">Occupied</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-violet-50 dark:border-zinc-800">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tenant Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">First Name</label>
                        <input 
                          type="text" 
                          value={unitEditForm.tenant_first_name}
                          onChange={e => setUnitEditForm({...unitEditForm, tenant_first_name: e.target.value})}
                          className="vintsy-input w-full"
                          placeholder="Tenant First Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Last Name</label>
                        <input 
                          type="text" 
                          value={unitEditForm.tenant_last_name}
                          onChange={e => setUnitEditForm({...unitEditForm, tenant_last_name: e.target.value})}
                          className="vintsy-input w-full"
                          placeholder="Tenant Last Name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Notes</label>
                      <textarea 
                        value={unitEditForm.notes || ''}
                        onChange={e => setUnitEditForm({...unitEditForm, notes: e.target.value})}
                        className="vintsy-input w-full"
                        rows={3}
                        placeholder="Add notes about the tenant or unit..."
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full vintsy-button-primary py-4 text-xs uppercase tracking-widest">
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Current Status</p>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                        selectedUnit.status === 'Occupied' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                          : 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-800'
                      }`}>
                        {selectedUnit.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Monthly Rent</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">${selectedUnit.rent_amount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-violet-50 dark:border-zinc-800">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Tenant Details</h4>
                    {selectedUnit.tenant_name ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                            {selectedUnit.tenant_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedUnit.tenant_name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Active Tenant</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Lease Start</p>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedUnit.lease_start ? new Date(selectedUnit.lease_start).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Lease End</p>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedUnit.lease_end ? new Date(selectedUnit.lease_end).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        {selectedUnit.notes && (
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Notes</p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">{selectedUnit.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 italic">No tenant assigned to this unit.</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
