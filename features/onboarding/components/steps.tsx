"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { TextField } from "@/components/ui/TextField";
import {
  MAX_BABIES,
  MAX_NAME_LENGTH,
  validateInputDate,
  type BabyAnswer,
} from "@/features/onboarding/onboarding";
import { formatLocalDate, getInputDateRange, type CalculationMethod } from "@/lib/pregnancy";
import type { BabySex, Role } from "@/lib/storage/types";
import { StepLayout } from "./StepLayout";

/** Navigation props every data step passes through to StepLayout. */
export interface StepNav {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
}

export function RoleStep({ role, onChange, ...nav }: StepNav & {
  role: Role | null;
  onChange: (role: Role) => void;
}) {
  const t = useTranslations("onboarding.role");
  return (
    <StepLayout title={t("title")} nextDisabled={!role} {...nav}>
      <ChoiceGroup
        legend={t("title")}
        hideLegend
        value={role}
        onChange={onChange}
        options={[
          { value: "pregnant", label: t("pregnant") },
          { value: "partner", label: t("partner") },
        ]}
      />
    </StepLayout>
  );
}

export function NamesStep({ name, partnerName, onChange, onNext, ...nav }: StepNav & {
  name: string;
  partnerName: string;
  onChange: (names: { name?: string; partnerName?: string }) => void;
}) {
  const t = useTranslations();
  const [error, setError] = useState<string>();

  const handleNext = () => {
    if (!name.trim()) {
      setError(t("onboarding.names.nameRequired"));
      return;
    }
    onNext();
  };

  return (
    <StepLayout title={t("onboarding.names.title")} onNext={handleNext} {...nav}>
      <TextField
        label={t("onboarding.names.name")}
        value={name}
        onChange={(event) => {
          setError(undefined);
          onChange({ name: event.target.value });
        }}
        error={error}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="given-name"
        required
      />
      <TextField
        label={t("onboarding.names.partnerName")}
        hint={t("common.optional")}
        value={partnerName}
        onChange={(event) => onChange({ partnerName: event.target.value })}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="off"
      />
    </StepLayout>
  );
}

const methods: CalculationMethod[] = ["lmp", "due", "ivf5", "ivf3"];

export function DateStep({ method, inputDate, onChange, onNext, ...nav }: StepNav & {
  method: CalculationMethod;
  inputDate: string;
  onChange: (date: { method?: CalculationMethod; inputDate?: string }) => void;
}) {
  const t = useTranslations("onboarding.date");
  const [today] = useState(() => new Date());
  const [error, setError] = useState<string>();
  const range = getInputDateRange(method, today);

  const handleNext = () => {
    const validation = validateInputDate(method, inputDate, today);
    if (!validation.valid) {
      setError(t(`errors.${validation.reason}`));
      return;
    }
    onNext();
  };

  return (
    <StepLayout title={t("title")} onNext={handleNext} {...nav}>
      <ChoiceGroup
        legend={t("method")}
        value={method}
        onChange={(value) => {
          setError(undefined);
          onChange({ method: value });
        }}
        options={methods.map((value) => ({ value, label: t(`methods.${value}`) }))}
      />
      <TextField
        type="date"
        label={t(`dateLabel.${method}`)}
        value={inputDate}
        min={formatLocalDate(range.min)}
        max={formatLocalDate(range.max)}
        onChange={(event) => {
          setError(undefined);
          onChange({ inputDate: event.target.value });
        }}
        error={error}
        required
      />
    </StepLayout>
  );
}

type CountChoice = "1" | "2" | "more";

const countChoiceOf = (count: number): CountChoice =>
  count === 1 ? "1" : count === 2 ? "2" : "more";

const countOfChoice: Record<CountChoice, number> = { "1": 1, "2": 2, more: 3 };

const sexes: BabySex[] = ["unknown", "boy", "girl"];

const emptyBaby: BabyAnswer = { sex: "unknown", name: "" };

export function BabiesStep({ babies, onChange, saving, error, ...nav }: StepNav & {
  babies: BabyAnswer[];
  onChange: (babies: BabyAnswer[]) => void;
  saving: boolean;
  error?: string;
}) {
  const t = useTranslations("onboarding.babies");
  const tCommon = useTranslations("common");
  const count = babies.length;

  const setCount = (newCount: number) =>
    onChange(Array.from({ length: newCount }, (_, i) => babies[i] ?? emptyBaby));

  const updateBaby = (index: number, patch: Partial<BabyAnswer>) =>
    onChange(babies.map((baby, i) => (i === index ? { ...baby, ...patch } : baby)));

  return (
    <StepLayout title={t("title")} nextLabel={t("save")} nextDisabled={saving} {...nav}>
      <ChoiceGroup
        legend={t("count")}
        hideLegend
        value={countChoiceOf(count)}
        onChange={(choice) => setCount(countOfChoice[choice])}
        options={[
          { value: "1", label: t("single") },
          { value: "2", label: t("twins") },
          { value: "more", label: t("more") },
        ]}
      />

      {count >= 3 && (
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold">{t("exactCount")}</span>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              aria-label={t("decrease")}
              disabled={count <= 3}
              onClick={() => setCount(count - 1)}
              className="px-0"
            >
              −
            </Button>
            <output aria-live="polite" className="w-6 text-center text-xl font-semibold">
              {count}
            </output>
            <Button
              variant="secondary"
              aria-label={t("increase")}
              disabled={count >= MAX_BABIES}
              onClick={() => setCount(count + 1)}
              className="px-0"
            >
              +
            </Button>
          </div>
        </div>
      )}

      {babies.map((baby, index) => (
        <Card key={index} className="flex flex-col gap-4">
          {count > 1 && <h2 className="font-semibold">{t("baby", { number: index + 1 })}</h2>}
          <ChoiceGroup
            legend={t("sex")}
            inline
            value={baby.sex}
            onChange={(sex) => updateBaby(index, { sex })}
            options={sexes.map((value) => ({ value, label: t(`sexes.${value}`) }))}
          />
          <TextField
            label={t("name")}
            hint={tCommon("optional")}
            value={baby.name}
            onChange={(event) => updateBaby(index, { name: event.target.value })}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="off"
          />
        </Card>
      ))}

      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </StepLayout>
  );
}
