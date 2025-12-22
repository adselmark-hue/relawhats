import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const STORAGE_URL_KEY = 'supabase_url';
const STORAGE_ANON_KEY = 'supabase_anon_key';

function getStoredConfig() {
  const url = localStorage.getItem(STORAGE_URL_KEY) || '';
  const anonKey = localStorage.getItem(STORAGE_ANON_KEY) || '';
  return { url, anonKey };
}

function getEffectiveConfig() {
  // Prefer build-time env (best for production), fallback to runtime localStorage (best for preview/dev).
  const stored = getStoredConfig();
  const url = ENV_SUPABASE_URL || stored.url;
  const anonKey = ENV_SUPABASE_ANON_KEY || stored.anonKey;
  return { url, anonKey };
}

export const isSupabaseConfigured = (() => {
  const { url, anonKey } = getEffectiveConfig();
  return Boolean(url && anonKey);
})();

function createSupabase(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
    },
  });
}

export let supabase: SupabaseClient = (() => {
  const { url, anonKey } = getEffectiveConfig();
  // If not configured, create a placeholder to avoid crashing; UI will prompt user to configure.
  return url && anonKey
    ? createSupabase(url, anonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-key');
})();

export function setSupabaseRuntimeConfig(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_URL_KEY, url);
  localStorage.setItem(STORAGE_ANON_KEY, anonKey);
  supabase = createSupabase(url, anonKey);
}

