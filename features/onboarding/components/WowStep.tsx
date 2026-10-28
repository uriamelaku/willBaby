"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import weeks from "@/content/he/weeks.json";
import type { WeekContent } from "@/content/schema";
import { getPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";
import type { Role } from "@/lib/storage/types";

const EARLY_WEEKS = 4;

const daysLeftStatus = (daysLeft: number) =>
  daysLeft > 0 ? "before" : daysLeft === 0 ? "today" : "after";

export function WowStep({ role, lmpDate, babiesCount, onContinue }: {
  role: Role;
  lmpDate: string;
  babiesCount: number;
  onContinue: () => void;
}) {
  const t = useTranslations("onboarding.wow");
  const [today] = useState(() => new Date());
  const status = getPregnancyStatus(parseLocalDate(lmpDate), today);
  const weekContent = (weeks as WeekContent[]).find((w) => w.week === status.contentWeek);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      {weekContent && (
        <span role="img" aria-label={weekContent.fruit.name} className="text-8xl">
          {weekContent.fruit.emoji}
        </span>
      )}
      <h1 className="text-4xl font-semibold">
        {t("title", { role, weekAndDay: `${status.week}+${status.dayOfWeek}` })}
      </h1>
      <p className="text-xl">{t("contentWeek", { week: status.contentWeek })}</p>
      {status.week < EARLY_WEEKS && <p>{t("early")}</p>}
      {weekContent && <p>{t("fruit", { babiesCount, fruit: weekContent.fruit.name })}</p>}
      <p>
        {t("daysLeft", {
          status: daysLeftStatus(status.daysLeft),
          days: Math.abs(status.daysLeft),
        })}
      </p>
      <Button onClick={onContinue} className="mt-6 w-full">
        {t("continue")}
      </Button>
    </div>
  );
}
