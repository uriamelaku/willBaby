import type { WillBabyDb } from "@/lib/db";
import {
  TABLE_NAMES,
  type StorageAdapter,
  type StorageRecords,
  type StorageSnapshot,
  type TableName,
} from "@/lib/storage/types";

export function createIndexedDbStorage(db: WillBabyDb): StorageAdapter {
  const tableOf = <T extends TableName>(table: T) =>
    db.table<StorageRecords[T], string>(table);

  return {
    get: (table, id) => tableOf(table).get(id),

    list: (table) => tableOf(table).toArray(),

    save(table, data) {
      const records = tableOf(table);
      return db.transaction("rw", records, async () => {
        const existing = data.id ? await records.get(data.id) : undefined;
        const now = new Date().toISOString();
        const record = {
          ...data,
          id: data.id ?? crypto.randomUUID(),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        } as StorageRecords[typeof table];
        await records.put(record);
        return record;
      });
    },

    remove: (table, id) => tableOf(table).delete(id),

    async exportAll() {
      const entries = await Promise.all(
        TABLE_NAMES.map(async (table) => [table, await tableOf(table).toArray()] as const),
      );
      return Object.fromEntries(entries) as StorageSnapshot;
    },

    replaceAll(snapshot) {
      return db.transaction("rw", db.tables, async () => {
        for (const table of TABLE_NAMES) {
          await tableOf(table).clear();
          await tableOf(table).bulkPut(snapshot[table]);
        }
      });
    },
  };
}
