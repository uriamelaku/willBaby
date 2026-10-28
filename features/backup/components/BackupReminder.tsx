"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { isBackupDue } from "@/lib/backup";
import { useRecords } from "@/lib/storage/useRecords";

/** Shown on Today when the last backup (or onboarding) was 4+ weeks ago. */
export function BackupReminder({ onboardedAt }: { onboardedAt: string }) {
  const t = useTranslations("backup");
  const { records: settings } = useRecords("settings");
  const [now] = useState(() => new Date());

  if (!settings || !isBackupDue(settings[0]?.lastBackupAt, onboardedAt, now)) return null;

  return (
    <Card className="flex flex-col gap-2 border-2 border-sun">
      <p>{t("reminder")}</p>
      <Link href="/more#backup" className="flex min-h-11 items-center font-semibold underline">
        {t("reminderAction")}
      </Link>
    </Card>
  );
}
