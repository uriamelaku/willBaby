"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { WeekFruit } from "@/components/ui/WeekFruit";
import type { OnboardingRecords } from "@/features/onboarding/onboarding";
import { DaysLeft } from "@/features/pregnancy/components/DaysLeft";
import { useContentText } from "@/features/pregnancy/useContentText";
import { getWeekContent } from "@/lib/content";
import { EARLY_WEEKS, getPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";

export function WowStep({ records, onContinue }: {
  records: OnboardingRecords;
  onContinue: () => void;
}) {
  const t = useTranslations();
  const { babyNoun } = useContentText(records.profile, records.babies);
  const [today] = useState(() => new Date());
  const status = getPregnancyStatus(parseLocalDate(records.pregnancy.lmpDate), today);
  const weekContent = getWeekContent(status.contentWeek);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      {weekContent && <WeekFruit fruit={weekContent.fruit} className="text-8xl" />}
      <h1 className="text-4xl font-semibold">
        {t("onboarding.wow.title", {
          role: records.profile.role,
          weekAndDay: `${status.week}+${status.dayOfWeek}`,
        })}
      </h1>
      <p className="text-xl">{t("pregnancy.contentWeek", { week: status.contentWeek })}</p>
      {status.week < EARLY_WEEKS && <p>{t("pregnancy.early")}</p>}
      {weekContent && (
        <p>
          {t("pregnancy.fruit", {
            babiesCount: records.babies.length,
            baby: babyNoun,
            fruit: weekContent.fruit.name,
          })}
        </p>
      )}
      <DaysLeft daysLeft={status.daysLeft} />
      <Button onClick={onContinue} className="mt-6 w-full">
        {t("onboarding.wow.continue")}
      </Button>
    </div>
  );
}
