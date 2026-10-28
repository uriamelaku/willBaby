"use client";

import { useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { TextField } from "@/components/ui/TextField";
import {
  updateDueDate,
  type DateUpdateBy,
  type DueDateUpdateError,
} from "@/features/pregnancy/updateDueDate";
import { formatLocalDate, getInputDateRange, parseLocalDate } from "@/lib/pregnancy";
import { storage } from "@/lib/storage";
import type { Pregnancy } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";

/** Shows the due date and lets the user correct it, or the last period date (with history). */
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
  const [by, setBy] = useState<DateUpdateBy>("due");
  const [date, setDate] = useState(pregnancy.dueDate);
  const [error, setError] = useState<DueDateUpdateError>();
  const [saveFailed, setSaveFailed] = useState(false);
  const [today] = useState(() => new Date());
  const range = getInputDateRange(by, today);

  const close = () => {
    setEditing(false);
    setBy("due");
    setDate(pregnancy.dueDate);
    setError(undefined);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = updateDueDate(pregnancy, date, today, new Date(), by);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    try {
      await storage.save("pregnancy", result.pregnancy);
      setEditing(false);
      setBy("due");
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
      <ChoiceGroup
        legend={t("pregnancyDetails.updateBy")}
        inline
        value={by}
        onChange={(value) => {
          setBy(value);
          setDate(value === "due" ? pregnancy.dueDate : pregnancy.lmpDate);
          setError(undefined);
        }}
        options={(["due", "lmp"] as const).map((value) => ({ value, label: t(`pregnancyDetails.by.${value}`) }))}
      />
      <TextField
        type="date"
        label={t(by === "due" ? "pregnancyDetails.newDueDate" : "pregnancyDetails.newLmpDate")}
        hint={t(by === "due" ? "pregnancyDetails.updateHint" : "pregnancyDetails.lmpHint")}
        value={date}
        min={formatLocalDate(range.min)}
        max={formatLocalDate(range.max)}
        onChange={(event) => {
          setError(undefined);
          setDate(event.target.value);
        }}
        error={error && t(`pregnancyDetails.errors.${error}`)}
      />
      {saveFailed && <StorageError />}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={close}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" className="flex-1">
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
