import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Building2, MapPin, Home, MoreVertical, Plus, Filter, ArrowUpDown } from 'lucide-react';
import { api } from '../services/api';
import { Property } from '../types';

interface PropertiesProps {
  onSelectProperty: (id: number) => void;
}

export const Properties: React.FC<PropertiesProps> = ({ onSelectProperty }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Sort states
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'units' | 'occupancy'>('name');

  useEffect(() => {
    api.getProperties().then(data => {
      setProperties(data);
      setFilteredProperties(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...properties];
    
    if (filterType !== 'All') {
      result = result.filter(p => p.type === filterType);
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'units') return (b.unit_count ?? 0) - (a.unit_count ?? 0);
      if (sortBy === 'occupancy') return (b.occupancy_rate ?? 0) - (a.occupancy_rate ?? 0);
      return 0;
    });

    setFilteredProperties(result);
  }, [filterType, sortBy, properties]);

  const propertyTypes = ['All', ...new Set(properties.map(p => p.type))];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Portfolio</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Real Estate Assets</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all">
            <Filter size={14} className="text-violet-600 dark:text-violet-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest outline-none cursor-pointer"
            >
              {propertyTypes.map(type => <option key={type} value={type} className="bg-white dark:bg-zinc-800">{type}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all">
            <ArrowUpDown size={13} className="text-violet-600 dark:text-violet-400" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="name" className="bg-white dark:bg-zinc-800">Name</option>
              <option value="units" className="bg-white dark:bg-zinc-800">Units</option>
              <option value="occupancy" className="bg-white dark:bg-zinc-800">Occupancy</option>
            </select>
          </div>

          <button className="vintsy-button-primary flex items-center gap-2 text-xs uppercase tracking-widest">
            <Plus size={16} />
            Add Property
          </button>
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
              
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-violet-100/50 dark:border-zinc-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Units</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{property.unit_count} Units</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Occupancy</span>
                  <p className="text-sm font-bold text-violet-700 dark:text-violet-400">{Math.round(property.occupancy_rate ?? 0)}%</p>
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
