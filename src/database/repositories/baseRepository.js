/**
 * Base repository contract — all entity repos implement these methods.
 * Future Supabase repos will mirror this interface.
 *
 * @typedef {Object} RepositoryContract
 * @property {() => Promise<Array>} getAll
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(item: Object) => Promise<string>} create
 * @property {(id: string, updates: Object) => Promise<void>} update
 * @property {(id: string) => Promise<void>} delete
 */

export {};
