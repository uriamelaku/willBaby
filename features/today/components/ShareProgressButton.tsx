"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ShareIcon } from "@/components/icons";
import type { WeekContent } from "@/content/schema";
import { useContentText } from "@/features/pregnancy/useContentText";
import type { PregnancyData } from "@/features/pregnancy/usePregnancy";
import { daysLeftStatus, progressFraction } from "@/features/today/today";
import type { PregnancyStatus } from "@/lib/pregnancy";
import { shareText, withSignature } from "@/lib/share";

/** Shares this week's progress (week, percent, fruit, days left) to WhatsApp or the share sheet. */
export function ShareProgressButton({ data, status, weekContent }: {
  data: PregnancyData;
  status: PregnancyStatus;
  weekContent: WeekContent | undefined;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const { babyNoun } = useContentText(data.profile, data.babies);

  const share = () => {
    const lines = [
      t("today.shareProgress", {
        role: data.profile.role,
        weekAndDay: `${status.week}+${status.dayOfWeek}`,
        percent: format.number(progressFraction(status.daysPregnant), { style: "percent" }),
      }),
      weekContent?.fruit &&
        `${weekContent.fruit.emoji} ${t("pregnancy.fruit", {
          babiesCount: data.babies.length,
          baby: babyNoun,
          fruit: weekContent.fruit.name,
        })}`,
      t("pregnancy.daysLeft", { status: daysLeftStatus(status.daysLeft), days: Math.abs(status.daysLeft) }),
    ];
    void shareText(withSignature(lines.filter(Boolean).join("\n"), t("share.signature")));
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={t("today.shareProgressLabel")}
      className="-my-3 -me-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-muted"
    >
      <ShareIcon />
    </button>
  );
}
