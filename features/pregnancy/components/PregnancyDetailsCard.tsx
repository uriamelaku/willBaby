"use client";

import { useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { updateDueDate, type DueDateUpdateError } from "@/features/pregnancy/updateDueDate";
import { formatLocalDate, getInputDateRange, parseLocalDate } from "@/lib/pregnancy";
import { storage } from "@/lib/storage";
import type { Pregnancy } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";

/** Shows the due date and lets the user update it (with history), e.g. after an ultrasound. */
export function PregnancyDetailsCard() {
  const t = useTranslations("pregnancyDetails");
  const format = useFormatter();
  const { records, failed, reload } = useRecords("pregnancy");
  const pregnancy = records?.[0];

  if (failed) return <StorageError />;
  if (!pregnancy) return null;

  const formatDate = (date: string) => format.dateTime(parseLocalDate(date), { dateStyle: "long" });

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">{t("title")}</h2>
      <p>{t("dueDate", { date: formatDate(pregnancy.dueDate) })}</p>
      <p className="text-sm text-muted">{t("lmpDate", { date: formatDate(pregnancy.lmpDate) })}</p>
      <DueDateEditor pregnancy={pregnancy} onSaved={reload} />
      {pregnancy.dueDateHistory.length > 1 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{t("history")}</h3>
          <ul className="text-sm text-muted">
            {pregnancy.dueDateHistory.map((change) => (
              <li key={change.changedAt}>
                {t("historyItem", {
                  dueDate: formatDate(change.dueDate),
                  changedAt: format.dateTime(new Date(change.changedAt), { dateStyle: "medium" }),
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function DueDateEditor({ pregnancy, onSaved }: { pregnancy: Pregnancy; onSaved: () => Promise<void> }) {
  const t = useTranslations();
  const [editing, setEditing] = useState(false);
  const [dueDate, setDueDate] = useState(pregnancy.dueDate);
  const [error, setError] = useState<DueDateUpdateError>();
  const [saveFailed, setSaveFailed] = useState(false);
  const [today] = useState(() => new Date());
  const range = getInputDateRange("due", today);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = updateDueDate(pregnancy, dueDate, today, new Date());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    try {
      await storage.save("pregnancy", result.pregnancy);
      setEditing(false);
      setSaveFailed(false);
      await onSaved();
    } catch (saveError) {
      console.error("Updating the due date failed", saveError);
      setSaveFailed(true);
    }
  };

  if (!editing) {
    return (
      <Button variant="secondary" onClick={() => setEditing(true)}>
        {t("pregnancyDetails.update")}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <TextField
        type="date"
        label={t("pregnancyDetails.newDueDate")}
        hint={t("pregnancyDetails.updateHint")}
        value={dueDate}
        min={formatLocalDate(range.min)}
        max={formatLocalDate(range.max)}
        onChange={(event) => {
          setError(undefined);
          setDueDate(event.target.value);
        }}
        error={error && t(`pregnancyDetails.errors.${error}`)}
      />
      {saveFailed && <StorageError />}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setEditing(false);
            setDueDate(pregnancy.dueDate);
            setError(undefined);
          }}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" className="flex-1">
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
