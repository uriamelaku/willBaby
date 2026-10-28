"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { exportBackupFile } from "@/features/backup/backupActions";
import { useBackupDue } from "@/features/backup/useBackupDue";
import { parseBackup, type BackupError } from "@/lib/backup";
import { storage } from "@/lib/storage";
import type { StorageSnapshot } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";

interface PendingRestore {
  snapshot: StorageSnapshot;
  exportedAt: string;
}

export function BackupCard() {
  const t = useTranslations();
  const format = useFormatter();
  const router = useRouter();
  const { records: settings, reload } = useRecords("settings");
  const fileInput = useRef<HTMLInputElement>(null);
  const [exported, setExported] = useState(false);
  const [importError, setImportError] = useState<BackupError>();
  const [pending, setPending] = useState<PendingRestore | null>(null);
  const [failed, setFailed] = useState(false);
  const lastBackupAt = settings?.[0]?.lastBackupAt;
  const backupDue = useBackupDue();

  const handleExport = async () => {
    setFailed(false);
    try {
      await exportBackupFile(storage, new Date());
      setExported(true);
      await reload();
    } catch (error) {
      console.error("Exporting the backup failed", error);
      setFailed(true);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportError(undefined);
    const parsed = parseBackup(await file.text());
    if (parsed.ok) setPending({ snapshot: parsed.snapshot, exportedAt: parsed.exportedAt });
    else setImportError(parsed.error);
  };

  const restore = async () => {
    if (!pending) return;
    try {
      await storage.replaceAll(pending.snapshot);
      // Screens load their data on mount, so navigating shows the restored data.
      router.push("/today");
    } catch (error) {
      console.error("Restoring the backup failed", error);
      setFailed(true);
      setPending(null);
    }
  };

  const formatTimestamp = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "long" });

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">{t("backup.title")}</h2>
      {backupDue && (
        <p className="rounded-2xl bg-sun-soft px-4 py-3 text-sm text-sun-text">{t("backup.reminder")}</p>
      )}
      <p className="text-sm">{t("backup.intro")}</p>
      <p className="text-sm text-muted">{t("backup.ios")}</p>
      <p className="text-sm font-semibold">
        {lastBackupAt ? t("backup.last", { date: formatTimestamp(lastBackupAt) }) : t("backup.never")}
      </p>
      <Button onClick={handleExport}>{t("backup.export")}</Button>
      {exported && <p className="text-sm">{t("backup.exported")}</p>}
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
      />
      <Button variant="secondary" onClick={() => fileInput.current?.click()}>
        {t("backup.import")}
      </Button>
      {importError && (
        <p role="alert" className="text-sm text-danger">
          {t(`backup.errors.${importError}`)}
        </p>
      )}
      {failed && <StorageError />}
      <ConfirmDialog
        open={pending !== null}
        title={t("backup.confirmTitle")}
        message={pending ? t("backup.confirmMessage", { date: formatTimestamp(pending.exportedAt) }) : undefined}
        confirmLabel={t("backup.confirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={restore}
        onCancel={() => setPending(null)}
      />
    </Card>
  );
}
