"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { bagProgress, showBagReminder } from "@/features/hospitalBag/hospitalBag";
import { usePregnancy } from "@/features/pregnancy/usePregnancy";
import { getHospitalBagItems } from "@/lib/content";
import { findPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";
import { useRecords } from "@/lib/storage/useRecords";

/** In-app reminder to pack the hospital bag, from week 32 until it is complete. */
export function BagReminder() {
  const t = useTranslations("hospitalBag");
  const state = usePregnancy();
  const { records } = useRecords("checklist");
  const [today] = useState(() => new Date());

  if (state.kind !== "ready" || !records) return null;
  const week = findPregnancyStatus(parseLocalDate(state.data.pregnancy.lmpDate), today)?.contentWeek;
  const progress = bagProgress(getHospitalBagItems(), records);
  if (!week || !showBagReminder(week, progress)) return null;

  return (
    <Link href="/tools/hospital-bag" className="flex min-h-11 items-center gap-3 rounded-card bg-sun-soft p-4 text-sun-text">
      <span aria-hidden className="text-2xl">
        🧳
      </span>
      <span className="font-semibold">{t("reminder", progress)}</span>
    </Link>
  );
}
