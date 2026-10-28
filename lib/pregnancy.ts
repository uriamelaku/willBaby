import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parse,
  startOfDay,
} from "date-fns";

// All dates are local calendar dates (midnight in the device's time zone), never UTC,
// so the pregnancy day changes at local midnight.

export type CalculationMethod = "lmp" | "due" | "ivf3" | "ivf5";

export const FULL_TERM_DAYS = 280;
export const MAX_PREGNANCY_DAYS = 300;
export const MAX_CONTENT_WEEK = 42;
/** Before this week, screens show gentle "still early" wording. */
export const EARLY_WEEKS = 4;

/** Days from LMP (day 0) to the date entered for each method. */
const INPUT_OFFSET_DAYS: Record<CalculationMethod, number> = {
  lmp: 0,
  due: FULL_TERM_DAYS,
  ivf3: 17,
  ivf5: 19,
};

export type Trimester = 1 | 2 | 3;

export interface PregnancyStatus {
  daysPregnant: number;
  /** Completed weeks: the "14" in "14+3". */
  week: number;
  /** Days into the current week, 0..6: the "3" in "14+3". */
  dayOfWeek: number;
  /** "The 15th week", clamped to 1..42 for content lookup. */
  contentWeek: number;
  /** Negative once the due date has passed. */
  daysLeft: number;
  /** 0..1 of full term. */
  progress: number;
  trimester: Trimester;
  dueDate: Date;
}

export type LmpValidation =
  | { valid: true }
  | { valid: false; reason: "invalidDate" | "inFuture" | "tooFarInPast" };

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function assertValidDate(date: Date): void {
  if (!isValid(date)) throw new RangeError("Invalid date");
}

/** Parses a `YYYY-MM-DD` string (e.g. from `<input type="date">`) as a local calendar date. */
export function parseLocalDate(value: string): Date {
  const date = LOCAL_DATE_PATTERN.test(value)
    ? parse(value, "yyyy-MM-dd", new Date())
    : new Date(NaN);
  if (!isValid(date)) {
    throw new RangeError(`Expected a valid YYYY-MM-DD date, got "${value}"`);
  }
  return date;
}

/** Formats a date as its local calendar date, `YYYY-MM-DD`. */
export function formatLocalDate(date: Date): string {
  assertValidDate(date);
  return format(date, "yyyy-MM-dd");
}

/** Converts any input method to day 0 (LMP). */
export function lmpFromInput(method: CalculationMethod, inputDate: Date): Date {
  assertValidDate(inputDate);
  return addDays(startOfDay(inputDate), -INPUT_OFFSET_DAYS[method]);
}

/** The input dates a method accepts, matching `validateLmp` (day 0 within 0..300 days before today). */
export function getInputDateRange(
  method: CalculationMethod,
  today: Date,
): { min: Date; max: Date } {
  assertValidDate(today);
  const offset = INPUT_OFFSET_DAYS[method];
  const day = startOfDay(today);
  return {
    min: addDays(day, offset - MAX_PREGNANCY_DAYS),
    max: addDays(day, offset),
  };
}

export function dueDateFromLmp(lmpDate: Date): Date {
  assertValidDate(lmpDate);
  return addDays(startOfDay(lmpDate), FULL_TERM_DAYS);
}

/** Day 0 must be 0..300 days before today. */
export function validateLmp(lmpDate: Date, today: Date): LmpValidation {
  if (!isValid(lmpDate) || !isValid(today)) {
    return { valid: false, reason: "invalidDate" };
  }
  const daysPregnant = differenceInCalendarDays(today, lmpDate);
  if (daysPregnant < 0) return { valid: false, reason: "inFuture" };
  if (daysPregnant > MAX_PREGNANCY_DAYS) {
    return { valid: false, reason: "tooFarInPast" };
  }
  return { valid: true };
}

function trimesterForWeek(week: number): Trimester {
  if (week < 14) return 1;
  if (week < 28) return 2;
  return 3;
}

/** Derives everything shown to the user from day 0. Expects a date that passed `validateLmp`. */
export function getPregnancyStatus(lmpDate: Date, today: Date): PregnancyStatus {
  const validation = validateLmp(lmpDate, today);
  if (!validation.valid) {
    throw new RangeError(`Invalid LMP date: ${validation.reason}`);
  }

  const daysPregnant = differenceInCalendarDays(today, lmpDate);
  const week = Math.floor(daysPregnant / 7);

  return {
    daysPregnant,
    week,
    dayOfWeek: daysPregnant % 7,
    contentWeek: clamp(week + 1, 1, MAX_CONTENT_WEEK),
    daysLeft: FULL_TERM_DAYS - daysPregnant,
    progress: clamp(daysPregnant / FULL_TERM_DAYS, 0, 1),
    trimester: trimesterForWeek(week),
    dueDate: dueDateFromLmp(lmpDate),
  };
}

/** Like `getPregnancyStatus`, but returns null when day 0 is out of range (e.g. long after the due date). */
export function findPregnancyStatus(lmpDate: Date, today: Date): PregnancyStatus | null {
  return validateLmp(lmpDate, today).valid ? getPregnancyStatus(lmpDate, today) : null;
}
