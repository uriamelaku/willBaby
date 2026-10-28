import { findPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";
import type { CalendarDate, JournalEntry, Mood, RecordInput } from "@/lib/storage/types";

export const MAX_JOURNAL_TEXT = 2000;
export const MOODS: Mood[] = [1, 2, 3, 4, 5];

export interface JournalInput {
  date: CalendarDate;
  text: string;
  mood?: Mood;
}

export type JournalInputError = "empty" | "invalidDate";

/** Pregnancy content week (1..42) on a date, or null when the date is outside the pregnancy. */
const weekOn = (date: CalendarDate, lmpDate: CalendarDate) => {
  try {
    return findPregnancyStatus(parseLocalDate(lmpDate), parseLocalDate(date))?.contentWeek ?? null;
  } catch {
    return null;
  }
};

/** An entry needs text or a mood, on a date between day 0 and today. */
export function validateJournalInput(
  input: JournalInput,
  lmpDate: CalendarDate,
  today: Date,
): JournalInputError | null {
  if (!input.text.trim() && input.mood === undefined) return "empty";
  const week = weekOn(input.date, lmpDate);
  if (week === null || parseLocalDate(input.date) > today) return "invalidDate";
  return null;
}

/** Record data for `storage.save`; keeps the id (and tags) when editing. Expects validated input. */
export function toJournalRecord(
  input: JournalInput,
  lmpDate: CalendarDate,
  existing?: JournalEntry,
): RecordInput<"journal"> {
  return {
    id: existing?.id,
    date: input.date,
    week: weekOn(input.date, lmpDate) ?? 1,
    text: input.text.trim(),
    mood: input.mood,
    tags: existing?.tags ?? [],
  };
}

/** Newest first: by date, then by creation time. */
export const sortJournalEntries = (entries: JournalEntry[]) =>
  [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
