import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when Supabase env vars are set (cloud auth + sync enabled). */
export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

/** Supabase client — null when not configured (local-only mode). */
export const supabase = isSupabaseConfigured()
  ? createClient(url, anonKey)
  : null;
