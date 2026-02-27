import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, Calendar, Search, Filter, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { Tenant } from '../types';

export const Tenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTenants().then(data => {
      setTenants(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Directory</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Resident Management</p>
        </div>
        <div className="flex gap-3">
          <button className="vintsy-button-secondary flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <Filter size={14} />
            Filter
          </button>
          <button className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest">
            Invite Tenant
          </button>
        </div>
      </div>

      <div className="vintsy-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-violet-50/20 dark:bg-zinc-800/20 border-b border-violet-100 dark:border-zinc-800">
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Resident</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Unit & Property</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Contact</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Lease Period</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Status</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-50 dark:divide-zinc-800">
              {tenants.map((tenant, index) => (
                <motion.tr
                  key={tenant.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-violet-50/30 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-700 dark:bg-violet-900/40 text-white dark:text-violet-400 flex items-center justify-center font-bold text-xs border border-violet-800 dark:border-violet-800 shadow-md">
                        {tenant.first_name[0]}{tenant.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{tenant.first_name} {tenant.last_name}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">#{tenant.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Unit {tenant.unit_number}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{tenant.property_name}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Mail size={12} className="text-zinc-300 dark:text-zinc-600" />
                        {tenant.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Phone size={12} className="text-zinc-300 dark:text-zinc-600" />
                        {tenant.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      <Calendar size={12} className="text-zinc-300 dark:text-zinc-600" />
                      <span>{new Date(tenant.lease_start).toLocaleDateString()} - {new Date(tenant.lease_end).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold rounded-lg uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                      Active
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-zinc-300 dark:text-zinc-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
