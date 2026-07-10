import { createClient } from '@supabase/supabase-js';

// Admin client that uses the SERVICE_ROLE_KEY to bypass Row Level Security (RLS).
// This should ONLY be used in secure Server Components or API routes where
// the caller's authorization has already been strictly validated.
export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase URL or Service Role Key in environment variables.');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      }
    }
  );
}
