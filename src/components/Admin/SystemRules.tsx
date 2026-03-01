import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Lock, 
  Shield, 
  Clock, 
  Key, 
  Database, 
  UserCheck, 
  Users, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  Smartphone, 
  Globe, 
  Monitor,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { api } from '../../services/api';

export const SystemRules: React.FC = () => {
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getSystemRules();
        setRules(data);
      } catch (error) {
        console.error("Failed to load system rules", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-2 gap-8 h-96 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
  </div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Password Policy */}
        <div className="vintsy-card p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
              <Key size={16} className="text-violet-500" />
              Password Policy
            </h4>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Minimum Length</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Characters required</p>
              </div>
              <input 
                type="number" 
                defaultValue={rules?.password_policy?.min_length} 
                className="w-16 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Complexity Requirements</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Special chars, numbers, uppercase</p>
              </div>
              <select className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                <option>Low</option>
                <option selected>High</option>
                <option>Critical</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Rotation Period</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Days before forced reset</p>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  defaultValue={rules?.password_policy?.rotation_days} 
                  className="w-20 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* MFA Settings */}
        <div className="vintsy-card p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
              <Smartphone size={16} className="text-violet-500" />
              MFA Settings
            </h4>
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
              <CheckCircle2 size={12} />
              Active
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-violet-900 dark:text-violet-400 uppercase tracking-widest">Enforced Roles</p>
                <button className="text-[10px] font-bold text-violet-600 hover:underline">Edit List</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {rules?.mfa_settings?.enforced_roles?.map((role: string) => (
                  <span key={role} className="px-3 py-1 bg-white dark:bg-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800 shadow-sm">
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Optional Roles</p>
                <button className="text-[10px] font-bold text-zinc-500 hover:underline">Edit List</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {rules?.mfa_settings?.optional_roles?.map((role: string) => (
                  <span key={role} className="px-3 py-1 bg-white dark:bg-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Session Settings */}
        <div className="vintsy-card p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
              <Clock size={16} className="text-violet-500" />
              Session & Token Settings
            </h4>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Session Timeout</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Inactivity period</p>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  defaultValue={rules?.session_settings?.timeout_minutes} 
                  className="w-20 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Min</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Auto-Logout</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Force logout on timeout</p>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={rules?.session_settings?.auto_logout} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-violet-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Hierarchy */}
        <div className="vintsy-card p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
              <Shield size={16} className="text-violet-500" />
              Role Hierarchy Rules
            </h4>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="text-amber-600 mt-1" size={20} />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-400 uppercase tracking-widest mb-1">Restricted Combinations</p>
                <p className="text-xs text-amber-700 dark:text-amber-500 font-medium leading-relaxed">
                  Users cannot hold both 'Finance Team' and 'Property Management Staff' roles simultaneously to prevent conflict of interest.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Inherit Admin Permissions</span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={false} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-violet-600"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => {
            setSaving(true);
            setTimeout(() => setSaving(false), 1500);
          }}
          className="flex items-center gap-2 px-12 py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-600/30 active:scale-95"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving Changes...' : 'Save System Rules'}
        </button>
      </div>
    </div>
  );
};
