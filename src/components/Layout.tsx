import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Wrench, 
  CircleDollarSign, 
  ChevronRight,
  Search,
  Bell,
  UserCircle,
  Sun,
  Moon,
  MessageSquare,
  CheckSquare,
  Briefcase,
  ShieldAlert,
  Key
} from 'lucide-react';
import { RequestPermissionModal } from './RequestPermissionModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, hasPermission } = useAuth();
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  
  const allMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', module: 'DASHBOARD' },
    { id: 'properties', icon: Building2, label: 'Properties', module: 'PROPERTY_MANAGEMENT' },
    { id: 'owners', icon: Briefcase, label: 'Owners', module: 'OWNER_MANAGEMENT' },
    { id: 'tenants', icon: Users, label: 'Tenants', module: 'TENANT_MANAGEMENT' },
    { id: 'maintenance', icon: Wrench, label: 'Maintenance', module: 'MAINTENANCE' },
    { id: 'finance', icon: CircleDollarSign, label: 'Finance', module: 'FINANCE' },
    { id: 'communication', icon: MessageSquare, label: 'Communication', module: 'COMMUNICATION' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks', module: 'TASKS' },
    { id: 'governance', icon: ShieldAlert, label: 'Admin Control', module: 'ADMIN_GOVERNANCE' },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (user?.role_name === 'System Administrator') return true;
    if (user?.role_name === 'HR Manager') {
      return ['dashboard', 'governance'].includes(item.id);
    }
    if (user?.role_name === 'Property Management Staff') {
      return !['finance'].includes(item.id);
    }
    if (user?.role_name === 'Finance Team') {
      return ['dashboard', 'finance', 'properties', 'owners'].includes(item.id);
    }
    if (user?.role_name === 'Maintenance Coordinator') {
      return ['dashboard', 'maintenance', 'tasks', 'properties'].includes(item.id);
    }
    if (user?.role_name === 'Repair Team') {
      return ['dashboard', 'tasks', 'maintenance'].includes(item.id);
    }
    if (user?.role_name === 'Tenant') {
      return ['dashboard', 'communication', 'maintenance'].includes(item.id);
    }
    if (user?.role_name === 'Property Owner') {
      return ['dashboard', 'properties', 'finance', 'maintenance'].includes(item.id);
    }
    return true;
  });

  return (
    <div className="w-64 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-900 dark:text-zinc-100 h-screen flex flex-col border-r border-violet-100 dark:border-zinc-800 transition-colors duration-300">
      <div className="p-8 flex items-center gap-3">
        <div className="w-7 h-7 bg-gradient-to-br from-violet-700 to-violet-900 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20">
          <div className="w-3.5 h-3.5 bg-white rounded-[4px]" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">HantiMaster</h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-violet-600 text-white font-semibold shadow-lg shadow-violet-600/20' 
                : 'text-zinc-500 hover:text-violet-700 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-zinc-800'
            }`}
          >
            <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-zinc-400 group-hover:text-violet-600'} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-violet-700 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-zinc-800 transition-all duration-300 group mt-4 border border-dashed border-zinc-200 dark:border-zinc-800"
        >
          <Key size={18} className="text-zinc-400 group-hover:text-violet-600" />
          <span className="text-sm">Request Access</span>
        </button>
      </nav>

      <RequestPermissionModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} />

      <div className="p-6 border-t border-violet-50 dark:border-zinc-800">
        <div className="flex items-center gap-3 px-2 py-2 text-zinc-500 dark:text-zinc-400">
          <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-zinc-800 border border-violet-100 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold text-violet-600">
            {user?.first_name[0]}{user?.last_name[0]}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">{user?.first_name} {user?.last_name}</span>
            <span className="text-[10px] font-medium text-zinc-500">{user?.role_name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HeaderProps {
  title: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, isDarkMode, toggleDarkMode }) => {
  return (
    <header className="h-20 border-b border-violet-100 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30 backdrop-blur-xl flex items-center justify-between px-8 transition-colors duration-300">
      <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{title}</h2>
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input 
            type="text" 
            placeholder="Search properties, tenants..." 
            className="pl-10 pr-4 py-2 bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl text-xs w-64 text-zinc-900 dark:text-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all bg-white dark:bg-zinc-800 border border-violet-100 dark:border-zinc-700 rounded-xl shadow-sm hover:shadow-md active:scale-95"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="p-2.5 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all bg-white dark:bg-zinc-800 border border-violet-100 dark:border-zinc-700 rounded-xl shadow-sm hover:shadow-md active:scale-95 relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-violet-600 rounded-full border-2 border-white dark:border-zinc-800" />
          </button>
        </div>
      </div>
    </header>
  );
};
