import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  const { data: roles } = await supabase.from('roles').select('*');
  console.log('Roles:', roles?.length);

  const { data: profiles, error } = await supabase.from('profiles').select('*');
  console.log('Profiles count:', profiles?.length);
  if (error) console.error('Profiles error:', error);
}

debug();
