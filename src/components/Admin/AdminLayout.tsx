import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  Key, 
  FileText, 
  AlertTriangle, 
  Settings, 
  Activity,
  ChevronLeft,
  LogOut,
  Bell,
  User,
  ShieldAlert,
  Lock,
  LayoutDashboard,
  UserCheck,
  UserX,
  History,
  Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeModule: string;
  onModuleChange: (module: string) => void;
  onExit: () => void;
  onProfileClick: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeModule, onModuleChange, onExit, onProfileClick }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = useMemo(() => {
    const isSystemAdmin = user?.role_name === 'System Administrator';
    
    const sections = [
      { section: 'Overview', items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
      ]},
      { section: 'User Governance', items: [
        { id: 'users', label: 'All Users', icon: Users },
        ...(isSystemAdmin ? [
          { id: 'roles', label: 'Role Management', icon: Shield },
          { id: 'matrix', label: 'Permission Matrix', icon: Database },
        ] : []),
      ]},
      { section: 'Requests', items: [
        { id: 'requests', label: 'Permission Requests', icon: Key },
      ]},
    ];

    if (isSystemAdmin) {
      sections.push(
        { section: 'Security', items: [
          { id: 'alerts', label: 'Security Alerts', icon: ShieldAlert },
          { id: 'audit', label: 'Audit Logs', icon: History },
        ]},
        { section: 'System Rules', items: [
          { id: 'rules', label: 'System Rules', icon: Settings },
        ]}
      );
    }

    return sections;
  }, [user?.role_name]);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-zinc-200 flex flex-col sticky top-0 h-screen z-50"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
                  <Shield size={18} />
                </div>
                <span className="font-bold text-zinc-900 tracking-tight">Admin Center</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 transition-colors"
          >
            <ChevronLeft size={18} className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
          {menuItems.map((section, idx) => (
            <div key={idx} className="space-y-2">
              {isSidebarOpen && (
                <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onModuleChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                      activeModule === item.id 
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <item.icon size={20} className={activeModule === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                    {isSidebarOpen && <span className="text-sm font-bold">{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <button 
            onClick={onExit}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-500 hover:bg-zinc-100 transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="text-sm font-bold">Exit Admin</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight capitalize">
              {activeModule.replace('-', ' ')}
            </h2>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <Activity size={12} className="text-emerald-500" />
              System Healthy
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button 
              onClick={onProfileClick}
              className="flex items-center gap-3 pl-6 border-l border-zinc-200 hover:bg-zinc-50 p-2 rounded-2xl transition-all group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{user?.role_name}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 group-hover:bg-violet-600 group-hover:text-white transition-all">
                <User size={20} />
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="h-12 bg-white border-t border-zinc-200 px-8 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span>System Status: <span className="text-emerald-500">Operational</span></span>
            <span className="h-3 w-px bg-zinc-200" />
            <span>Version: 2.4.0-governance</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-violet-500" />
            Security Indicator: <span className="text-zinc-900">High</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
