import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Building2, CircleDollarSign, Users, Wrench, Download, User, Calendar, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Owner, Property } from '../types';

interface OwnerDetailsProps {
  ownerId: number;
  onBack: () => void;
  onSelectProperty: (id: number) => void;
}

export const OwnerDetails: React.FC<OwnerDetailsProps> = ({ ownerId, onBack, onSelectProperty }) => {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOwner(ownerId).then(data => {
      setOwner(data);
      setLoading(false);
    });
  }, [ownerId]);

  if (loading || !owner) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-violet-600 dark:text-violet-400 animate-pulse uppercase tracking-widest text-xs font-bold">Loading Owner Details...</div>
      </div>
    );
  }

  const properties = owner.properties || [];
  const totalValue = properties.reduce((sum, p) => sum + (p.property_value || 0), 0);
  const totalUnits = properties.reduce((sum, p) => sum + (p.unit_count || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-xs uppercase tracking-widest font-bold"
          >
            <ArrowLeft size={14} />
            Back to Directory
          </button>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Owner Portfolio</h3>
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">{owner.first_name} {owner.last_name}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">{owner.email} • {owner.phone}</p>
          </div>
        </div>
        <button className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest">
          <Download size={14} />
          Export Portfolio Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="vintsy-card p-8 bg-gradient-to-br from-violet-700 to-violet-900 text-white shadow-xl shadow-violet-600/20">
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">Total Portfolio Value</p>
          <h4 className="text-4xl font-bold tracking-tighter mb-4">${totalValue.toLocaleString()}</h4>
          <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest">
            <CircleDollarSign size={16} />
            <span>{properties.length} Properties</span>
          </div>
        </div>
        <div className="vintsy-card p-8">
          <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Units</p>
          <h4 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tighter mb-4">{totalUnits}</h4>
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-widest">
            <Building2 size={16} />
            <span>Across Portfolio</span>
          </div>
        </div>
        <div className="vintsy-card p-8">
          <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Average Occupancy</p>
          <h4 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tighter mb-4">
            {properties.length > 0 ? Math.round(properties.reduce((sum, p) => sum + (p.occupancy_rate || 0), 0) / properties.length) : 0}%
          </h4>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <Users size={16} />
            <span>Active Tenants</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Properties Owned</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="vintsy-card group cursor-pointer"
              onClick={() => onSelectProperty(property.id)}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={property.image_url} 
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="text-lg font-bold text-white tracking-tight drop-shadow-md">{property.name}</h4>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-violet-100/50 dark:border-zinc-800">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Units</span>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">{property.unit_count}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Occupancy</span>
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400">{Math.round(property.occupancy_rate ?? 0)}%</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Value</span>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">${((property.property_value ?? 0) / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
                {property.tenant_name && (
                  <div className="mt-4 pt-4 border-t border-violet-50 dark:border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{property.tenant_name}</span>
                    </div>
                    {property.lease_end && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-zinc-400" />
                        <span className="text-[10px] text-zinc-500">Lease ends {new Date(property.lease_end).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
          <FileText size={20} className="text-violet-600 dark:text-violet-400" />
          Rent Payment History
        </h3>
        <div className="vintsy-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-violet-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Date</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Property</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Tenant</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Amount</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {owner.transactions?.map((tx) => (
                <tr key={tx.id} className="border-b border-violet-50 dark:border-zinc-800 hover:bg-violet-50/30 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 text-sm text-zinc-900 dark:text-white">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-zinc-900 dark:text-white font-medium">{tx.property_name}</td>
                  <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400">{tx.tenant_name}</td>
                  <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">${tx.amount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      tx.status === 'Paid' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!owner.transactions || owner.transactions.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No payment history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
