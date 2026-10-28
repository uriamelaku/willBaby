import { backupFileName, createBackup } from "@/lib/backup";
import { SCHEMA_VERSION } from "@/lib/db";
import { formatLocalDate } from "@/lib/pregnancy";
import type { StorageAdapter } from "@/lib/storage/types";

function downloadJson(data: unknown, fileName: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Revoke after the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Downloads a backup of all data and records when it was made. */
export async function exportBackupFile(storage: StorageAdapter, now: Date): Promise<void> {
  const snapshot = await storage.exportAll();
  downloadJson(await createBackup(snapshot, now), backupFileName(formatLocalDate(now)));
  const [settings] = snapshot.settings;
  await storage.save("settings", {
    ...(settings ?? { schemaVersion: SCHEMA_VERSION }),
    lastBackupAt: now.toISOString(),
  });
}
