"use client";

import { useState } from "react";
import { isBackupDue } from "@/lib/backup";
import { useRecords } from "@/lib/storage/useRecords";

/** True when the last backup (or onboarding, if there was none) was 4+ weeks ago. */
export function useBackupDue(): boolean {
  const { records: settings } = useRecords("settings");
  const { records: pregnancies } = useRecords("pregnancy");
  const [now] = useState(() => new Date());
  const pregnancy = pregnancies?.[0];
  if (!settings || !pregnancy) return false;
  return isBackupDue(settings[0]?.lastBackupAt, pregnancy.createdAt, now);
}
