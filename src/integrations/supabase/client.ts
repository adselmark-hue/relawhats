import { createClient } from '@supabase/supabase-js';

// Prefer environment variables; fallback only to PUBLIC values if env injection fails.
const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

// Public fallback (safe for browser use when RLS/policies are correctly configured)
const FALLBACK_SUPABASE_URL = 'https://otuyyxippyyieeleviid.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dXl5eGlwcHl5aWVlbGV2aWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMTM5MTUsImV4cCI6MjA4MTY4OTkxNX0.xKYOpyGP5S15uvbWxfEXYXeQRrsnVii_TuoPRO3aI6g';

const SUPABASE_URL = ENV_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY = ENV_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

// NOTE: Vite only injects import.meta.env at build time.
// If these are missing, we must NOT crash the app. We'll create a placeholder
// client and rely on `isSupabaseConfigured` to block auth/data flows.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Update Project Secrets and rebuild the preview.'
  );
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
    },
  }
);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
