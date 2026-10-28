"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { TextField } from "@/components/ui/TextField";
import {
  MAX_GUESSER_NAME,
  MAX_WEIGHT_GUESS,
  MIN_WEIGHT_GUESS,
  validateBetInput,
  type BetInput,
  type BetInputError,
} from "@/features/bets/bets";

export function BetForm({ initial, babiesCount, onSave, onCancel }: {
  initial: BetInput;
  babiesCount: number;
  onSave: (input: BetInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations();
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<BetInputError>();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const sexOptions: BetInput["sexGuess"][] = babiesCount > 1 ? ["", "boy", "girl", "mixed"] : ["", "boy", "girl"];

  const update = (patch: Partial<BetInput>) => {
    setError(undefined);
    setInput((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateBetInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    try {
      await onSave(input);
    } catch (saveError) {
      console.error("Saving the bet failed", saveError);
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label={t("bets.fields.guesserName")}
          value={input.guesserName}
          maxLength={MAX_GUESSER_NAME}
          onChange={(event) => update({ guesserName: event.target.value })}
          error={error === "nameRequired" ? t("bets.errors.nameRequired") : undefined}
        />
        <TextField
          type="date"
          label={t("bets.fields.date")}
          value={input.dueDateGuess}
          onChange={(event) => update({ dueDateGuess: event.target.value })}
          error={error === "invalidDate" ? t("bets.errors.invalidDate") : undefined}
        />
        <TextField
          type="number"
          inputMode="decimal"
          step="0.05"
          min={MIN_WEIGHT_GUESS}
          max={MAX_WEIGHT_GUESS}
          label={t("bets.fields.weight", { babiesCount })}
          value={input.weightGuess}
          onChange={(event) => update({ weightGuess: event.target.value })}
          error={error === "invalidWeight" ? t("bets.errors.invalidWeight") : undefined}
        />
        <ChoiceGroup
          legend={t("bets.fields.sex")}
          inline
          value={input.sexGuess}
          onChange={(sexGuess) => update({ sexGuess })}
          options={sexOptions.map((value) => ({ value, label: t(`bets.sexes.${value || "none"}`) }))}
        />
        <TextField
          label={`${t("bets.fields.name")} (${t("common.optional")})`}
          value={input.nameGuess}
          maxLength={MAX_GUESSER_NAME}
          onChange={(event) => update({ nameGuess: event.target.value })}
        />
        {saveFailed && <StorageError />}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
