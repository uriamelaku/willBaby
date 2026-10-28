import { differenceInCalendarDays } from "date-fns";
import type { MedicalTest } from "@/content/schema";
import { FULL_TERM_DAYS, formatLocalDate, parseLocalDate } from "@/lib/pregnancy";
import type { Appointment } from "@/lib/storage/types";

export type GreetingKey = "morning" | "noon" | "evening" | "night";

export function greetingFor(hour: number): GreetingKey {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "noon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

// Trimester ring: one circle split into three equal arcs with gaps (see docs/design/today-screen.md).
export const RING_RADIUS = 64;
export const RING_CENTER = 80;
export const RING_SEGMENT = 110;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
/** Start angle of each trimester arc, degrees clockwise from 3 o'clock. */
export const RING_STARTS = [-79.2, 40.8, 160.8] as const;
/** Day ranges of the trimesters, matching `trimesterForWeek` (weeks 0-13, 14-27, 28-40). */
const TRIMESTER_DAYS = [
  [0, 98],
  [98, 196],
  [196, FULL_TERM_DAYS],
] as const;

export function trimesterRing(daysPregnant: number) {
  const fills = TRIMESTER_DAYS.map(([from, to]) => {
    const fraction = Math.min(Math.max((daysPregnant - from) / (to - from), 0), 1);
    return fraction * RING_SEGMENT;
  });
  const current = Math.max(TRIMESTER_DAYS.findLastIndex(([from]) => daysPregnant >= from), 0);
  const angle = ((RING_STARTS[current] + (fills[current] / RING_CIRCUMFERENCE) * 360) * Math.PI) / 180;
  return {
    fills,
    gap: RING_CIRCUMFERENCE - RING_SEGMENT,
    dot: {
      x: RING_CENTER + RING_RADIUS * Math.cos(angle),
      y: RING_CENTER + RING_RADIUS * Math.sin(angle),
    },
  };
}

export type UpcomingItem =
  | { kind: "appointment"; id: string; title: string; date: string; time?: string; daysUntil: number }
  | { kind: "test"; id: string; title: string; week: number; daysUntil: number };

/**
 * The next appointments and tests, soonest first. A test shows until it has an appointment
 * (or its window has passed); one whose window is open now has daysUntil 0.
 */
export function upcomingItems(
  appointments: Appointment[],
  tests: MedicalTest[],
  daysPregnant: number,
  today: Date,
  limit = 3,
): UpcomingItem[] {
  const todayDate = formatLocalDate(today);
  const linkedTests = new Set(appointments.map((appointment) => appointment.linkedTestId));

  const fromAppointments: UpcomingItem[] = appointments
    .filter((appointment) => !appointment.done && appointment.date >= todayDate)
    .map((appointment) => ({
      kind: "appointment",
      id: appointment.id,
      title: appointment.title,
      date: appointment.date,
      time: appointment.time,
      daysUntil: differenceInCalendarDays(parseLocalDate(appointment.date), today),
    }));

  const fromTests: UpcomingItem[] = tests
    .filter((test) => !linkedTests.has(test.id) && daysPregnant < test.weekTo * 7)
    .map((test) => ({
      kind: "test",
      id: test.id,
      title: test.shortName ?? test.name,
      week: test.weekFrom,
      daysUntil: Math.max((test.weekFrom - 1) * 7 - daysPregnant, 0),
    }));

  return [...fromAppointments, ...fromTests]
    .sort((a, b) => a.daysUntil - b.daysUntil || (a.kind === "appointment" ? -1 : 1))
    .slice(0, limit);
}

/** From this content week the kick counter and contraction timer lead the Today shortcuts. */
export const LATE_SHORTCUTS_WEEK = 28;

export type ShortcutTool = "kicks" | "contractions" | "weight" | "hospitalBag" | "names" | "bets";

export const shortcutsFor = (contentWeek: number): ShortcutTool[] =>
  contentWeek >= LATE_SHORTCUTS_WEEK
    ? ["kicks", "contractions", "hospitalBag", "weight"]
    : ["weight", "names", "hospitalBag", "bets"];
