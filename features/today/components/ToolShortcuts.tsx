"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { findTool, homeShortcuts } from "@/features/tools/tools";
import { useRecords } from "@/lib/storage/useRecords";

/** Up to four tool shortcuts (2×2, next to the belly-photo square), chosen with 📌 on the Tools screen. */
export function ToolShortcuts({ contentWeek }: { contentWeek: number }) {
  const t = useTranslations("tools");
  const { records } = useRecords("settings");
  if (!records) return null;
  const shortcuts = homeShortcuts(records[0], contentWeek);
  if (shortcuts.length === 0) return null;

  return (
    <nav aria-label={t("shortcuts")} className="grid h-[120px] flex-1 grid-cols-2 grid-rows-2 gap-2">
      {shortcuts.map((id) => {
        const tool = findTool(id);
        return (
          <Link
            key={id}
            href={tool.href}
            className="flex min-h-11 items-center gap-2 rounded-2xl bg-card px-3 text-[13px] leading-tight font-semibold"
          >
            <span aria-hidden className="text-xl">
              {tool.icon}
            </span>
            {t(id === "bets" ? "betsShort" : id)}
          </Link>
        );
      })}
    </nav>
  );
}
