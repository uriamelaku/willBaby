import { describe, expect, it } from "vitest";
import type { MedicalTest } from "@/content/schema";
import {
  RING_SEGMENT,
  greetingFor,
  trimesterRing,
  upcomingItems,
} from "@/features/today/today";
import type { Appointment } from "@/lib/storage/types";

describe("greetingFor", () => {
  it.each([
    [5, "morning"],
    [11, "morning"],
    [12, "noon"],
    [16, "noon"],
    [17, "evening"],
    [21, "evening"],
    [22, "night"],
    [0, "night"],
    [4, "night"],
  ] as const)("%i:00 is %s", (hour, key) => {
    expect(greetingFor(hour)).toBe(key);
  });
});

describe("trimesterRing", () => {
  it("day 0: nothing filled, dot at the start of the first arc", () => {
    const ring = trimesterRing(0);
    expect(ring.fills).toEqual([0, 0, 0]);
    expect(ring.dot.x).toBeCloseTo(80 + 64 * Math.cos((-79.2 * Math.PI) / 180));
  });

  it("matches the approved design at 14+3: first arc full, second just started", () => {
    const ring = trimesterRing(14 * 7 + 3);
    expect(ring.fills[0]).toBe(RING_SEGMENT);
    expect(ring.fills[1]).toBeCloseTo(3.37, 1);
    expect(ring.fills[2]).toBe(0);
    expect(ring.dot.x).toBeCloseTo(126.3, 0);
    expect(ring.dot.y).toBeCloseTo(124.2, 0);
  });

  it("fills everything at and after the due date", () => {
    expect(trimesterRing(280).fills).toEqual([RING_SEGMENT, RING_SEGMENT, RING_SEGMENT]);
    expect(trimesterRing(295).fills).toEqual([RING_SEGMENT, RING_SEGMENT, RING_SEGMENT]);
  });
});

describe("upcomingItems", () => {
  const test = (id: string, weekFrom: number, weekTo: number) =>
    ({ id, name: id, weekFrom, weekTo }) as MedicalTest;
  const tests = [test("nt", 11, 14), test("early", 14, 16), test("screen", 16, 20), test("late", 20, 24)];
  const appointment = (id: string, date: string, extra: Partial<Appointment> = {}) =>
    ({ id, title: id, date, done: false, ...extra }) as Appointment;
  const today = new Date(2026, 9, 28, 10, 0);
  const daysPregnant = 14 * 7 + 3; // content week 15

  it("orders open tests (now) first, then by days until the window opens", () => {
    expect(upcomingItems([], tests, daysPregnant, today)).toEqual([
      { kind: "test", id: "early", title: "early", week: 14, daysUntil: 0 },
      { kind: "test", id: "screen", title: "screen", week: 16, daysUntil: 4 },
      { kind: "test", id: "late", title: "late", week: 20, daysUntil: 32 },
    ]);
  });

  it("mixes appointments by date and hides tests that already have one", () => {
    const items = upcomingItems(
      [appointment("סקירה", "2026-10-30", { linkedTestId: "early", time: "10:30" })],
      tests,
      daysPregnant,
      today,
    );
    expect(items.map((item) => [item.id, item.daysUntil])).toEqual([
      ["סקירה", 2],
      ["screen", 4],
      ["late", 32],
    ]);
  });

  it("skips past or done appointments and closed test windows", () => {
    const items = upcomingItems(
      [appointment("past", "2026-10-27"), appointment("done", "2026-11-01", { done: true })],
      tests,
      daysPregnant,
      today,
    );
    expect(items.map((item) => item.id)).toEqual(["early", "screen", "late"]);
  });
});
