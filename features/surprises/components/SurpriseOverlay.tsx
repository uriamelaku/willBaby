"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { Surprise } from "@/content/schema";
import { useContentText } from "@/features/pregnancy/useContentText";
import type { PregnancyData } from "@/features/pregnancy/usePregnancy";
import { markSurpriseSeen, surpriseFor } from "@/features/surprises/surprises";
import { getSurprises } from "@/lib/content";
import { SCHEMA_VERSION } from "@/lib/db";
import { storage } from "@/lib/storage";
import { useRecords } from "@/lib/storage/useRecords";
import { SurpriseEffect } from "./SurpriseEffect";

/** The one-time full-screen surprise of a special week (12, 20, 24, 30, 37, 40). */
export function SurpriseOverlay({ data, contentWeek }: { data: PregnancyData; contentWeek: number }) {
  const { records } = useRecords("settings");
  const [closed, setClosed] = useState(false);
  if (!records || closed) return null;
  const [settings] = records;
  const surprise = surpriseFor(getSurprises(), contentWeek, settings);
  if (!surprise) return null;

  const close = async () => {
    setClosed(true);
    try {
      await storage.save("settings", markSurpriseSeen(settings ?? { schemaVersion: SCHEMA_VERSION }, surprise.week));
    } catch (error) {
      console.error("Saving the seen surprise failed", error);
    }
  };

  return <SurpriseDialog surprise={surprise} data={data} onClose={close} />;
}

function SurpriseDialog({ surprise, data, onClose }: {
  surprise: Surprise;
  data: PregnancyData;
  onClose: () => void;
}) {
  const t = useTranslations("surprise");
  const { render } = useContentText(data.profile, data.babies);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="surprise-title"
      className="m-0 h-dvh max-h-none w-full max-w-none bg-bg text-text backdrop:bg-bg"
    >
      <SurpriseEffect effect={surprise.effect} />
      <div className="relative mx-auto flex h-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <span
          aria-hidden
          className={`text-8xl ${surprise.effect === "heartbeat" ? "motion-safe:animate-[heartbeat_1.2s_ease-in-out_infinite]" : ""}`}
        >
          {surprise.emoji}
        </span>
        <p className="text-sm font-semibold text-brand-text">{t("week", { week: surprise.week })}</p>
        <h2 id="surprise-title" className="text-3xl font-bold">
          {render(surprise.title)}
        </h2>
        <p className="text-lg">{render(surprise.text)}</p>
        <Button onClick={onClose} className="mt-4 w-full">
          {t("close")}
        </Button>
      </div>
    </dialog>
  );
}
