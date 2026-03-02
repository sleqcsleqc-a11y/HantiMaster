import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Building2, MapPin, Home, MoreVertical, Plus, Filter, ArrowUpDown, Search, X } from 'lucide-react';
import { api } from '../services/api';
import { Property, Owner } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface PropertiesProps {
  onSelectProperty: (id: number) => void;
}

export const Properties: React.FC<PropertiesProps> = ({ onSelectProperty }) => {
  const { user, hasPermission } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Sort states
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'units' | 'occupancy' | 'value'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [occupancyStatus, setOccupancyStatus] = useState('All');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [propertyForm, setPropertyForm] = useState({ name: '', address: '', type: 'Residential', image_url: '', property_value: 0, owner_id: '' });

  const loadProperties = () => {
    api.getProperties(user?.id).then(data => {
      setProperties(data);
      setFilteredProperties(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user) {
      loadProperties();
      api.getOwners().then(setOwners);
    }
  }, [user]);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createProperty({
      ...propertyForm,
      owner_id: propertyForm.owner_id ? Number(propertyForm.owner_id) : undefined
    });
    setShowAddProperty(false);
    setPropertyForm({ name: '', address: '', type: 'Residential', image_url: '', property_value: 0, owner_id: '' });
    loadProperties();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPropertyForm({ ...propertyForm, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    let result = [...properties];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.address.toLowerCase().includes(q)
      );
    }

    if (filterType !== 'All') {
      result = result.filter(p => p.type === filterType);
    }

    if (minPrice) {
      result = result.filter(p => (p.property_value ?? 0) >= Number(minPrice));
    }
    
    if (maxPrice) {
      result = result.filter(p => (p.property_value ?? 0) <= Number(maxPrice));
    }

    if (occupancyStatus !== 'All') {
      if (occupancyStatus === 'Fully Occupied') {
        result = result.filter(p => (p.occupancy_rate ?? 0) >= 100);
      } else if (occupancyStatus === 'Partially Occupied') {
        result = result.filter(p => (p.occupancy_rate ?? 0) > 0 && (p.occupancy_rate ?? 0) < 100);
      } else if (occupancyStatus === 'Vacant') {
        result = result.filter(p => (p.occupancy_rate ?? 0) === 0);
      }
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'units') return (b.unit_count ?? 0) - (a.unit_count ?? 0);
      if (sortBy === 'occupancy') return (b.occupancy_rate ?? 0) - (a.occupancy_rate ?? 0);
      if (sortBy === 'value') return (b.property_value ?? 0) - (a.property_value ?? 0);
      return 0;
    });

    setFilteredProperties(result);
  }, [filterType, sortBy, searchQuery, minPrice, maxPrice, occupancyStatus, properties]);

  const propertyTypes = ['All', ...new Set(properties.map(p => p.type))];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Portfolio</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Real Estate Assets</p>
        </div>
        
        {hasPermission('PROPERTY_MANAGEMENT', 'create') && (
          <button 
            onClick={() => setShowAddProperty(true)}
            className="vintsy-button-primary flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            <Plus size={16} />
            Add Property
          </button>
        )}
      </div>

      {showAddProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-violet-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Add New Property</h3>
              <button 
                onClick={() => setShowAddProperty(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddProperty} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Property Name</label>
                  <input 
                    type="text" 
                    required
                    value={propertyForm.name}
                    onChange={e => setPropertyForm({...propertyForm, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Property Type</label>
                  <select 
                    value={propertyForm.type}
                    onChange={e => setPropertyForm({...propertyForm, type: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Address</label>
                <input 
                  type="text" 
                  required
                  value={propertyForm.address}
                  onChange={e => setPropertyForm({...propertyForm, address: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Property Value ($)</label>
                  <input 
                    type="number" 
                    required
                    value={propertyForm.property_value}
                    onChange={e => setPropertyForm({...propertyForm, property_value: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Owner</label>
                  <select 
                    value={propertyForm.owner_id}
                    onChange={e => setPropertyForm({...propertyForm, owner_id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all"
                  >
                    <option value="">Select an owner...</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.first_name} {o.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Property Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
                    {propertyForm.image_url ? (
                      <img src={propertyForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="text-zinc-300" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="property-image-upload"
                    />
                    <label 
                      htmlFor="property-image-upload"
                      className="inline-block px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all"
                    >
                      Choose Image
                    </label>
                    <p className="text-[9px] text-zinc-400 mt-2 uppercase tracking-widest font-bold">PNG, JPG up to 5MB. Auto-resized to fit.</p>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full vintsy-button-primary py-3 mt-6">
                Save Property
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <div className="vintsy-card p-6 mb-12 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
          <Filter size={16} />
          Advanced Search
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by name or location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400"
            />
          </div>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Min Price" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400"
            />
            <input 
              type="number" 
              placeholder="Max Price" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400"
            />
          </div>
          <select 
            value={occupancyStatus}
            onChange={(e) => setOccupancyStatus(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="All">All Occupancy</option>
            <option value="Fully Occupied">Fully Occupied</option>
            <option value="Partially Occupied">Partially Occupied</option>
            <option value="Vacant">Vacant</option>
          </select>
          <div className="flex gap-2">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all appearance-none cursor-pointer"
            >
              {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="name">Sort: Name</option>
              <option value="units">Sort: Units</option>
              <option value="occupancy">Sort: Occupancy</option>
              <option value="value">Sort: Value</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="vintsy-card group cursor-pointer"
            onClick={() => onSelectProperty(property.id)}
          >
            <div className="relative h-64 overflow-hidden">
              <img 
                src={property.image_url} 
                alt={property.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="px-2.5 py-1 bg-violet-700 text-white text-[9px] font-bold rounded-lg uppercase tracking-widest shadow-xl">
                  {property.type}
                </span>
                <h4 className="text-2xl font-bold text-white mt-3 tracking-tight drop-shadow-md">{property.name}</h4>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <MapPin size={14} className="text-violet-700 dark:text-violet-400" />
                <span>{property.address}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-violet-100/50 dark:border-zinc-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Units</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{property.unit_count} Units</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Occupancy</span>
                  <p className="text-sm font-bold text-violet-700 dark:text-violet-400">{Math.round(property.occupancy_rate ?? 0)}%</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Value</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${((property.property_value ?? 0) / 1000000).toFixed(1)}M</p>
                </div>
              </div>

              <button className="w-full vintsy-button-secondary text-[10px] uppercase tracking-widest py-3.5 group-hover:bg-violet-700 group-hover:text-white group-hover:border-violet-700 dark:group-hover:bg-violet-600 dark:group-hover:border-violet-600 transition-all duration-300 shadow-sm hover:shadow-lg">
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
