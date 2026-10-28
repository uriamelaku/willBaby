"use client";

import { useCallback, useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import type { StorageRecords, TableName } from "@/lib/storage/types";

/** All records of a table, with a reload after changes. `records` is null while loading. */
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
  }, [reload]);

  return { records, failed, reload };
}
