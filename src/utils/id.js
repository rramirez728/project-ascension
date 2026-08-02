/** Generate a unique id for database records. */
export function generateId() {
  return crypto.randomUUID();
}
