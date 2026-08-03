import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || ''
).trim();

/**
 * Always reduce to project origin: https://YOUR_REF.supabase.co
 * Handles users pasting the REST endpoint (…/rest/v1) from the dashboard.
 */
export function normalizeSupabaseUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.endsWith('.supabase.co')) return '';
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return '';
  }
}

const url = normalizeSupabaseUrl(rawUrl);

/** True when Supabase env vars are set (cloud auth + sync enabled). */
export function isSupabaseConfigured() {
  return Boolean(
    url
    && anonKey
    && url.startsWith('https://')
    && anonKey.length > 20
  );
}

/** App URL for auth email redirects (GitHub Pages subpath aware). */
export function getAppOrigin() {
  const base = import.meta.env.BASE_URL || '/';
  const path = base.endsWith('/') ? base : `${base}/`;
  return `${window.location.origin}${path}`;
}

/** Supabase client — null when not configured (local-only mode). */
export const supabase = isSupabaseConfigured()
  ? createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  : null;

/** Map cryptic Supabase errors to actionable messages. */
export function formatAuthError(message) {
  if (!message) return 'Authentication failed';
  if (/invalid path specified/i.test(message)) {
    return 'Supabase URL is misconfigured. In GitHub secrets, set VITE_SUPABASE_URL to https://YOUR_PROJECT.supabase.co (no /rest/v1).';
  }
  if (/invalid api key/i.test(message)) {
    return 'Supabase API key is invalid. Use the publishable or anon key from Supabase → Settings → API Keys.';
  }
  return message;
}
