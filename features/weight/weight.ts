import { differenceInCalendarDays } from "date-fns";
import { parseLocalDate } from "@/lib/pregnancy";
import type { CalendarDate, RecordInput, WeightEntry } from "@/lib/storage/types";

export const MIN_KG = 30;
export const MAX_KG = 250;

/** Form values; `kg` is the raw text of the number field. */
export interface WeightInput {
  date: CalendarDate;
  kg: string;
}

export type WeightInputError = "invalidDate" | "invalidWeight";

/** A weight needs a date between day 0 and today and a plausible number of kilograms. */
export function validateWeightInput(
  input: WeightInput,
  lmpDate: CalendarDate,
  today: Date,
): WeightInputError | null {
  let date: Date;
  try {
    date = parseLocalDate(input.date);
  } catch {
    return "invalidDate";
  }
  if (date < parseLocalDate(lmpDate) || date > today) return "invalidDate";
  const kg = Number(input.kg);
  if (!input.kg.trim() || !Number.isFinite(kg) || kg < MIN_KG || kg > MAX_KG) return "invalidWeight";
  return null;
}

/** Record data for `storage.save`: one weight per date, so a second one for a date replaces it. */
export function toWeightRecord(input: WeightInput, entries: WeightEntry[]): RecordInput<"weights"> {
  return {
    id: entries.find((entry) => entry.date === input.date)?.id,
    date: input.date,
    kg: Math.round(Number(input.kg) * 10) / 10,
  };
}

/** Oldest first. */
export const sortWeights = (entries: WeightEntry[]) =>
  [...entries].sort((a, b) => a.date.localeCompare(b.date));

/** Change from the first to the latest weight, in kg (rounded to 0.1). */
export function weightChange(entries: WeightEntry[]): number | null {
  const sorted = sortWeights(entries);
  if (sorted.length < 2) return null;
  return Math.round((sorted.at(-1)!.kg - sorted[0].kg) * 10) / 10;
}

/** Chart points: pregnancy week (with a fraction for the day) against kg. */
export const weightChartPoints = (entries: WeightEntry[], lmpDate: CalendarDate) =>
  sortWeights(entries).map((entry) => ({
    week: Math.round((differenceInCalendarDays(parseLocalDate(entry.date), parseLocalDate(lmpDate)) / 7) * 10) / 10,
    kg: entry.kg,
  }));
