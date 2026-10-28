import {
  formatLocalDate,
  lmpFromInput,
  parseLocalDate,
  validateLmp,
} from "@/lib/pregnancy";
import type { CalendarDate, Pregnancy } from "@/lib/storage/types";

export type DueDateUpdateError = "invalidDate" | "inFuture" | "tooFarInPast" | "unchanged";

export type DueDateUpdate =
  | { ok: true; pregnancy: Pregnancy }
  | { ok: false; error: DueDateUpdateError };

/**
 * A new due date (e.g. after an ultrasound) moves day 0 with it and is added to the history.
 * `method` and `inputDate` keep what was entered at onboarding.
 */
export function updateDueDate(
  pregnancy: Pregnancy,
  newDueDate: CalendarDate,
  today: Date,
  now: Date,
): DueDateUpdate {
  let lmpDate: Date;
  try {
    lmpDate = lmpFromInput("due", parseLocalDate(newDueDate));
  } catch {
    return { ok: false, error: "invalidDate" };
  }
  const validation = validateLmp(lmpDate, today);
  if (!validation.valid) return { ok: false, error: validation.reason };
  if (newDueDate === pregnancy.dueDate) return { ok: false, error: "unchanged" };

  return {
    ok: true,
    pregnancy: {
      ...pregnancy,
      lmpDate: formatLocalDate(lmpDate),
      dueDate: newDueDate,
      dueDateHistory: [
        ...pregnancy.dueDateHistory,
        { dueDate: newDueDate, changedAt: now.toISOString() },
      ],
    },
  };
}
