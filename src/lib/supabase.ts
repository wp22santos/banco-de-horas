import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Debug logs
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Garantindo que a URL está formatada corretamente
const formattedSupabaseUrl = supabaseUrl.trim();
if (!formattedSupabaseUrl.startsWith('https://')) {
  throw new Error('Supabase URL must start with https://');
}

export const supabase = createClient(formattedSupabaseUrl, supabaseKey);
