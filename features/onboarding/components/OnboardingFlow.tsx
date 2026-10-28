"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import {
  buildOnboardingRecords,
  hasCompletedOnboarding,
  saveOnboarding,
  type OnboardingAnswers,
  type OnboardingRecords,
} from "@/features/onboarding/onboarding";
import { storage } from "@/lib/storage";
import { requestPersistentStorage } from "@/lib/storage/persist";
import type { Role } from "@/lib/storage/types";
import { BabiesStep, DateStep, NamesStep, RoleStep } from "./steps";
import { WowStep } from "./WowStep";

type Draft = Omit<OnboardingAnswers, "role"> & { role: Role | null };

const initialDraft: Draft = {
  role: null,
  name: "",
  partnerName: "",
  method: "lmp",
  inputDate: "",
  babies: [{ sex: "unknown", name: "" }],
};

const steps = ["welcome", "role", "names", "date", "babies", "wow"] as const;
const DATA_STEPS = 4;

export function OnboardingFlow() {
  const t = useTranslations();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [saved, setSaved] = useState<OnboardingRecords | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");

  // Onboarding runs once; an existing pregnancy goes straight to Today.
  useEffect(() => {
    hasCompletedOnboarding(storage)
      .then((done) => {
        if (done) router.replace("/today");
      })
      .catch((error) => console.error("Reading storage failed", error));
  }, [router]);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const goNext = () => setStepIndex((index) => index + 1);
  const goBack = () => setStepIndex((index) => index - 1);
  const nav = { totalSteps: DATA_STEPS, onBack: goBack, onNext: goNext };

  const finish = async () => {
    setSaveState("saving");
    try {
      if (!draft.role) throw new Error("Onboarding finished without a role");
      const records = buildOnboardingRecords({ ...draft, role: draft.role }, new Date());
      await saveOnboarding(storage, records);
      await requestPersistentStorage();
      setSaved(records);
      setSaveState("idle");
      goNext();
    } catch (error) {
      console.error("Saving onboarding failed", error);
      setSaveState("error");
    }
  };

  const content = (() => {
    switch (steps[stepIndex]) {
      case "welcome":
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <Logo className="text-5xl" />
            <h1 className="text-3xl font-semibold">{t("onboarding.welcome.title")}</h1>
            <p className="text-lg">{t("onboarding.welcome.body")}</p>
            <Button onClick={goNext} className="mt-6 w-full">
              {t("onboarding.welcome.start")}
            </Button>
          </div>
        );
      case "role":
        return (
          <RoleStep {...nav} step={1} role={draft.role} onChange={(role) => update({ role })} />
        );
      case "names":
        return (
          <NamesStep
            {...nav}
            step={2}
            name={draft.name}
            partnerName={draft.partnerName}
            onChange={update}
          />
        );
      case "date":
        return (
          <DateStep
            {...nav}
            step={3}
            method={draft.method}
            inputDate={draft.inputDate}
            onChange={update}
          />
        );
      case "babies":
        return (
          <BabiesStep
            {...nav}
            step={4}
            onNext={finish}
            babies={draft.babies}
            onChange={(babies) => update({ babies })}
            saving={saveState === "saving"}
            error={saveState === "error" ? t("common.storageError") : undefined}
          />
        );
      case "wow":
        return (
          saved && (
            <WowStep records={saved} onContinue={() => router.replace("/today")} />
          )
        );
    }
  })();

  return <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">{content}</main>;
}
