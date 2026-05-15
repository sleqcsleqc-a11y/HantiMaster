import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
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
  MessageSquare,
  CheckSquare,
  Briefcase,
  ShieldAlert,
  Key,
  LogOut,
  CreditCard,
  FileText
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onProfileClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onProfileClick }) => {
  const { user, hasPermission, logout } = useAuth();
  
  const allMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', module: 'DASHBOARD' },
    { id: 'properties', icon: Building2, label: 'Properties', module: 'PROPERTY_MANAGEMENT' },
    { id: 'owners', icon: Briefcase, label: 'Owners', module: 'OWNER_MANAGEMENT' },
    { id: 'tenants', icon: Users, label: 'Tenants', module: 'TENANT_MANAGEMENT' },
    { id: 'maintenance', icon: Wrench, label: 'Maintenance', module: 'MAINTENANCE' },
    { id: 'finance', icon: CircleDollarSign, label: 'Finance', module: 'FINANCE' },
    { id: 'communication', icon: MessageSquare, label: 'Communication', module: 'COMMUNICATION' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks', module: 'TASKS' },
    { id: 'payments', icon: CreditCard, label: 'Payments', module: 'FINANCE' },
    { id: 'lease', icon: FileText, label: 'Lease & Docs', module: 'TENANT_MANAGEMENT' },
    { id: 'governance', icon: ShieldAlert, label: 'Admin Control', module: 'ADMIN_GOVERNANCE' },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (user?.role_name === 'System Administrator') return true;
    if (user?.role_name === 'HR Manager') {
      return ['dashboard', 'governance'].includes(item.id);
    }
    if (user?.role_name === 'Property Management Staff') {
      return !['finance', 'payments'].includes(item.id);
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
      return ['dashboard', 'payments', 'maintenance', 'lease', 'communication'].includes(item.id);
    }
    if (user?.role_name === 'Property Owner') {
      return ['dashboard', 'properties', 'finance', 'maintenance'].includes(item.id);
    }
    return true;
  });

  return (
    <div className="w-64 bg-white/90 backdrop-blur-md text-zinc-900 h-screen flex flex-col border-r border-violet-100 transition-colors duration-300">
      <div className="p-8 flex items-center gap-3">
        <div className="w-7 h-7 bg-gradient-to-br from-violet-700 to-violet-900 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20">
          <div className="w-3.5 h-3.5 bg-white rounded-[4px]" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">HantiMaster</h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-violet-600 text-white font-semibold shadow-lg shadow-violet-600/20' 
                : 'text-zinc-500 hover:text-violet-700 hover:bg-violet-50'
            }`}
          >
            <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-zinc-400 group-hover:text-violet-600'} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-violet-50 space-y-2">
        <button 
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 px-2 py-2 text-zinc-500 hover:bg-zinc-50 rounded-2xl transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url || null} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <>{user?.first_name?.[0]}{user?.last_name?.[0]}</>
            )}
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-xs font-bold text-zinc-900 truncate">{user?.first_name} {user?.last_name}</span>
            <span className="text-[10px] font-medium text-zinc-500 truncate">{user?.role_name}</span>
          </div>
          <ChevronRight size={14} className="ml-auto text-zinc-300 group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

interface HeaderProps {
  title: string;
  onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onProfileClick }) => {
  const { user } = useAuth();
  const [overdueCount, setOverdueCount] = React.useState(0);

  React.useEffect(() => {
    const checkOverdueTasks = async () => {
      try {
        const tasks = await api.getTasks();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = tasks.filter(t => {
          if (t.status === 'Completed') return false;
          const due = new Date(t.due_date);
          due.setHours(0, 0, 0, 0);
          
          // Check if overdue or due within next 2 days
          const diffTime = due.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          return diffDays <= 2; // Overdue (negative) or due in <= 2 days
        });
        setOverdueCount(upcoming.length);
      } catch (error) {
        console.error('Failed to check overdue tasks:', error);
      }
    };

    checkOverdueTasks();
    const interval = setInterval(checkOverdueTasks, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 border-b border-violet-100 bg-white/30 backdrop-blur-xl flex items-center justify-between px-8 transition-colors duration-300">
      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">{title}</h2>
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input 
            type="text" 
            placeholder="Search properties, tenants..." 
            className="pl-10 pr-4 py-2 bg-white/50 border border-violet-100 rounded-xl text-xs w-64 text-zinc-900 focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all placeholder:text-zinc-400"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2.5 text-zinc-500 hover:text-violet-600 transition-all bg-white border border-violet-100 rounded-xl shadow-sm hover:shadow-md active:scale-95 relative">
            <Bell size={18} />
            {(overdueCount > 0) && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 text-white text-[8px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {overdueCount}
              </span>
            )}
          </button>

          <button 
            onClick={onProfileClick}
            className="flex items-center gap-3 pl-6 border-l border-violet-50 group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">Account</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Profile Settings</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url || null} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserCircle size={20} />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
