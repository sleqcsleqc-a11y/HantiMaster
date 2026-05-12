import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function seed() {
  console.log('Attempting to seed roles...');
  const { data, error } = await supabase.from('roles').insert([
    { name: 'System Administrator', description: 'Full administrative control', is_locked: true },
    { name: 'Tenant', description: 'Access to personal lease', is_locked: false }
  ]);

  if (error) {
    console.error('Seed error:', error);
  } else {
    console.log('Seed success:', data);
  }
}

seed();
