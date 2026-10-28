"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { upcomingAppointments } from "@/features/appointments/appointments";
import { useRecords } from "@/lib/storage/useRecords";
import { AppointmentSummary } from "./AppointmentItem";

/** The next appointments, for the Today screen; hidden when there are none. */
export function UpcomingAppointments() {
  const t = useTranslations("appointments");
  const { records } = useRecords("appointments");
  const [today] = useState(() => new Date());
  const upcoming = records ? upcomingAppointments(records, today) : [];

  if (upcoming.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-brand-text">{t("upcoming")}</h2>
      <ul className="flex flex-col gap-3">
        {upcoming.map((appointment) => (
          <li key={appointment.id}>
            <AppointmentSummary appointment={appointment} />
          </li>
        ))}
      </ul>
      <Link href="/tools/appointments" className="flex min-h-11 items-center text-sm underline">
        {t("seeAll")}
      </Link>
    </Card>
  );
}
