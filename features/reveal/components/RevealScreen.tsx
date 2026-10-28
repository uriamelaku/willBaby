"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import {
  applyReveal,
  isRevealReady,
  revealResult,
  unrevealedBabies,
  type KnownSex,
} from "@/features/reveal/reveal";
import { SurpriseEffect } from "@/features/surprises/components/SurpriseEffect";
import { storage } from "@/lib/storage";
import type { Baby } from "@/lib/storage/types";

const SEXES: KnownSex[] = ["girl", "boy"];

export function RevealScreen() {
  const state = usePregnancy();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      {state.kind === "error" && <StorageError />}
      {state.kind === "ready" && <Reveal data={state.data} />}
    </main>
  );
}

function BackLink() {
  const t = useTranslations("reveal");
  return (
    <Link href="/today" className="flex min-h-11 items-center justify-center rounded-full bg-brand px-6 font-semibold text-on-brand">
      {t("back")}
    </Link>
  );
}

function Reveal({ data }: { data: PregnancyData }) {
  const t = useTranslations("reveal");
  const [hidden] = useState(() => unrevealedBabies(data.babies));
  const [choices, setChoices] = useState<Partial<Record<string, KnownSex>>>({});
  const [step, setStep] = useState<"choose" | "ready" | "revealed">("choose");
  const [revealed, setRevealed] = useState<Baby[]>(data.babies);
  const [saveFailed, setSaveFailed] = useState(false);
  const multiple = data.babies.length > 1;

  if (hidden.length === 0 && step !== "revealed") {
    const result = revealResult(data.babies);
    return (
      <div className="flex flex-1 flex-col justify-center gap-6 text-center">
        <h1 className="text-3xl font-bold">{t("alreadyTitle")}</h1>
        {result && <p className="text-xl">{t(`result.${result}`)}</p>}
        <BackLink />
      </div>
    );
  }

  const reveal = async () => {
    const updated = applyReveal(data.babies, choices, new Date());
    try {
      for (const baby of updated) await storage.save("babies", baby);
      setRevealed(data.babies.map((baby) => updated.find((u) => u.id === baby.id) ?? baby));
      setSaveFailed(false);
      setStep("revealed");
    } catch (error) {
      console.error("Saving the revealed sex failed", error);
      setSaveFailed(true);
    }
  };

  if (step === "choose") {
    return (
      <form
        className="flex flex-1 flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          setStep("ready");
        }}
      >
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-muted">{t("secretIntro")}</p>
        {hidden.map((baby) => (
          <ChoiceGroup
            key={baby.id}
            legend={multiple ? t("babyLegend", { number: baby.index + 1 }) : t("singleLegend")}
            inline
            value={choices[baby.id] ?? null}
            onChange={(sex) => setChoices((current) => ({ ...current, [baby.id]: sex }))}
            options={SEXES.map((value) => ({ value, label: t(`sexes.${value}`) }))}
          />
        ))}
        <div className="mt-auto flex gap-3">
          <Link href="/today" className="flex min-h-11 items-center rounded-full border border-text/20 bg-card px-6">
            {t("cancel")}
          </Link>
          <Button type="submit" disabled={!isRevealReady(data.babies, choices)} className="flex-1">
            {t("ready")}
          </Button>
        </div>
      </form>
    );
  }

  if (step === "ready") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="text-xl font-semibold">{t("gather")}</p>
        <button
          type="button"
          onClick={reveal}
          className="flex size-56 flex-col items-center justify-center gap-2 rounded-full bg-sun-soft text-sun-text shadow-hero transition active:scale-95 motion-safe:animate-pulse motion-reduce:transition-none"
        >
          <span aria-hidden className="text-8xl">
            🎁
          </span>
          <span className="text-lg font-semibold">{t("tap")}</span>
        </button>
        {saveFailed && <StorageError />}
      </div>
    );
  }

  const result = revealResult(revealed);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <SurpriseEffect effect="confetti" />
      <span aria-hidden className="text-8xl">
        🎉
      </span>
      {result && (
        <h1 className="text-4xl font-bold" aria-live="polite">
          {t(`result.${result}`)}
        </h1>
      )}
      <p className="text-muted">{t("wording")}</p>
      <BackLink />
    </div>
  );
}
