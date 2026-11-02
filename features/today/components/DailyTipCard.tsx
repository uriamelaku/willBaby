"use client";

import { useTranslations } from "next-intl";
import { RefreshIcon } from "@/components/icons";
import { ShareableCard } from "@/components/ShareableCard";
import { getDailyItems } from "@/lib/content";
import type { Role } from "@/lib/storage/types";
import { useDailyTip } from "../useDailyTip";

/** Today's daily item; each load (or the "another tip" button) shows the next of the day's items. */
export function DailyTipCard({ daysPregnant, role, render }: {
  daysPregnant: number;
  role: Role;
  render: (template: string) => string;
}) {
  const t = useTranslations();
  const items = getDailyItems(daysPregnant);
  const { index, showNext } = useDailyTip(daysPregnant, items.length);
  const item = items[index];
  if (!item) return null;

  return (
    <ShareableCard
      tone="sun"
      title={t(`today.daily.${item.type}`)}
      text={render(role === "partner" ? item.partnerText : item.text)}
      footnote={<p className="text-[11px] leading-tight text-sun-text">{t("common.disclaimer")}</p>}
      action={
        items.length > 1 && (
          <button
            type="button"
            onClick={showNext}
            aria-label={t("today.daily.next", { current: index + 1, total: items.length })}
            className="-my-3 flex h-11 min-w-11 items-center justify-center gap-1 rounded-full px-1 text-sun-text"
          >
            <span className="text-[11px] tabular-nums" aria-hidden>
              {index + 1}/{items.length}
            </span>
            <RefreshIcon />
          </button>
        )
      }
    />
  );
}
