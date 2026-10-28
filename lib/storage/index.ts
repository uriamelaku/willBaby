import { WillBabyDb } from "@/lib/db";
import { createIndexedDbStorage } from "@/lib/storage/indexedDb";
import type { StorageAdapter } from "@/lib/storage/types";

const listeners = new Set<() => void>();

/** Calls the listener after every write (e.g. to check for new badges); returns an unsubscribe. */
export function onStorageChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const notifyAfter = async <T>(write: Promise<T>): Promise<T> => {
  const result = await write;
  listeners.forEach((listener) => listener());
  return result;
};

const indexedDbStorage = createIndexedDbStorage(new WillBabyDb());

/** The app's storage; swap the implementation here to add a sync backend. */
export const storage: StorageAdapter = {
  ...indexedDbStorage,
  save: (table, data) => notifyAfter(indexedDbStorage.save(table, data)),
  remove: (table, id) => notifyAfter(indexedDbStorage.remove(table, id)),
  replaceAll: (snapshot) => notifyAfter(indexedDbStorage.replaceAll(snapshot)),
};
