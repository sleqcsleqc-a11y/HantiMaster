import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PermissionOverride } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  overrides: PermissionOverride[];
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  signup: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  impersonate: (userId: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, email?: string, metadata?: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          roles (name)
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
          
          // Check if any profiles exist to determine if this is the first user
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const isFirstUser = count === 0;

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email,
              first_name: metadata?.first_name || '',
              last_name: metadata?.last_name || '',
              role_id: isFirstUser ? roles?.id : tenantRole?.id,
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

        // Fetch overrides
        const { data: userOverrides } = await supabase
          .from('permission_overrides')
          .select('*')
          .eq('user_id', userId);
          
        setOverrides(userOverrides || []);
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
        console.error("Session error:", error);
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error("Failed to get session:", err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

    if (user.role_name === 'System Administrator') return true;
    
    // Fallback to role-based checks (same logic as before, or fetch from DB)
    // Ideally, we should fetch role_permissions from DB, but keeping hardcoded logic for now to match previous behavior
    // or we can fetch it in fetchUserProfile
    
    const role = user.role_name;
    
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
      return ['System Administrator', 'Property Manager', 'Leasing Agent', 'Property Owner'].includes(role || '');
    }

    if (module === 'FINANCE') {
      return ['System Administrator', 'Accountant', 'Property Owner'].includes(role || '');
    }

    if (module === 'MAINTENANCE') {
      if (action === 'assign' || action === 'close') {
        return ['System Administrator', 'Maintenance Supervisor'].includes(role || '');
      }
      return true;
    }

    return true;
  };

  return (
    <AuthContext.Provider value={{ user, overrides, loading, login, signup, logout, hasPermission, impersonate, refreshUser }}>
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
