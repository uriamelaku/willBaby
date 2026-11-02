"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { Screen, StorageError } from "@/components/Screen";
import { Card } from "@/components/ui/Card";
import type { LibraryTopic } from "@/content/schema";
import { useContentText } from "@/features/pregnancy/useContentText";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";

export function LibraryTopicScreen({ topic }: { topic: LibraryTopic }) {
  const state = usePregnancy();
  return (
    <Screen>
      {state.kind === "error" && <StorageError />}
      {state.kind === "ready" && <TopicContent topic={topic} data={state.data} />}
      <MedicalDisclaimer sensitive={topic.section === "normal"} />
    </Screen>
  );
}

function TopicContent({ topic, data }: { topic: LibraryTopic; data: PregnancyData }) {
  const t = useTranslations("library");
  const { render } = useContentText(data.profile, data.babies);
  return (
    <>
      <Link href="/library" className="flex min-h-11 items-center self-start text-sm font-medium text-brand-text">
        → {t("back")}
      </Link>
      <header className="flex flex-col items-center gap-2 text-center">
        <span aria-hidden className="text-6xl">
          {topic.icon}
        </span>
        <h1 className="text-3xl font-semibold">{topic.title}</h1>
        <p className="text-lg">{render(topic.intro)}</p>
      </header>
      {topic.entries.map((entry) => (
        <Card key={entry.title} className="flex flex-col gap-2">
          <h2 className="font-semibold text-brand-text">{entry.title}</h2>
          <p>{render(entry.text)}</p>
          {entry.whenToCall && (
            <p className="rounded-2xl bg-peach-soft p-3 text-sm text-peach-text">
              <span className="font-semibold">{t("whenToCall")} </span>
              {render(entry.whenToCall)}
            </p>
          )}
          {entry.link && (
            <a
              href={entry.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center self-start text-sm font-medium text-brand-text underline"
            >
              {entry.link.label} ↗
            </a>
          )}
        </Card>
      ))}
    </>
  );
}
