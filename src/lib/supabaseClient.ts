import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://stjgxjjmfeuyrfddrfeb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zb5HZhR_SWRu9TA0mBBsPw_gQatFfrI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
