import { createClient } from '@supabase/supabase-js';

// Stub for Supabase client
export const createSupabaseClient = (supabaseUrl: string, supabaseAnonKey: string) => {
  return createClient(supabaseUrl, supabaseAnonKey);
};
