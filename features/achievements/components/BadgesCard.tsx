"use client";

import { useFormatter, useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { Card } from "@/components/ui/Card";
import { getBadges } from "@/lib/content";
import { useRecords } from "@/lib/storage/useRecords";

/** All badges: earned ones in color with their date, the rest greyed out with how to earn them. */
export function BadgesCard() {
  const t = useTranslations("badges");
  const format = useFormatter();
  const { records, failed } = useRecords("badges");

  if (failed) return <StorageError />;
  if (!records) return null;
  const earnedAt = new Map(records.map((badge) => [badge.badgeId, badge.earnedAt]));

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">
        {t("title")} ({earnedAt.size}/{getBadges().length})
      </h2>
      <ul className="grid grid-cols-2 gap-2">
        {getBadges().map((badge) => {
          const date = earnedAt.get(badge.id);
          return (
            <li
              key={badge.id}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center ${date ? "bg-mint-soft" : "bg-bg"}`}
            >
              <span aria-hidden className={`text-3xl ${date ? "" : "opacity-40 grayscale"}`}>
                {badge.emoji}
              </span>
              <span className="text-sm font-semibold">{badge.name}</span>
              <span className="text-xs text-muted">
                {date ? t("earnedOn", { date: format.dateTime(new Date(date), { dateStyle: "medium" }) }) : badge.description}
              </span>
              {!date && <span className="sr-only">{t("locked")}</span>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
