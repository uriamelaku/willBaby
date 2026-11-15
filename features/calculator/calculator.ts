import { findPregnancyStatus, parseLocalDate, type PregnancyStatus } from "@/lib/pregnancy";

export type DateCalculation =
  | { kind: "result"; status: PregnancyStatus }
  | { kind: "invalidDate" | "beforeStart" | "afterEnd" };

/** The pregnancy week on `targetDate` for a pregnancy that started (day 0) on `lmpDate`. */
export function calculateWeekOn(lmpDate: string, targetDate: string): DateCalculation {
  let lmp: Date;
  let target: Date;
  try {
    lmp = parseLocalDate(lmpDate);
    target = parseLocalDate(targetDate);
  } catch {
    return { kind: "invalidDate" };
  }
  const status = findPregnancyStatus(lmp, target);
  if (status) return { kind: "result", status };
  return { kind: target < lmp ? "beforeStart" : "afterEnd" };
}
