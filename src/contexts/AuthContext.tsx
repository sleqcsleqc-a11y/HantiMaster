import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PermissionOverride } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  overrides: PermissionOverride[];
  hierarchyRules: any[];
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  signup: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  requestPermission: (req: Partial<PermissionRequest>) => Promise<void>;
  logActivity: (action: string, entityType: string, entityId: string | number, details?: string) => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  impersonate: (userId: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [hierarchyRules, setHierarchyRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, email?: string, metadata?: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          roles (id, name)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log("Profile missing, attempting to create...");
          // Self-healing: Try to create the profile if it's missing
          // This handles cases where the trigger might have failed or user existed before trigger
          const { data: roles } = await supabase.from('roles').select('id').eq('name', 'System Administrator').single();
          const { data: tenantRole } = await supabase.from('roles').select('id').eq('name', 'Tenant').single();
          
          // Update: If email is admin@hantimaster.com, always promote to System Admin
          const isHardcodedAdmin = email === 'admin@hantimaster.com';
          
          // Check if any profiles exist to determine if this is the first user
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const isFirstUser = count === 0;

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email,
              first_name: metadata?.first_name || (isHardcodedAdmin ? 'System' : ''),
              last_name: metadata?.last_name || (isHardcodedAdmin ? 'Admin' : ''),
              role_id: (isHardcodedAdmin || isFirstUser) ? roles?.id : tenantRole?.id,
              status: 'Active'
            })
            .select(`*, roles(name)`)
            .single();

          if (insertError) {
            console.error("Failed to self-heal profile:", insertError);
            return;
          }
          
          if (newProfile) {
            const mappedUser: User = {
              id: newProfile.id,
              role_id: newProfile.role_id,
              first_name: newProfile.first_name,
              last_name: newProfile.last_name,
              email: newProfile.email,
              role_name: newProfile.roles?.name,
              property_scope: newProfile.property_scope,
              tenant_id: newProfile.tenant_id,
              owner_id: newProfile.owner_id,
              status: newProfile.status,
              last_login: newProfile.last_login,
              mfa_enabled: newProfile.mfa_enabled
            };
            setUser(mappedUser);
          }
          return;
        }
        throw error;
      }

      if (profile) {
        // Emergency promotion for admin@hantimaster.com if they are currently a Tenant
        if (profile.email === 'admin@hantimaster.com' && profile.roles?.name !== 'System Administrator') {
          console.log("Promoting hardcoded admin user...");
          const { data: adminRole } = await supabase.from('roles').select('id').eq('name', 'System Administrator').single();
          if (adminRole) {
            await supabase.from('profiles').update({ role_id: adminRole.id }).eq('id', userId);
            // Re-fetch to get updated role_name
            return fetchUserProfile(userId, email, metadata);
          }
        }

        // Map Supabase profile to User type
        const mappedUser: User = {
          id: profile.id,
          role_id: profile.role_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          role_name: profile.roles?.name,
          property_scope: profile.property_scope,
          tenant_id: profile.tenant_id,
          owner_id: profile.owner_id,
          status: profile.status,
          last_login: profile.last_login,
          mfa_enabled: profile.mfa_enabled
        };
        setUser(mappedUser);

        // Fetch overrides and hierarchy rules
        const [{ data: userOverrides }, { data: rules }] = await Promise.all([
          supabase.from('permission_overrides').select('*').eq('user_id', userId),
          supabase.from('role_hierarchy').select(`*, role_a:role_a_id(id, name), role_b:role_b_id(id, name)`)
        ]);
          
        setOverrides(userOverrides || []);
        setHierarchyRules(rules || []);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session fetch error:", error);
        if (error.message.includes('Refresh Token Not Found')) {
          supabase.auth.signOut();
        }
        setLoading(false);
        return;
      }
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error("Critical session failure:", err);
      if (err?.message?.includes('Refresh Token Not Found')) {
        supabase.auth.signOut();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESH_REFECH_ERROR' || event === 'SIGNED_OUT') {
        setUser(null);
        setOverrides([]);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setUser(null);
        setOverrides([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: any) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) throw error;
  };

  const signup = async (credentials: any) => {
    const { error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOverrides([]);
  };

  const requestPermission = async (req: Partial<PermissionRequest>) => {
    if (!user) return;
    const { error } = await supabase.from('permission_requests').insert({
      user_id: user.id,
      module: req.module,
      action: req.action,
      justification: req.justification,
      status: 'Pending'
    });
    if (error) throw error;
    await logActivity('Request Permission', 'PermissionRequest', 0, `Requested ${req.action} on ${req.module}`);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const logActivity = async (action: string, entityType: string, entityId: string | number, details?: string) => {
    if (!user) return;
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: typeof entityId === 'number' ? entityId : 0,
        details: details || '',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Failed to log audit activity:", e);
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  };

  // Impersonation is tricky with Supabase Auth (usually requires admin function)
  // For now, we'll disable it or implement a mock if needed for dev
  const impersonate = async (userId: number) => {
    console.warn("Impersonation not fully supported in client-side Supabase Auth without admin functions.");
  };

  const hasPermission = (module: string, action: string) => {
    if (!user) return false;
    if (user.status === 'Suspended' || user.status === 'Terminated') return false;
    
    // Check overrides first
    const override = overrides.find(o => o.module === module && o.action === action);
    if (override) {
      return override.override_type === 'Grant';
    }

    // Role inheritance check
    const checkRolePermission = (roleName: string): boolean => {
      // Direct roles
      if (roleName === 'System Administrator') return true;

      if (module === 'ADMIN_GOVERNANCE') {
        return roleName === 'HR Manager';
      }

      if (module === 'USER_MANAGEMENT') {
        if (action === 'delete' || action === 'assign_admin') return false; 
        return roleName === 'HR Manager';
      }

      if (module === 'PERMISSION_MANAGEMENT') {
        return false;
      }
      
      if (module === 'PROPERTY_MANAGEMENT') {
        return ['Property Manager', 'Leasing Agent', 'Property Owner'].includes(roleName);
      }

      if (module === 'FINANCE') {
        return ['Accountant', 'Property Owner'].includes(roleName);
      }

      if (module === 'MAINTENANCE') {
        return true;
      }

      return false;
    };

    // Recursive inheritance check
    const isInheritedAdmin = (currentRole: string): boolean => {
      if (currentRole === 'System Administrator') return true;
      
      const parentRules = hierarchyRules.filter(r => r.type === 'Inheritance' && r.role_a.name === currentRole);
      for (const rule of parentRules) {
        if (isInheritedAdmin(rule.role_b.name)) return true;
      }
      return false;
    };

    // If I inherit from Admin, I am an admin
    if (isInheritedAdmin(user.role_name || '')) return true;

    // Check base permission
    if (checkRolePermission(user.role_name || '')) return true;

    // Check inherited permissions
    const getEffectiveRoles = (role: string): string[] => {
      const roles = [role];
      const inheritance = hierarchyRules
        .filter(r => r.type === 'Inheritance' && r.role_a.name === role)
        .map(r => r.role_b.name);
      
      inheritance.forEach(ir => {
        roles.push(...getEffectiveRoles(ir));
      });
      return roles;
    };

    const effectiveRoles = getEffectiveRoles(user.role_name || '');
    return effectiveRoles.some(r => checkRolePermission(r));
  };

  return (
    <AuthContext.Provider value={{ user, overrides, hierarchyRules, loading, login, signup, logout, resetPassword, requestPermission, logActivity, hasPermission, impersonate, refreshUser }}>
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
