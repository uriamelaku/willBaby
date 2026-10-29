"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { Screen, StorageError } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  emptyAppointmentInput,
  formFromLink,
  sortAppointments,
  testTiming,
  toAppointmentInput,
  toAppointmentRecord,
  type AppointmentInput,
} from "@/features/appointments/appointments";
import { usePregnancy, type PregnancyData } from "@/features/pregnancy/usePregnancy";
import { getMedicalTests } from "@/lib/content";
import { findPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";
import { storage } from "@/lib/storage";
import type { Appointment } from "@/lib/storage/types";
import { useRecords } from "@/lib/storage/useRecords";
import { AppointmentForm } from "./AppointmentForm";
import { AppointmentSummary } from "./AppointmentItem";

const timingStyles = {
  now: "bg-accent/30 font-semibold",
  upcoming: "bg-text/10",
  past: "bg-bg text-muted",
} as const;

export function AppointmentsScreen() {
  const t = useTranslations("appointments");
  const state = usePregnancy();
  return (
    <Screen>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {state.kind === "error" && <StorageError />}
      {state.kind === "ready" && <TestsAndAppointments data={state.data} />}
      <MedicalDisclaimer />
    </Screen>
  );
}

interface Editing {
  appointment?: Appointment;
  input: AppointmentInput;
}

function TestsAndAppointments({ data }: { data: PregnancyData }) {
  const t = useTranslations();
  const { records, failed, reload } = useRecords("appointments");
  const [today] = useState(() => new Date());
  const query = useSearchParams();
  const router = useRouter();
  // undefined until the user opens or closes a form: until then a link from Today decides.
  const [chosen, setChosen] = useState<Editing | null>();
  const [deleting, setDeleting] = useState<Appointment | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const week = findPregnancyStatus(parseLocalDate(data.pregnancy.lmpDate), today)?.contentWeek;

  const run = async (action: () => Promise<unknown>, description: string) => {
    try {
      await action();
      setActionFailed(false);
      await reload();
    } catch (error) {
      console.error(description, error);
      setActionFailed(true);
    }
  };

  const editing =
    chosen !== undefined ? chosen : records && formFromLink(new URLSearchParams(query), records, getMedicalTests());

  const setEditing = (next: Editing | null) => {
    setChosen(next);
    // Drop ?book= / ?edit= so a reload does not reopen the form.
    if (query.size > 0) router.replace("/tools/appointments");
  };

  const save = async (input: AppointmentInput) => {
    await storage.save("appointments", toAppointmentRecord(input, editing?.appointment));
    setEditing(null);
    await reload();
  };

  const toggleDone = (appointment: Appointment) =>
    run(
      () => storage.save("appointments", { ...appointment, done: !appointment.done }),
      "Updating the appointment failed",
    );

  const confirmDelete = async () => {
    if (deleting) {
      await run(() => storage.remove("appointments", deleting.id), "Deleting the appointment failed");
    }
    setDeleting(null);
  };

  const book = (input: Partial<AppointmentInput>) => {
    setEditing({ input: { ...emptyAppointmentInput, ...input } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (failed) return <StorageError />;
  if (!records) return null;

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t("appointments.mine")}</h2>
        {editing ? (
          <AppointmentForm
            key={editing.appointment?.id ?? editing.input.linkedTestId ?? "new"}
            initial={editing.input}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <Button onClick={() => book({})}>{t("appointments.new")}</Button>
        )}
        {actionFailed && <StorageError />}
        {records.length === 0 && !editing && <p className="text-muted">{t("appointments.empty")}</p>}
        <ul className="flex flex-col gap-3">
          {sortAppointments(records).map((appointment) => (
            <li key={appointment.id}>
              <Card className="flex flex-col gap-3">
                <AppointmentSummary appointment={appointment} />
                {appointment.notes && <p className="whitespace-pre-wrap text-sm">{appointment.notes}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 pe-2">
                    <input
                      type="checkbox"
                      checked={appointment.done}
                      onChange={() => toggleDone(appointment)}
                      className="size-5 accent-brand"
                    />
                    {t("appointments.done")}
                  </label>
                  <Button
                    variant="secondary"
                    className="text-sm"
                    onClick={() =>
                      setEditing({ appointment, input: toAppointmentInput(appointment) })
                    }
                  >
                    {t("common.edit")}
                  </Button>
                  <Button variant="secondary" className="text-sm" onClick={() => setDeleting(appointment)}>
                    {t("common.delete")}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t("appointments.testsTitle")}</h2>
        <p className="text-sm text-muted">{t("appointments.testsIntro")}</p>
        <ul className="flex flex-col gap-3">
          {getMedicalTests().map((test) => {
            const timing = week ? testTiming(test, week) : "past";
            return (
              <li key={test.id}>
                <Card className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{test.name}</h3>
                      <p className="text-sm text-muted">
                        {t("appointments.weeks", { from: test.weekFrom, to: test.weekTo })}
                        {test.isOptional && ` · ${t("appointments.optional")}`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${timingStyles[timing]}`}>
                      {t(`appointments.timing.${timing}`)}
                    </span>
                  </div>
                  <p className="text-sm">{test.description}</p>
                  {timing !== "past" && (
                    <Button
                      variant="secondary"
                      className="self-start text-sm"
                      onClick={() => book({ title: test.name, linkedTestId: test.id })}
                    >
                      {t("appointments.book")}
                    </Button>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <ConfirmDialog
        open={deleting !== null}
        title={t("appointments.deleteTitle")}
        message={t("common.deleteForever")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
