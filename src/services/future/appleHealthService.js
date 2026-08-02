/** @returns {Promise<void>} */
export async function requestHealthKitPermission() {
  throw new Error('Apple Health integration not implemented — coming in a future release');
}

/** @returns {Promise<{steps: number, sleep: number, weight: number|null}>} */
export async function syncHealthData() {
  throw new Error('Apple Health sync not implemented — coming in a future release');
}
