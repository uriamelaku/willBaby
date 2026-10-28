"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { CheckIcon } from "@/components/icons";
import { upcomingItems, type UpcomingItem } from "@/features/today/today";
import { getMedicalTests } from "@/lib/content";
import { parseLocalDate } from "@/lib/pregnancy";
import { useRecords } from "@/lib/storage/useRecords";

/**
 * A small timeline of the next three tests and appointments. Booked appointments (mint, with a
 * check) look different from tests that still need an appointment (dashed, "to book").
 */
export function UpcomingCard({ daysPregnant, today }: { daysPregnant: number; today: Date }) {
  const t = useTranslations("today.upcoming");
  const format = useFormatter();
  const { records } = useRecords("appointments");

  if (!records) return null;
  const items = upcomingItems(records, getMedicalTests(), daysPregnant, today);

  const detail = (item: UpcomingItem) =>
    item.kind === "test"
      ? t("toBook")
      : [
          format.dateTime(parseLocalDate(item.date), { weekday: "short", day: "numeric", month: "numeric" }),
          item.time,
        ]
          .filter(Boolean)
          .join(" · ");

  const chip = (item: UpcomingItem) =>
    item.kind === "test" && item.daysUntil === 0 ? t("now") : t("inDays", { days: item.daysUntil });

  return (
    <section className="flex flex-col gap-3 rounded-card bg-card px-[18px] py-3.5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t("title")}</h2>
        <Link
          href="/tools/appointments"
          className="-my-3 flex min-h-11 items-center text-sm font-medium text-brand-text"
        >
          {t("all")}
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ol className="relative grid grid-cols-3 gap-2">
          <span aria-hidden className="absolute inset-x-4 top-[7px] h-0.5 bg-line" />
          {items.map((item) => {
            const booked = item.kind === "appointment";
            return (
              <li key={`${item.kind}-${item.id}`} className="relative flex flex-col items-start gap-1">
                {booked ? (
                  <span aria-hidden className="flex size-4 items-center justify-center rounded-full bg-mint ring-4 ring-mint-soft">
                    <CheckIcon className="size-3 text-white" />
                  </span>
                ) : (
                  <span aria-hidden className="size-4 rounded-full border-2 border-dashed border-brand bg-card" />
                )}
                <span className="line-clamp-1 text-sm leading-tight font-semibold">{item.title}</span>
                <span className={`text-[13px] ${booked ? "text-muted" : "font-semibold text-brand-text"}`}>
                  <span className="sr-only">{booked ? t("booked") : ""} </span>
                  {detail(item)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${booked ? "bg-mint-soft text-mint-text" : "bg-peach-soft text-peach-text"}`}
                >
                  {chip(item)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
