import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, PermissionOverride } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  overrides: PermissionOverride[];
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  impersonate: (userId: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: number) => {
    try {
      const [userData, userOverrides] = await Promise.all([
        api.getCurrentUser(userId),
        api.getUserOverrides(userId)
      ]);
      
      if (userData.status === 'Suspended' || userData.status === 'Terminated') {
        logout();
        return;
      }
      
      setUser(userData);
      setOverrides(userOverrides);
      localStorage.setItem('hantimaster_user_id', userData.id.toString());
    } catch (error) {
      console.error("Failed to fetch user data", error);
      logout();
    }
  };

  useEffect(() => {
    const savedUserId = localStorage.getItem('hantimaster_user_id');
    if (savedUserId) {
      fetchUserData(parseInt(savedUserId)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: any) => {
    const userData = await api.login(credentials);
    if (userData.status === 'Suspended' || userData.status === 'Terminated') {
      throw new Error('Your account has been suspended or terminated.');
    }
    await fetchUserData(userData.id);
  };

  const impersonate = async (userId: number) => {
    await fetchUserData(userId);
  };

  const logout = () => {
    setUser(null);
    setOverrides([]);
    localStorage.removeItem('hantimaster_user_id');
  };

  const refreshUser = async () => {
    if (user) await fetchUserData(user.id);
  };

  const hasPermission = (module: string, action: string) => {
    if (!user) return false;
    if (user.status === 'Suspended' || user.status === 'Terminated') return false;
    
    // Check overrides first (Principle of Least Privilege / Explicit Grant)
    const override = overrides.find(o => o.module === module && o.action === action);
    if (override) {
      return override.override_type === 'Grant';
    }

    if (user.role_name === 'System Administrator') return true;
    
    const role = user.role_name;
    
    // Governance & Admin
    if (module === 'ADMIN_GOVERNANCE') {
      return role === 'System Administrator' || role === 'HR Manager';
    }

    if (module === 'USER_MANAGEMENT') {
      if (action === 'delete' || action === 'assign_admin') return role === 'System Administrator';
      return ['System Administrator', 'HR Manager'].includes(role || '');
    }

    if (module === 'PERMISSION_MANAGEMENT') {
      return role === 'System Administrator';
    }
    
    if (module === 'PROPERTY_MANAGEMENT') {
      if (action === 'delete') return role === 'System Administrator';
      return ['System Administrator', 'Property Management Staff', 'Property Owner'].includes(role || '');
    }

    if (module === 'FINANCE') {
      return ['System Administrator', 'Finance Team', 'Property Owner'].includes(role || '');
    }

    if (module === 'MAINTENANCE') {
      if (action === 'assign' || action === 'close') {
        return ['System Administrator', 'Maintenance Coordinator'].includes(role || '');
      }
      return true;
    }

    return true;
  };

  return (
    <AuthContext.Provider value={{ user, overrides, loading, login, logout, hasPermission, impersonate, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
