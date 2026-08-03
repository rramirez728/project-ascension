import { isSupabaseConfigured } from '../lib/supabase.js';

/** @typedef {'indexeddb' | 'supabase'} StorageBackend */

/** @type {StorageBackend} */
let activeBackend = 'indexeddb';

/** Which repository backend is active. */
export function getActiveBackend() {
  if (!isSupabaseConfigured()) return 'indexeddb';
  return activeBackend;
}

/** Switch between local IndexedDB and Supabase (call on sign-in/out). */
export function setActiveBackend(backend) {
  activeBackend = backend;
}

/** Proxy that delegates method calls to local or cloud repo based on active backend. */
export function createDualRepository(localRepo, cloudRepo) {
  return new Proxy(localRepo, {
    get(_target, prop) {
      const repo = getActiveBackend() === 'supabase' ? cloudRepo : localRepo;
      const value = repo[prop];
      return typeof value === 'function' ? value.bind(repo) : value;
    },
  });
}
