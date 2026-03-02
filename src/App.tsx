import React, { useState, useEffect } from 'react';
import { Sidebar, Header } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Properties } from './components/Properties';
import { Tenants } from './components/Tenants';
import { Maintenance } from './components/Maintenance';
import { Finance } from './components/Finance';
import { PropertyDetails } from './components/PropertyDetails';
import { Communication } from './components/Communication';
import { Tasks } from './components/Tasks';
import { AdminControlCenter } from './components/Admin/AdminControlCenter';
import { Owners } from './components/Owners';
import { OwnerDetails } from './components/OwnerDetails';
import { UserProfilePanel } from './components/UserProfilePanel';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleSwitcher } from './components/RoleSwitcher';
import { Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { user, loading, login } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm);
      setLoginError('');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-10 shadow-2xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-violet-600/20">
              <Building2 size={32} />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">HantiMaster</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm uppercase tracking-widest font-bold">Premium Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                className="vintsy-input w-full"
                placeholder="admin@hantimaster.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                required
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                className="vintsy-input w-full"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full vintsy-button-primary py-4 text-xs uppercase tracking-widest font-bold">
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-violet-600 dark:text-violet-400">Admin</p>
                <p className="mt-1">admin@hantimaster.com</p>
                <p>admin123</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-violet-600 dark:text-violet-400">Staff</p>
                <p className="mt-1">sarah@hantimaster.com</p>
                <p>staff123</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'owners' && selectedOwnerId !== null) {
      return (
        <OwnerDetails 
          ownerId={selectedOwnerId} 
          onBack={() => setSelectedOwnerId(null)} 
          onSelectProperty={(id) => {
            setActiveTab('properties');
            setSelectedPropertyId(id);
            setSelectedOwnerId(null);
          }}
        />
      );
    }

    if (activeTab === 'properties' && selectedPropertyId !== null) {
      return (
        <PropertyDetails 
          propertyId={selectedPropertyId} 
          onBack={() => setSelectedPropertyId(null)} 
          onSelectOwner={(id) => {
            setActiveTab('owners');
            setSelectedOwnerId(id);
            setSelectedPropertyId(null);
          }}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'properties':
        return <Properties onSelectProperty={(id) => setSelectedPropertyId(id)} />;
      case 'owners':
        return <Owners onSelectOwner={(id) => setSelectedOwnerId(id)} />;
      case 'tenants':
        return <Tenants />;
      case 'maintenance':
        return <Maintenance />;
      case 'finance':
        return <Finance />;
      case 'communication':
        return <Communication />;
      case 'tasks':
        return <Tasks />;
      default:
        return <Dashboard />;
    }
  };

  const getTitle = () => {
    if (activeTab === 'owners' && selectedOwnerId !== null) {
      return 'Owner Details';
    }
    if (activeTab === 'properties' && selectedPropertyId !== null) {
      return 'Property Details';
    }
    switch (activeTab) {
      case 'dashboard': return 'Overview';
      case 'properties': return 'Property Portfolio';
      case 'owners': return 'Owner Directory';
      case 'tenants': return 'Tenant Directory';
      case 'maintenance': return 'Maintenance & Service';
      case 'finance': return 'Financial Management';
      case 'communication': return 'Tenant Portal';
      case 'tasks': return 'Task Management';
      case 'governance': return 'Admin Control Center';
      default: return 'Dashboard';
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedPropertyId(null);
    setSelectedOwnerId(null);
  };

  if (activeTab === 'governance') {
    return <AdminControlCenter onExit={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="flex h-screen vintsy-main-gradient font-sans text-zinc-900 dark:text-zinc-100 selection:bg-violet-100 selection:text-violet-900 transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onProfileClick={() => setIsProfilePanelOpen(true)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getTitle()} 
          isDarkMode={isDarkMode} 
          toggleDarkMode={toggleDarkMode} 
          onProfileClick={() => setIsProfilePanelOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <RoleSwitcher />
      <UserProfilePanel isOpen={isProfilePanelOpen} onClose={() => setIsProfilePanelOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
