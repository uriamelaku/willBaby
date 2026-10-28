"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { ShareableCard } from "@/components/ShareableCard";
import { Card } from "@/components/ui/Card";
import { WeekFruit } from "@/components/ui/WeekFruit";
import { useContentText } from "@/features/pregnancy/useContentText";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import { getWeekContent } from "@/lib/content";
import { MAX_CONTENT_WEEK, findPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";

export function WeekScreen({ week }: { week: number }) {
  const t = useTranslations();
  const state = usePregnancy();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      {state.kind === "error" && (
        <p role="alert" className="text-danger">
          {t("common.storageError")}
        </p>
      )}
      {state.kind === "ready" && <WeekContentView week={week} data={state.data} />}
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold text-brand-text">{title}</h2>
      {children}
    </Card>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 ps-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function WeekContentView({ week, data }: { week: number; data: PregnancyData }) {
  const t = useTranslations();
  const { render, babyNoun } = useContentText(data.profile, data.babies);
  const [today] = useState(() => new Date());
  const currentWeek = findPregnancyStatus(parseLocalDate(data.pregnancy.lmpDate), today)?.contentWeek;
  const content = getWeekContent(week);
  const isPartner = data.profile.role === "partner";

  const partnerCorner = content && (
    <Section title={t("week.partner")}>
      <p>{render(content.partner.tip)}</p>
      <p>
        <span className="font-semibold">{t("week.partnerMission")}: </span>
        {render(content.partner.mission)}
      </p>
    </Section>
  );

  return (
    <>
      <header className="flex flex-col items-center gap-2 text-center">
        {content && <WeekFruit fruit={content.fruit} className="text-7xl" />}
        <h1 className="text-3xl font-semibold">{t("week.title", { week })}</h1>
        {week === currentWeek && (
          <span className="rounded-full bg-accent/30 px-3 py-1 text-sm">{t("week.current")}</span>
        )}
        {content && (
          <>
            <p className="text-lg">{render(content.headline)}</p>
            <p className="text-sm opacity-75">{t("pregnancy.size", content.size)}</p>
          </>
        )}
      </header>

      {content ? (
        <>
          {isPartner && partnerCorner}
          <Section title={t("week.baby", { baby: babyNoun })}>
            <TextList items={content.baby.map(render)} />
          </Section>
          <Section title={t("week.body")}>
            <TextList items={content.body.map(render)} />
          </Section>
          <Section title={t("week.tips")}>
            <TextList items={content.tips.map(render)} />
          </Section>
          {!isPartner && partnerCorner}
          {content.twinsNote && data.babies.length > 1 && (
            <Section title={t("week.twinsNote")}>
              <p>{render(content.twinsNote)}</p>
            </Section>
          )}
          <ShareableCard title={t("pregnancy.funFact")} text={render(content.funFact)} />
        </>
      ) : (
        <Card>
          <p>{t("week.noContent")}</p>
        </Card>
      )}

      <nav aria-label={t("week.weeksNav")} className="flex justify-between gap-3">
        {week > 1 ? (
          <WeekLink week={week - 1} label={`→ ${t("week.previous", { week: week - 1 })}`} />
        ) : (
          <span />
        )}
        {week < MAX_CONTENT_WEEK && (
          <WeekLink week={week + 1} label={`${t("week.next", { week: week + 1 })} ←`} />
        )}
      </nav>

      <MedicalDisclaimer />
    </>
  );
}

function WeekLink({ week, label }: { week: number; label: string }) {
  return (
    <Link
      href={`/week/${week}`}
      className="flex min-h-11 items-center rounded-full border border-text/20 bg-card px-5"
    >
      {label}
    </Link>
  );
}
