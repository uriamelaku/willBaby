import { describe, expect, it } from "vitest";
import {
  bookTestHref,
  editAppointmentHref,
  emptyAppointmentInput,
  formFromLink,
  sortAppointments,
  testTiming,
  toAppointmentInput,
  toAppointmentRecord,
  upcomingAppointments,
  validateAppointmentInput,
} from "@/features/appointments/appointments";
import type { MedicalTest } from "@/content/schema";
import type { Appointment } from "@/lib/storage/types";

const input = { ...emptyAppointmentInput, title: "סקירה מאוחרת", date: "2026-06-10" };

describe("validateAppointmentInput", () => {
  it("accepts a title and date, with an optional time", () => {
    expect(validateAppointmentInput(input)).toBeNull();
    expect(validateAppointmentInput({ ...input, time: "08:30" })).toBeNull();
  });

  it("requires a title and a valid date", () => {
    expect(validateAppointmentInput({ ...input, title: "  " })).toBe("titleRequired");
    expect(validateAppointmentInput({ ...input, date: "" })).toBe("invalidDate");
    expect(validateAppointmentInput({ ...input, date: "2026-02-30" })).toBe("invalidDate");
  });

  it.each(["24:00", "8:30", "12:60"])("rejects time %s", (time) => {
    expect(validateAppointmentInput({ ...input, time })).toBe("invalidTime");
  });
});

describe("toAppointmentRecord", () => {
  it("trims and drops empty optional fields", () => {
    expect(toAppointmentRecord({ ...input, place: " קופת חולים ", notes: " " })).toEqual({
      id: undefined,
      title: "סקירה מאוחרת",
      date: "2026-06-10",
      time: undefined,
      place: "קופת חולים",
      linkedTestId: undefined,
      notes: undefined,
      done: false,
    });
  });

  it("keeps id and done when editing, and round-trips to form input", () => {
    const existing = { ...toAppointmentRecord(input), id: "a", done: true } as Appointment;
    const edited = toAppointmentRecord(toAppointmentInput(existing), existing);
    expect(edited).toMatchObject({ id: "a", done: true, title: "סקירה מאוחרת" });
  });
});

const appointment = (id: string, date: string, time?: string, done = false) =>
  ({ id, date, time, done }) as Appointment;

describe("sorting and upcoming", () => {
  const list = [
    appointment("c", "2026-06-11"),
    appointment("b", "2026-06-10"),
    appointment("a", "2026-06-10", "09:00"),
    appointment("past", "2026-06-01"),
    appointment("done", "2026-06-12", undefined, true),
    appointment("later", "2026-07-01"),
  ];

  it("sorts by date, then time, untimed last", () => {
    expect(sortAppointments(list).map((a) => a.id)).toEqual([
      "past",
      "a",
      "b",
      "c",
      "done",
      "later",
    ]);
  });

  it("lists the next three not-done appointments from today", () => {
    const today = new Date(2026, 5, 10, 18, 0);
    expect(upcomingAppointments(list, today).map((a) => a.id)).toEqual(["a", "b", "c"]);
  });
});

describe("testTiming", () => {
  const test = { weekFrom: 11, weekTo: 14 } as MedicalTest;
  it.each([
    [10, "upcoming"],
    [11, "now"],
    [14, "now"],
    [15, "past"],
  ] as const)("week %i is %s", (week, timing) => {
    expect(testTiming(test, week)).toBe(timing);
  });
});

describe("links from Today", () => {
  const test = { id: "late-anatomy-scan", name: "סקירה מאוחרת" } as MedicalTest;
  const appointment = {
    id: "a1",
    title: "סקירה",
    date: "2026-11-02",
    time: "09:30",
    done: false,
  } as Appointment;

  it("builds the links", () => {
    expect(bookTestHref("late-anatomy-scan")).toBe("/tools/appointments?book=late-anatomy-scan");
    expect(editAppointmentHref("a1")).toBe("/tools/appointments?edit=a1");
  });

  it("opens a prefilled booking, an existing appointment, or nothing", () => {
    expect(formFromLink(new URLSearchParams("book=late-anatomy-scan"), [], [test])).toEqual({
      input: { ...emptyAppointmentInput, title: "סקירה מאוחרת", linkedTestId: "late-anatomy-scan" },
    });
    expect(formFromLink(new URLSearchParams("edit=a1"), [appointment], [test])).toEqual({
      appointment,
      input: toAppointmentInput(appointment),
    });
    expect(formFromLink(new URLSearchParams("edit=gone"), [appointment], [test])).toBeNull();
    expect(formFromLink(new URLSearchParams(""), [appointment], [test])).toBeNull();
  });
});
