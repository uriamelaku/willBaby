"use client";

import { useFormatter, useTranslations } from "next-intl";
import { getMedicalTest } from "@/lib/content";
import { parseLocalDate } from "@/lib/pregnancy";
import type { Appointment } from "@/lib/storage/types";

/** Title, date, time and place of an appointment. */
export function AppointmentSummary({ appointment }: { appointment: Appointment }) {
  const t = useTranslations("appointments");
  const format = useFormatter();
  const linkedTest = appointment.linkedTestId && getMedicalTest(appointment.linkedTestId);
  const details = [
    format.dateTime(parseLocalDate(appointment.date), { weekday: "long", day: "numeric", month: "long" }),
    appointment.time,
    appointment.place,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-0.5">
      <p className={`font-semibold ${appointment.done ? "line-through text-muted" : ""}`}>
        {appointment.title}
      </p>
      <p className="text-sm text-muted">{details.join(" · ")}</p>
      {linkedTest && linkedTest.name !== appointment.title && (
        <p className="text-sm text-muted">
          {t("fields.linkedTest")}: {linkedTest.name}
        </p>
      )}
    </div>
  );
}
