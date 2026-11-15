"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { findTool, homeShortcuts } from "@/features/tools/tools";
import { useRecords } from "@/lib/storage/useRecords";

/**
 * Up to four tool shortcuts in a 2×2 grid beside the library square, chosen with 📌 on the Tools
 * screen. When the belly-photo square also takes room, the shortcuts shrink to icons (names stay
 * for screen readers).
 */
export function ToolShortcuts({ contentWeek }: { contentWeek: number }) {
  const t = useTranslations("tools");
  const { records } = useRecords("settings");
  if (!records) return null;
  const shortcuts = homeShortcuts(records[0], contentWeek);
  if (shortcuts.length === 0) return null;

  return (
    <nav aria-label={t("shortcuts")} className="@container min-w-24 flex-1">
      <div className="grid h-[120px] grid-cols-2 grid-rows-2 gap-2">
        {shortcuts.map((id) => {
          const tool = findTool(id);
          return (
            <Link
              key={id}
              href={tool.href}
              className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-2xl bg-card text-[13px] leading-tight font-semibold @[150px]:justify-start @[150px]:px-3"
            >
              <span aria-hidden className="text-xl">
                {tool.icon}
              </span>
              <span className="sr-only @[150px]:not-sr-only">{t(id === "bets" ? "betsShort" : id)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
