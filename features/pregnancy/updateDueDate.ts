import {
  dueDateFromLmp,
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

/** Which date the user corrects: the due date (e.g. after an ultrasound) or the last period. */
export type DateUpdateBy = "due" | "lmp";

/**
 * A corrected due date or last-period date moves day 0 and the due date together, and the new
 * due date is added to the history. `method` and `inputDate` keep what was entered at onboarding.
 */
export function updateDueDate(
  pregnancy: Pregnancy,
  date: CalendarDate,
  today: Date,
  now: Date,
  by: DateUpdateBy = "due",
): DueDateUpdate {
  let lmpDate: Date;
  try {
    lmpDate = lmpFromInput(by, parseLocalDate(date));
  } catch {
    return { ok: false, error: "invalidDate" };
  }
  const newDueDate = formatLocalDate(dueDateFromLmp(lmpDate));
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
