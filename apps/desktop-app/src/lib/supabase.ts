import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Store the student JWT locally
let currentToken = '';

export const setStudentToken = (token: string) => {
  currentToken = token;
};

// Create a custom fetch that injects the JWT into the Authorization header
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  if (currentToken) {
    options = options || {};
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${currentToken}`);
    options.headers = headers;
  }
  return fetch(url, options);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch,
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
export default supabase;
