"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import {
  MAX_APPOINTMENT_TEXT,
  validateAppointmentInput,
  type AppointmentInput,
  type AppointmentInputError,
} from "@/features/appointments/appointments";
import { getMedicalTests } from "@/lib/content";

export function AppointmentForm({ initial, onSave, onCancel }: {
  initial: AppointmentInput;
  onSave: (input: AppointmentInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations();
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<AppointmentInputError>();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const update = (patch: Partial<AppointmentInput>) => {
    setError(undefined);
    setInput((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateAppointmentInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    try {
      await onSave(input);
    } catch (saveError) {
      console.error("Saving the appointment failed", saveError);
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const errorText = (field: AppointmentInputError) =>
    error === field ? t(`appointments.errors.${field}`) : undefined;

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label={t("appointments.fields.title")}
          value={input.title}
          maxLength={MAX_APPOINTMENT_TEXT}
          onChange={(event) => update({ title: event.target.value })}
          error={errorText("titleRequired")}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            type="date"
            label={t("appointments.fields.date")}
            value={input.date}
            onChange={(event) => update({ date: event.target.value })}
            error={errorText("invalidDate")}
            required
          />
          <TextField
            type="time"
            label={t("appointments.fields.time")}
            hint={t("common.optional")}
            value={input.time}
            onChange={(event) => update({ time: event.target.value })}
            error={errorText("invalidTime")}
          />
        </div>
        <TextField
          label={t("appointments.fields.place")}
          hint={t("common.optional")}
          value={input.place}
          maxLength={MAX_APPOINTMENT_TEXT}
          onChange={(event) => update({ place: event.target.value })}
        />
        <SelectField
          label={t("appointments.fields.linkedTest")}
          value={input.linkedTestId}
          onChange={(event) => update({ linkedTestId: event.target.value })}
          options={[
            { value: "", label: t("appointments.fields.noTest") },
            ...getMedicalTests().map((test) => ({ value: test.id, label: test.name })),
          ]}
        />
        <TextArea
          label={t("appointments.fields.notes")}
          value={input.notes}
          rows={2}
          maxLength={MAX_APPOINTMENT_TEXT}
          onChange={(event) => update({ notes: event.target.value })}
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
