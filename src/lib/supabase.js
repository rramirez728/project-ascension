import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Users often paste the REST endpoint (…/rest/v1) from the Supabase dashboard.
 * The client expects the project origin only: https://YOUR_REF.supabase.co
 */
export function normalizeSupabaseUrl(url) {
  if (!url) return '';
  let normalized = url.trim().replace(/\/+$/, '');
  normalized = normalized.replace(/\/rest\/v1$/i, '');
  normalized = normalized.replace(/\/auth\/v1$/i, '');
  return normalized.replace(/\/+$/, '');
}

const url = normalizeSupabaseUrl(rawUrl);

/** True when Supabase env vars are set (cloud auth + sync enabled). */
export function isSupabaseConfigured() {
  return Boolean(
    url
    && anonKey
    && url.startsWith('https://')
    && url.includes('supabase.co')
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
  ? createClient(url, anonKey)
  : null;
