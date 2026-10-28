"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import {
  MAX_JOURNAL_TEXT,
  validateJournalInput,
  type JournalInput,
  type JournalInputError,
} from "@/features/journal/journal";
import { formatLocalDate } from "@/lib/pregnancy";
import type { CalendarDate } from "@/lib/storage/types";
import { MoodPicker } from "./MoodPicker";

export function JournalForm({ initial, lmpDate, onSave, onCancel }: {
  initial?: JournalInput;
  lmpDate: CalendarDate;
  onSave: (input: JournalInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations();
  const [today] = useState(() => new Date());
  const [input, setInput] = useState<JournalInput>(
    initial ?? { date: formatLocalDate(today), text: "" },
  );
  const [error, setError] = useState<JournalInputError>();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const update = (patch: Partial<JournalInput>) => {
    setError(undefined);
    setInput((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateJournalInput(input, lmpDate, today);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    try {
      await onSave(input);
    } catch (saveError) {
      console.error("Saving the journal entry failed", saveError);
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          type="date"
          label={t("journal.date")}
          value={input.date}
          min={lmpDate}
          max={formatLocalDate(today)}
          onChange={(event) => update({ date: event.target.value })}
          error={error === "invalidDate" ? t("journal.errors.invalidDate") : undefined}
        />
        <MoodPicker value={input.mood} onChange={(mood) => update({ mood })} />
        <TextArea
          label={t("journal.text")}
          value={input.text}
          maxLength={MAX_JOURNAL_TEXT}
          onChange={(event) => update({ text: event.target.value })}
        />
        {error === "empty" && (
          <p role="alert" className="text-sm text-danger">
            {t("journal.errors.empty")}
          </p>
        )}
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
