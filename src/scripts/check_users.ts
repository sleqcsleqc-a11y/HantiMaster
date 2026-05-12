import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*, roles(name)');
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('Profiles:');
  profiles.forEach(p => {
    console.log(`- ${p.email}: ${p.roles?.name} (${p.role_id})`);
  });
}

checkUsers();
