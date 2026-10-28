/** Asks the browser not to evict this site's storage under pressure; returns whether it agreed. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch (error) {
    console.error("Requesting persistent storage failed", error);
    return false;
  }
}
