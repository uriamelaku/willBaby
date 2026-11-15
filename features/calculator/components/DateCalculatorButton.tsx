"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CalculatorIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { calculateWeekOn } from "@/features/calculator/calculator";
import { daysLeftStatus } from "@/features/today/today";
import { formatLocalDate } from "@/lib/pregnancy";

/**
 * A small button on Today that opens the date calculator: which pregnancy week falls on a given
 * date. Day 0 starts as the saved one and can be changed for the calculation only (nothing is saved).
 */
export function DateCalculatorButton({ lmpDate, today }: { lmpDate: string; today: Date }) {
  const t = useTranslations("calculator");
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        className="absolute end-1.5 bottom-1.5 flex size-11 items-center justify-center rounded-full text-brand-text"
      >
        <CalculatorIcon />
      </button>
      <dialog
        ref={ref}
        aria-labelledby="date-calculator-title"
        onClose={() => setOpen(false)}
        className="m-auto w-[min(90vw,24rem)] rounded-card bg-card p-6 text-text backdrop:bg-black/40"
      >
        {/* Mounted only while open, so it starts from the saved day 0 and today every time. */}
        {open && <Calculator lmpDate={lmpDate} today={today} onClose={() => setOpen(false)} />}
      </dialog>
    </>
  );
}

function Calculator({ lmpDate, today, onClose }: { lmpDate: string; today: Date; onClose: () => void }) {
  const t = useTranslations("calculator");
  const [start, setStart] = useState(lmpDate);
  const [target, setTarget] = useState(() => formatLocalDate(today));
  const result = calculateWeekOn(start, target);

  return (
    <div className="flex flex-col gap-4">
      <h2 id="date-calculator-title" className="text-xl font-semibold">
        {t("title")}
      </h2>
      <TextField
        type="date"
        label={t("start")}
        hint={start === lmpDate ? t("startHint") : undefined}
        value={start}
        onChange={(event) => setStart(event.target.value)}
      />
      <TextField type="date" label={t("date")} value={target} onChange={(event) => setTarget(event.target.value)} />
      <div aria-live="polite" className="rounded-2xl bg-peach-soft px-4 py-3">
        {result.kind === "result" ? (
          <>
            <p className="text-lg font-bold">
              {t("week", { weekAndDay: `${result.status.week}+${result.status.dayOfWeek}` })}
            </p>
            <p className="text-sm">
              {t("contentWeek", { week: result.status.contentWeek, trimester: result.status.trimester })}
            </p>
            <p className="text-sm text-muted">
              {t("dueDate", {
                status: daysLeftStatus(result.status.daysLeft),
                days: Math.abs(result.status.daysLeft),
              })}
            </p>
          </>
        ) : (
          <p className="text-sm">{t(`errors.${result.kind}`)}</p>
        )}
      </div>
      <Button variant="secondary" onClick={onClose}>
        {t("close")}
      </Button>
    </div>
  );
}
