import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Detect if keys look like Stripe keys instead of Supabase keys
const isStripeKey = (key: string) => key.startsWith('sb_') || key.startsWith('pk_') || key.startsWith('sk_');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
} else if (isStripeKey(supabaseAnonKey)) {
  console.warn('The VITE_SUPABASE_ANON_KEY appears to be a Stripe key (starts with ' + supabaseAnonKey.split('_')[0] + '). Supabase keys usually start with "eyJ". Please check your Supabase Dashboard > Project Settings > API.');
}

// Provide fallback strings to prevent createClient from throwing immediately, 
// though actual requests will still fail until valid keys are provided.
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !isStripeKey(supabaseAnonKey)
);

export const supabase = isSupabaseConfigured ? createClient(
  supabaseUrl, 
  supabaseAnonKey
) : {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
    signOut: async () => ({ error: null })
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error('Supabase not configured') }) }) })
  }),
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      upload: async () => ({ data: null, error: new Error('Supabase not configured') })
    })
  }
} as any;
