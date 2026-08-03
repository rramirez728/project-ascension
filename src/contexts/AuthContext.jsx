import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, formatAuthError } from '../lib/supabase.js';
import { setActiveBackend } from '../database/storageBackend.js';

const GUEST_KEY = 'project-ascension-guest';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [guestMode, setGuestMode] = useState(() => sessionStorage.getItem(GUEST_KEY) === '1');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const finishLoading = (session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setActiveBackend(session?.user ? 'supabase' : 'indexeddb');
      setLoading(false);
    };

    const timeout = setTimeout(() => {
      if (cancelled) return;
      console.warn('Supabase auth timed out — using local mode');
      setActiveBackend('indexeddb');
      setLoading(false);
    }, 8000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        finishLoading(session);
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.warn('Supabase auth unavailable:', err.message);
        setActiveBackend('indexeddb');
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        sessionStorage.removeItem(GUEST_KEY);
        setGuestMode(false);
        setActiveBackend('supabase');
      } else if (!sessionStorage.getItem(GUEST_KEY)) {
        setActiveBackend('indexeddb');
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const continueAsGuest = useCallback(() => {
    sessionStorage.setItem(GUEST_KEY, '1');
    setGuestMode(true);
    setActiveBackend('indexeddb');
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(formatAuthError(error.message));
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(formatAuthError(error.message));
    sessionStorage.removeItem(GUEST_KEY);
    setGuestMode(false);
    setActiveBackend('supabase');
    window.location.reload();
  }, []);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(GUEST_KEY);
    setGuestMode(false);
    if (supabase && user) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setActiveBackend('indexeddb');
    window.location.reload();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        guestMode,
        isCloudEnabled: isSupabaseConfigured(),
        continueAsGuest,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
