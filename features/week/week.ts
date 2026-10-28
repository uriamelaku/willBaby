import type { PregnancyStatus } from "@/lib/pregnancy";

/**
 * Weekly summaries open up as the pregnancy gets there: past weeks and the current one only.
 * Without a status (more than 300 days since day 0) every week is open.
 */
export const isWeekOpen = (week: number, status: PregnancyStatus | null) =>
  status === null || week <= status.contentWeek;

/** Days until a future week starts (content week n starts on day (n - 1) * 7). */
export const daysUntilWeek = (week: number, status: PregnancyStatus) =>
  Math.max((week - 1) * 7 - status.daysPregnant, 0);
