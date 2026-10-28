import type { MedicalTest } from "@/content/schema";
import { formatLocalDate, parseLocalDate } from "@/lib/pregnancy";
import type { Appointment, CalendarDate, RecordInput } from "@/lib/storage/types";

export const MAX_APPOINTMENT_TEXT = 200;
export const UPCOMING_LIMIT = 3;

/** Form values; empty strings mean "not set". */
export interface AppointmentInput {
  title: string;
  date: CalendarDate;
  time: string;
  place: string;
  linkedTestId: string;
  notes: string;
}

export type AppointmentInputError = "titleRequired" | "invalidDate" | "invalidTime";

export const emptyAppointmentInput: AppointmentInput = {
  title: "",
  date: "",
  time: "",
  place: "",
  linkedTestId: "",
  notes: "",
};

export function validateAppointmentInput(input: AppointmentInput): AppointmentInputError | null {
  if (!input.title.trim()) return "titleRequired";
  try {
    parseLocalDate(input.date);
  } catch {
    return "invalidDate";
  }
  if (input.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) return "invalidTime";
  return null;
}

const optional = (value: string) => value.trim() || undefined;

/** Record data for `storage.save`; keeps the id and done state when editing. Expects validated input. */
export function toAppointmentRecord(
  input: AppointmentInput,
  existing?: Appointment,
): RecordInput<"appointments"> {
  return {
    id: existing?.id,
    title: input.title.trim(),
    date: input.date,
    time: optional(input.time),
    place: optional(input.place),
    linkedTestId: optional(input.linkedTestId),
    notes: optional(input.notes),
    done: existing?.done ?? false,
  };
}

export const toAppointmentInput = (appointment: Appointment): AppointmentInput => ({
  title: appointment.title,
  date: appointment.date,
  time: appointment.time ?? "",
  place: appointment.place ?? "",
  linkedTestId: appointment.linkedTestId ?? "",
  notes: appointment.notes ?? "",
});

/** By date, then time; appointments without a time come last on their day. */
export const sortAppointments = (appointments: Appointment[]) =>
  [...appointments].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.time ?? "99").localeCompare(b.time ?? "99"),
  );

/** Not done, from today on, soonest first. */
export const upcomingAppointments = (
  appointments: Appointment[],
  today: Date,
  limit = UPCOMING_LIMIT,
) => {
  const todayDate = formatLocalDate(today);
  return sortAppointments(appointments)
    .filter((appointment) => !appointment.done && appointment.date >= todayDate)
    .slice(0, limit);
};

export type TestTiming = "past" | "now" | "upcoming";

export const testTiming = (test: MedicalTest, contentWeek: number): TestTiming =>
  contentWeek < test.weekFrom ? "upcoming" : contentWeek > test.weekTo ? "past" : "now";
