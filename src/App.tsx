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
import { TenantDashboard } from './components/Tenant/TenantDashboard';
import { TenantPayments } from './components/Tenant/TenantPayments';
import { TenantMaintenance } from './components/Tenant/TenantMaintenance';
import { TenantLease } from './components/Tenant/TenantLease';
import { DocumentManagement } from './components/DocumentManagement';
import { Vendors } from './components/Vendors';
import { Applications } from './components/Applications';
import { VendorDashboard } from './components/Vendor/VendorDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Building2, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isSupabaseConfigured } from './lib/supabase';

const AppContent: React.FC = () => {
  const { user, loading, login, signup, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isSupabaseConfigured) {
    const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    const likelyStripe = rawKey.startsWith('sb_') || rawKey.startsWith('pk_');

    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-[2.5rem] p-12 shadow-2xl border border-zinc-200"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600 mb-8">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-4xl font-bold text-zinc-900 tracking-tight mb-4">Configuration Required</h1>
            <p className="text-zinc-500 max-w-md leading-relaxed">
              {likelyStripe 
                ? "It looks like you've provided Stripe keys instead of Supabase keys. Please update your environment variables with the correct 'anon public' key from Supabase."
                : "HantiMaster requires a Supabase connection to store your property data. Please set up your environment variables to continue."}
            </p>
          </div>

          <div className="space-y-8">
            <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Setup Instructions</h3>
              <ol className="space-y-6">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-zinc-900">Get your Supabase Credentials</p>
                    <p className="text-xs text-zinc-500">Go to your Supabase Dashboard &gt; Project Settings &gt; API.</p>
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:underline"
                    >
                      Open Dashboard <ExternalLink size={12} />
                    </a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-zinc-900">Add Environment Variables</p>
                    <p className="text-xs text-zinc-500">Add these keys to your platform's Environment Variables section:</p>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200">
                        <code className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">VITE_SUPABASE_URL</code>
                        <button className="text-zinc-400 hover:text-violet-600 transition-colors"><Copy size={14} /></button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200">
                        <code className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">VITE_SUPABASE_ANON_KEY</code>
                        <button className="text-zinc-400 hover:text-violet-600 transition-colors"><Copy size={14} /></button>
                      </div>
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
              >
                I've added the keys, reload app
              </button>
              <p className="text-[10px] text-zinc-400 font-medium italic">
                The app will automatically refresh once the variables are detected.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isForgotPassword) {
        await resetPassword(loginForm.email);
        setResetSent(true);
        setLoginError('');
      } else if (isSignUp) {
        await signup(loginForm);
        setLoginError('Account created! You can now sign in.');
        setIsSignUp(false);
      } else {
        await login(loginForm);
        setLoginError('');
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        const isStripeKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').startsWith('sb_');
        if (isStripeKey) {
          setLoginError('Format error: You have provided Stripe keys instead of Supabase keys. Please use the "anon public" key from your Supabase dashboard.');
        } else {
          setLoginError('Network error: Please verify your Supabase URL in the .env file. Ensure it starts with https://');
        }
      } else {
        setLoginError(err.message || 'Invalid email or password');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl border border-zinc-200"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-violet-600/20">
              <Building2 size={32} />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">HantiMaster</h1>
            <p className="text-zinc-500 mt-2 text-sm uppercase tracking-widest font-bold">
              {isForgotPassword ? 'Reset Password' : 'Premium Management'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {resetSent ? (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-[10px] font-bold uppercase tracking-widest text-center">
                Success! Check your email for reset instructions.
              </div>
            ) : loginError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-widest text-center">
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
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm font-medium"
                placeholder="Enter your email"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm font-medium"
                  placeholder="••••••••"
                />
                <div className="text-right mt-2">
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[10px] font-bold text-violet-600 hover:underline uppercase tracking-wider"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40">
              {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In to Dashboard'}
            </button>

            <div className="text-center mt-4 space-y-2">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetSent(false);
                  }}
                  className="text-xs text-violet-600 hover:underline font-medium"
                >
                  Back to Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setLoginError('');
                  }}
                  className="text-xs text-violet-600 hover:underline font-medium"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    if (user?.role_name === 'Tenant') {
      switch (activeTab) {
        case 'dashboard': return <TenantDashboard setActiveTab={setActiveTab} />;
        case 'payments': return <TenantPayments />;
        case 'maintenance': return <TenantMaintenance />;
        case 'lease': return <TenantLease />;
        case 'communication': return <Communication />;
        default: return <TenantDashboard setActiveTab={setActiveTab} />;
      }
    }

    if (user?.role_name === 'Vendor') {
      switch (activeTab) {
        case 'dashboard': return <VendorDashboard setActiveTab={setActiveTab} />;
        case 'maintenance': return <Maintenance />;
        case 'communication': return <Communication />;
        case 'tasks': return <Tasks />;
        default: return <VendorDashboard setActiveTab={setActiveTab} />;
      }
    }

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
        return (
          <Dashboard 
            onSelectProperty={(id) => setSelectedPropertyId(id)} 
            onSelectOwner={(id) => setSelectedOwnerId(id)}
            setActiveTab={handleTabChange}
          />
        );
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
      case 'vendors':
        return <Vendors />;
      case 'applications':
        return <Applications />;
      case 'lease':
        return <DocumentManagement />;
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
      case 'dashboard': return user?.role_name === 'Tenant' ? 'Tenant Portal' : 'Overview';
      case 'properties': return 'Property Portfolio';
      case 'owners': return 'Owner Directory';
      case 'tenants': return 'Tenant Directory';
      case 'maintenance': return 'Maintenance & Service';
      case 'finance': return 'Financial Management';
      case 'payments': return 'Rent & Payments';
      case 'lease': return 'Lease & Documents';
      case 'communication': return 'Communication';
      case 'tasks': return 'Task Management';
      case 'vendors': return 'Vendor Network';
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
    <div className="flex h-screen vintsy-main-gradient font-sans text-zinc-900 selection:bg-violet-100 selection:text-violet-900 transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onProfileClick={() => setIsProfilePanelOpen(true)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getTitle()} 
          onProfileClick={() => setIsProfilePanelOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <UserProfilePanel isOpen={isProfilePanelOpen} onClose={() => setIsProfilePanelOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
