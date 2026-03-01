import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  History, 
  Search, 
  Filter, 
  Download, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Globe, 
  Monitor, 
  Lock, 
  Unlock,
  ChevronRight,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';

export const SecurityAudit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'audit'>('alerts');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsData, auditData] = await Promise.all([
        api.getSecurityAlerts(),
        api.getAuditLogs()
      ]);
      setAlerts(alertsData);
      setAuditLogs(auditData);
    } catch (error) {
      console.error("Failed to load security data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.user_name && log.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tabs & Controls */}
      <div className="vintsy-card p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 w-full md:w-auto">
          {[
            { id: 'alerts', label: 'Security Alerts', icon: ShieldAlert },
            { id: 'audit', label: 'Audit Logs', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 md:flex-none flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-400 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'alerts' ? (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {alerts.map(alert => (
              <div key={alert.id} className="vintsy-card p-6 flex items-center gap-6 group hover:border-red-200 dark:hover:border-red-800 transition-all">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform ${
                  alert.risk === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                  alert.risk === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                  'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">{alert.type}</h4>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                      alert.risk === 'Critical' ? 'bg-red-600 text-white border-red-600' :
                      alert.risk === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {alert.risk} Risk
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">{alert.description}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><User size={12} /> {alert.user}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(alert.timestamp).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Globe size={12} /> IP: 192.168.1.45</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                    Ignore
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg">
                    Investigate
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="vintsy-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">User</th>
                    <th className="px-8 py-5">Action</th>
                    <th className="px-8 py-5">Module</th>
                    <th className="px-8 py-5">IP Address</th>
                    <th className="px-8 py-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-8 py-5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <User size={12} />
                          </div>
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">{log.user_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{log.action}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          {log.entity_type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          <Globe size={12} />
                          192.168.1.1
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 text-zinc-400 hover:text-violet-600 transition-colors">
                          <ExternalLink size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
