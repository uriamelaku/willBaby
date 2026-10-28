"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WeekFruit } from "@/components/ui/WeekFruit";
import { DaysLeft } from "@/features/pregnancy/components/DaysLeft";
import { useContentText } from "@/features/pregnancy/useContentText";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import { getDailyItem, getWeekContent } from "@/lib/content";
import {
  EARLY_WEEKS,
  getPregnancyStatus,
  parseLocalDate,
  validateLmp,
} from "@/lib/pregnancy";

export function TodayScreen() {
  const t = useTranslations();
  const state = usePregnancy();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      {state.kind === "error" && (
        <p role="alert" className="text-danger">
          {t("common.storageError")}
        </p>
      )}
      {state.kind === "ready" && <TodayContent data={state.data} />}
    </main>
  );
}

function TodayContent({ data }: { data: PregnancyData }) {
  const t = useTranslations();
  const { render, babyNoun } = useContentText(data.profile, data.babies);
  const [today] = useState(() => new Date());
  const lmp = parseLocalDate(data.pregnancy.lmpDate);

  if (!validateLmp(lmp, today).valid) {
    return <p>{t("pregnancy.outOfRange")}</p>;
  }

  const status = getPregnancyStatus(lmp, today);
  const weekContent = getWeekContent(status.contentWeek);
  const dailyItem = getDailyItem(status.daysPregnant);
  const dailyText = dailyItem && (data.profile.role === "partner" ? dailyItem.partnerText : dailyItem.text);

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("today.greeting", { name: data.profile.name })}</h1>

      <Card className="flex flex-col items-center gap-3 text-center">
        {weekContent && <WeekFruit fruit={weekContent.fruit} className="text-7xl" />}
        <p className="text-4xl font-semibold">
          {t("pregnancy.weekAndDay", { weekAndDay: `${status.week}+${status.dayOfWeek}` })}
        </p>
        <p>
          {t("pregnancy.contentWeek", { week: status.contentWeek })} ·{" "}
          {t("pregnancy.trimester", { trimester: status.trimester })}
        </p>
        {status.week < EARLY_WEEKS && <p>{t("pregnancy.early")}</p>}
        {weekContent && (
          <p>
            {t("pregnancy.fruit", {
              babiesCount: data.babies.length,
              baby: babyNoun,
              fruit: weekContent.fruit.name,
            })}
            <span className="block text-sm opacity-75">
              {t("pregnancy.size", weekContent.size)}
            </span>
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <DaysLeft daysLeft={status.daysLeft} className="font-semibold" />
        <ProgressBar value={status.progress} label={t("pregnancy.progressLabel")} />
        <p className="text-sm opacity-75">
          {t("pregnancy.progress", { percent: Math.round(status.progress * 100) })}
        </p>
      </Card>

      {dailyItem && dailyText && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-brand">{t(`today.daily.${dailyItem.type}`)}</h2>
          <p className="text-lg">{render(dailyText)}</p>
        </Card>
      )}

      {weekContent && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-brand">{t("today.funFact")}</h2>
          <p>{render(weekContent.funFact)}</p>
        </Card>
      )}

      <p className="mt-auto pt-4 text-center text-xs opacity-75">{t("today.disclaimer")}</p>
    </>
  );
}
