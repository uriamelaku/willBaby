"use client";

import { useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Screen, StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/TextField";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import {
  MAX_KG,
  MIN_KG,
  sortWeights,
  toWeightRecord,
  validateWeightInput,
  weightChange,
  weightChartPoints,
  type WeightInput,
  type WeightInputError,
} from "@/features/weight/weight";
import { formatLocalDate, parseLocalDate } from "@/lib/pregnancy";
import { storage } from "@/lib/storage";
import type { WeightEntry } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";
import { WeightChart } from "./WeightChart";

export function WeightScreen() {
  const t = useTranslations("weight");
  const state = usePregnancy();
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {state.kind === "error" && <StorageError />}
      {state.kind === "ready" && <WeightTracker data={state.data} />}
      <p className="mt-auto pt-4 text-center text-xs text-muted">{t("note")}</p>
    </Screen>
  );
}

function WeightTracker({ data }: { data: PregnancyData }) {
  const t = useTranslations();
  const format = useFormatter();
  const { records, failed, reload } = useRecords("weights");
  const [today] = useState(() => new Date());
  const [input, setInput] = useState<WeightInput>({ date: formatLocalDate(today), kg: "" });
  const [error, setError] = useState<WeightInputError>();
  const [actionFailed, setActionFailed] = useState(false);
  const [deleting, setDeleting] = useState<WeightEntry | null>(null);
  const lmpDate = data.pregnancy.lmpDate;

  const run = async (action: () => Promise<unknown>, description: string) => {
    try {
      await action();
      setActionFailed(false);
      await reload();
      return true;
    } catch (failure) {
      console.error(description, failure);
      setActionFailed(true);
      return false;
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateWeightInput(input, lmpDate, today);
    if (validationError) {
      setError(validationError);
      return;
    }
    const saved = await run(
      () => storage.save("weights", toWeightRecord(input, records ?? [])),
      "Saving the weight failed",
    );
    if (saved) setInput((current) => ({ ...current, kg: "" }));
  };

  const confirmDelete = async () => {
    if (deleting) await run(() => storage.remove("weights", deleting.id), "Deleting the weight failed");
    setDeleting(null);
  };

  if (failed) return <StorageError />;
  if (!records) return null;

  const change = weightChange(records);
  const update = (patch: Partial<WeightInput>) => {
    setError(undefined);
    setInput((current) => ({ ...current, ...patch }));
  };

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              type="date"
              label={t("weight.date")}
              value={input.date}
              min={lmpDate}
              max={formatLocalDate(today)}
              onChange={(event) => update({ date: event.target.value })}
              error={error === "invalidDate" ? t("weight.errors.invalidDate") : undefined}
            />
            <TextField
              type="number"
              inputMode="decimal"
              step="0.1"
              min={MIN_KG}
              max={MAX_KG}
              label={t("weight.kgLabel")}
              value={input.kg}
              onChange={(event) => update({ kg: event.target.value })}
              error={error === "invalidWeight" ? t("weight.errors.invalidWeight") : undefined}
            />
          </div>
          {actionFailed && <StorageError />}
          <Button type="submit">{t("common.save")}</Button>
        </form>
      </Card>

      {records.length === 0 ? (
        <p className="text-center text-muted">{t("weight.empty")}</p>
      ) : (
        <Card className="flex flex-col gap-3">
          {change !== null && (
            <p className="font-semibold">{t("weight.change", {
                change: Math.abs(change),
                direction: change > 0 ? "up" : change < 0 ? "down" : "same",
              })}</p>
          )}
          {records.length > 1 && <WeightChart points={weightChartPoints(records, lmpDate)} />}
          <ul className="flex flex-col">
            {sortWeights(records)
              .reverse()
              .map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 border-t border-text/10 py-1">
                  <span>{format.dateTime(parseLocalDate(entry.date), { dateStyle: "medium" })}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{t("weight.kg", { kg: entry.kg })}</span>
                    <Button
                      variant="secondary"
                      className="px-4 text-sm"
                      onClick={() => setDeleting(entry)}
                    >
                      {t("common.delete")}
                    </Button>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t("weight.deleteTitle")}
        message={t("common.deleteForever")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
