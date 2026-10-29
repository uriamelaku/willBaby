"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { usePregnancy } from "@/features/pregnancy/usePregnancy";
import {
  MAX_HOME_SHORTCUTS,
  TOOLS,
  homeShortcuts,
  toggleShortcut,
  withShortcuts,
  type ToolId,
} from "@/features/tools/tools";
import { SCHEMA_VERSION } from "@/lib/db";
import { findPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";
import { storage } from "@/lib/storage";
import { useRecords } from "@/lib/storage/useRecords";
import { useToday } from "@/lib/useToday";

/** All tools, each with a 📌 toggle for the Today shortcuts (at most four). */
export function ToolsList() {
  const t = useTranslations("tools");
  const state = usePregnancy();
  const { records } = useRecords("settings");
  const today = useToday();
  const [saveFailed, setSaveFailed] = useState(false);

  if (state.kind === "error") return <StorageError />;
  if (state.kind !== "ready" || !records) return null;

  const [settings] = records;
  const week = findPregnancyStatus(parseLocalDate(state.data.pregnancy.lmpDate), today)?.contentWeek ?? 1;
  const pinned = homeShortcuts(settings, week);
  const full = pinned.length >= MAX_HOME_SHORTCUTS;

  const toggle = async (id: ToolId) => {
    const next = toggleShortcut(pinned, id);
    if (!next) return;
    try {
      await storage.save("settings", withShortcuts(settings ?? { schemaVersion: SCHEMA_VERSION }, next));
      setSaveFailed(false);
    } catch (error) {
      console.error("Saving the home shortcuts failed", error);
      setSaveFailed(true);
    }
  };

  return (
    <>
      <p className="text-sm text-muted" aria-live="polite">
        {full
          ? t("pinFull", { max: MAX_HOME_SHORTCUTS })
          : t("pinHint", { max: MAX_HOME_SHORTCUTS, count: pinned.length })}
      </p>
      {saveFailed && <StorageError />}
      <ul className="flex flex-col gap-3">
        {TOOLS.map((tool) => {
          const isPinned = pinned.includes(tool.id);
          return (
            <li key={tool.id} className="flex items-center gap-2 rounded-card bg-card pe-3">
              <Link href={tool.href} className="flex min-h-11 flex-1 items-center gap-4 p-5">
                <span aria-hidden className="text-3xl">
                  {tool.icon}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{t(tool.id)}</span>
                  <span className="text-sm text-muted">{t(`${tool.id}Description`)}</span>
                </span>
              </Link>
              <button
                type="button"
                aria-pressed={isPinned}
                aria-label={t("pin", { tool: t(tool.id) })}
                disabled={!isPinned && full}
                onClick={() => toggle(tool.id)}
                className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xl transition disabled:opacity-30 motion-reduce:transition-none ${isPinned ? "bg-brand-soft" : "grayscale opacity-50"}`}
              >
                📌
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
