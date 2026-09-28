import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn('Supabase: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être configurées.');
}

export const supabaseAdmin = createClient(
  url || 'https://placeholder.supabase.co',
  serviceKey || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
