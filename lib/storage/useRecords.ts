"use client";

import { useCallback, useEffect, useState } from "react";
import { onStorageChange, storage } from "@/lib/storage";
import type { StorageRecords, TableName } from "@/lib/storage/types";

/**
 * All records of a table, with a reload after changes. `records` is null while loading.
 * Reloads on every write in the app and when the app returns to the foreground, so every
 * screen shows current data (e.g. Today after an appointment was moved).
 */
export function useRecords<T extends TableName>(table: T) {
  const [records, setRecords] = useState<StorageRecords[T][] | null>(null);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(
    () =>
      storage
        .list(table)
        .then(setRecords)
        .catch((error) => {
          console.error(`Reading ${table} failed`, error);
          setFailed(true);
        }),
    [table],
  );

  useEffect(() => {
    void reload();
    const onVisibility = () => document.visibilityState === "visible" && void reload();
    document.addEventListener("visibilitychange", onVisibility);
    const unsubscribe = onStorageChange(() => void reload());
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reload]);

  return { records, failed, reload };
}
