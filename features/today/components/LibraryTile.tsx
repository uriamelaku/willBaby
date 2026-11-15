"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { getLibraryTopics } from "@/lib/content";

/** The knowledge library's permanent square on Today, the same size as the belly-photo square. */
export function LibraryTile() {
  const t = useTranslations("today.library");

  return (
    <Link href="/library" className="flex h-[120px] w-[116px] shrink-0 flex-col gap-1.5 rounded-card bg-card p-2.5">
      <span className="flex flex-1 items-center justify-center rounded-[20px] bg-brand-soft">
        <span aria-hidden className="text-[32px]">
          📚
        </span>
      </span>
      <span className="flex flex-col px-0.5 text-sm leading-tight font-semibold">
        <span>{t("label")}</span>
        <span className="text-[13px] font-normal text-muted">
          {t("topics", { count: getLibraryTopics().length })}
        </span>
      </span>
    </Link>
  );
}
