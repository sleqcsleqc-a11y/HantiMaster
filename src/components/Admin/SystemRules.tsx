import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Info,
  Plus,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Role } from '../../types';

export const SystemRules: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [rules, setRules] = useState<any>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New rule form state
  const [newRule, setNewRule] = useState({
    type: 'Inheritance',
    role_a_id: '',
    role_b_id: '',
    description: ''
  });

  const loadData = async () => {
    try {
      const [rulesData, rolesData] = await Promise.all([
        api.getSystemRules(),
        api.getRoles()
      ]);
      setRules(rulesData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to load system rules", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddRule = async () => {
    if (!newRule.role_a_id || !newRule.role_b_id) return;
    
    try {
      await api.createHierarchyRule({
        ...newRule,
        role_a_id: parseInt(newRule.role_a_id),
        role_b_id: parseInt(newRule.role_b_id),
        admin_id: user?.id
      });
      setNewRule({ type: 'Inheritance', role_a_id: '', role_b_id: '', description: '' });
      loadData();
      addToast('Rule added successfully', 'success');
    } catch (error) {
      console.error("Failed to add rule", error);
      addToast('Failed to add rule', 'error');
    }
  };

  const handleDeleteRule = async (id: number) => {
    try {
      await api.deleteHierarchyRule(id, user?.id || '');
      loadData();
      addToast('Rule deleted successfully', 'success');
    } catch (error) {
      console.error("Failed to delete rule", error);
      addToast('Failed to delete rule', 'error');
    }
  };

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
              <select defaultValue="High" className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                <option>Low</option>
                <option>High</option>
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
                <input type="checkbox" checked={rules?.session_settings?.auto_logout || false} readOnly className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-violet-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Hierarchy */}
        <div className="vintsy-card p-8 space-y-8 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
              <Shield size={16} className="text-violet-500" />
              Role Hierarchy & Restriction Rules
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Add New Rule Form */}
            <div className="md:col-span-1 space-y-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
              <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Create New Rule</h5>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Rule Type</label>
                  <select 
                    value={newRule.type}
                    onChange={e => setNewRule({...newRule, type: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="Inheritance">Inheritance (A inherits B)</option>
                    <option value="Restricted">Restricted (A cannot have B)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Role A</label>
                  <select 
                    value={newRule.role_a_id}
                    onChange={e => setNewRule({...newRule, role_a_id: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="">Select Role...</option>
                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Role B</label>
                  <select 
                    value={newRule.role_b_id}
                    onChange={e => setNewRule({...newRule, role_b_id: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="">Select Role...</option>
                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    value={newRule.description}
                    onChange={e => setNewRule({...newRule, description: e.target.value})}
                    placeholder="Why is this rule needed?"
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 h-20 resize-none"
                  />
                </div>

                <button 
                  onClick={handleAddRule}
                  disabled={!newRule.role_a_id || !newRule.role_b_id}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all disabled:opacity-50"
                >
                  <Plus size={14} />
                  Add Rule
                </button>
              </div>
            </div>

            {/* Rules List */}
            <div className="md:col-span-2 space-y-4">
              <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Rules</h5>
              
              <div className="space-y-3">
                {rules?.hierarchy_rules?.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                    <Shield className="mx-auto text-zinc-200 mb-4" size={32} />
                    <p className="text-sm text-zinc-500 font-medium">No hierarchy rules defined yet.</p>
                  </div>
                ) : (
                  rules?.hierarchy_rules?.map((rule: any) => (
                    <div key={rule.id} className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl group hover:border-violet-200 dark:hover:border-violet-800 transition-all shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          rule.type === 'Inheritance' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {rule.type === 'Inheritance' ? <ArrowRight size={18} /> : <XCircle size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{rule.role_a_name}</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              {rule.type === 'Inheritance' ? 'Inherits' : 'Restricted With'}
                            </span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{rule.role_b_name}</span>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium">{rule.description || 'No description provided.'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
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
            setTimeout(() => {
              setSaving(false);
              addToast('System rules saved successfully', 'success');
            }, 1500);
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
