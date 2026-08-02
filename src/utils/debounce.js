/** Returns a debounced version of fn that delays invocation until after wait ms. */
export function debounce(fn, wait = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        resolve(await fn(...args));
      }, wait);
    });
  };
}
