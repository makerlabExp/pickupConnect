import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Keys for localStorage
const STORAGE_URL_KEY = 'supabase_url';
const STORAGE_ANON_KEY = 'supabase_anon_key';

let supabase: SupabaseClient | null = null;

export const getStoredCredentials = () => {
  let url = '';
  let key = '';
  
  try {
    // Access env vars directly so Vite can perform static replacement at build time.
    url = process.env.VITE_SUPABASE_URL || '';
    key = process.env.VITE_SUPABASE_ANON_KEY || '';
  } catch (e) {
    // ignore error if process.env is undefined (though defined in vite config)
  }

  return {
    // Prioritize Environment Variables if available (for production/deployment), then fallback to LocalStorage
    url: url || localStorage.getItem(STORAGE_URL_KEY) || '',
    key: key || localStorage.getItem(STORAGE_ANON_KEY) || ''
  };
};

export const saveCredentials = (url: string, key: string) => {
  localStorage.setItem(STORAGE_URL_KEY, url);
  localStorage.setItem(STORAGE_ANON_KEY, key);
  // Re-initialize
  initSupabase(url, key);
};

export const initSupabase = (url: string, key: string) => {
  try {
    if (url && key) {
      supabase = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabase;
    }
  } catch (e) {
    console.error("Failed to init Supabase client", e);
  }
  return null;
};

export const getSupabase = () => {
  if (!supabase) {
    const { url, key } = getStoredCredentials();
    if (url && key) {
      return initSupabase(url, key);
    }
  }
  return supabase;
};

// Try to init immediately if keys exist
getSupabase();