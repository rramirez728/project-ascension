import { supabase } from '../../lib/supabase.js';
import { todayISO } from '../../utils/dates.js';

/** Send a message, photo, or audio clip to the server-side assistant. */
export async function sendAssistantMessage(payload) {
  if (!supabase) {
    return {
      error: 'ASSISTANT_UNAVAILABLE',
      message: 'Sign in to a Supabase account to use the assistant. Guest mode keeps manual logging on this device.',
    };
  }

  const { data, error } = await supabase.functions.invoke('assistant', {
    body: { today: todayISO(), ...payload },
  });

  if (error) {
    const context = await error.context?.json?.().catch(() => null);
    return {
      error: context?.error || 'ASSISTANT_UNAVAILABLE',
      message: context?.message || error.message || 'The assistant is unavailable.',
      saved: false,
    };
  }

  return data;
}
