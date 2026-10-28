"use client";

import { useTranslations } from "next-intl";
import { Screen, StorageError } from "@/components/Screen";
import { ShareableCard } from "@/components/ShareableCard";
import { WeekFruit } from "@/components/ui/WeekFruit";
import { useContentText } from "@/features/pregnancy/useContentText";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import { SurpriseOverlay } from "@/features/surprises/components/SurpriseOverlay";
import { greetingFor } from "@/features/today/today";
import { getDailyItem, getWeekContent } from "@/lib/content";
import { EARLY_WEEKS, findPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";
import { useToday } from "@/lib/useToday";
import { BellyPhotoPrompt } from "./BellyPhotoPrompt";
import { ToolShortcuts } from "./ToolShortcuts";
import { TrimesterRing } from "./TrimesterRing";
import { UpcomingCard } from "./UpcomingCard";

// Layout per docs/design/today-screen.md; it must fit a 390x844 screen without scrolling.
export function TodayScreen() {
  const state = usePregnancy();
  return (
    <Screen>
      {state.kind === "error" && <StorageError />}
      {state.kind === "ready" && <TodayContent data={state.data} />}
    </Screen>
  );
}

const daysLeftStatus = (daysLeft: number) =>
  daysLeft > 0 ? "before" : daysLeft === 0 ? "today" : "after";

function TodayContent({ data }: { data: PregnancyData }) {
  const t = useTranslations();
  const { render } = useContentText(data.profile, data.babies);
  const now = useToday();
  const status = findPregnancyStatus(parseLocalDate(data.pregnancy.lmpDate), now);

  if (!status) return <p>{t("pregnancy.outOfRange")}</p>;

  const weekContent = getWeekContent(status.contentWeek);
  const dailyItem = getDailyItem(status.daysPregnant);
  const dailyText =
    dailyItem && (data.profile.role === "partner" ? dailyItem.partnerText : dailyItem.text);

  return (
    <>
      <section className="flex flex-col gap-1.5 rounded-card bg-card px-[18px] py-3 shadow-hero">
        <h1 className="text-[15px] text-muted">
          {t(`today.greeting.${greetingFor(now.getHours())}`, { name: data.profile.name })}
        </h1>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            {weekContent?.fruit && weekContent.size && (
              <>
                <WeekFruit fruit={weekContent.fruit} className="text-[44px]" />
                <p className="text-lg font-bold">
                  {t("today.fruit", { babiesCount: data.babies.length, fruit: weekContent.fruit.name })}
                </p>
                <p className="text-sm text-muted">{t("today.size", weekContent.size)}</p>
              </>
            )}
            <p className="text-sm text-muted">{t("today.week", { week: status.contentWeek })}</p>
            {status.week < EARLY_WEEKS && <p className="text-sm">{t("pregnancy.early")}</p>}
            <span className="mt-1 self-start rounded-full bg-peach-soft px-3 py-1 text-[13px] font-semibold">
              {t("today.daysLeft", {
                status: daysLeftStatus(status.daysLeft),
                days: Math.abs(status.daysLeft),
              })}
            </span>
          </div>
          <TrimesterRing status={status} />
        </div>
      </section>

      <UpcomingCard daysPregnant={status.daysPregnant} today={now} />

      <div className="flex gap-3">
        <BellyPhotoPrompt week={status.contentWeek} />
        <ToolShortcuts contentWeek={status.contentWeek} />
      </div>

      {dailyItem && dailyText && (
        <ShareableCard
          tone="sun"
          title={t(`today.daily.${dailyItem.type}`)}
          text={render(dailyText)}
          footnote={<p className="text-[11px] leading-tight text-sun-text">{t("common.disclaimer")}</p>}
        />
      )}

      <SurpriseOverlay data={data} contentWeek={status.contentWeek} />
    </>
  );
}
