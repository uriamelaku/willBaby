"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CameraIcon } from "@/components/icons";
import { findPhotoForWeek } from "@/features/photos/photos";
import { useRecords } from "@/lib/storage/useRecords";

/** Invites a belly photo; shown only while this week has none. */
export function BellyPhotoPrompt({ week }: { week: number }) {
  const t = useTranslations("today.photo");
  const { records } = useRecords("photos");

  if (!records || findPhotoForWeek(records, week)) return null;

  return (
    <Link
      href="/journal/photos"
      className="flex h-[120px] w-[140px] flex-col gap-1.5 self-start rounded-card bg-card p-2.5"
    >
      <span className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] border-2 border-dashed border-brand/50 bg-peach-soft text-brand-text">
        <CameraIcon />
        <span className="text-[13px] font-semibold">{t("take")}</span>
      </span>
      <span className="flex flex-col px-0.5 text-sm leading-tight font-semibold">
        <span>{t("label")}</span>
        <span className="text-[13px] font-normal text-muted">{t("week", { week })}</span>
      </span>
    </Link>
  );
}
