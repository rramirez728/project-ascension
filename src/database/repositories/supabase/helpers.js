import { supabase } from '../../../lib/supabase.js';

/** @returns {Promise<string>} */
export async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

/** @param {import('@supabase/supabase-js').PostgrestError | null} error @param {string} fallback */
export function throwIfError(error, fallback) {
  if (error) throw new Error(error.message || fallback);
}
