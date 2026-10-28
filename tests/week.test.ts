import { describe, expect, it } from "vitest";
import { daysUntilWeek, isWeekOpen } from "@/features/week/week";
import { getPregnancyStatus } from "@/lib/pregnancy";

// Day 107: 15+2, the 16th week.
const status = getPregnancyStatus(new Date(2026, 6, 13), new Date(2026, 9, 28));

describe("week access", () => {
  it("opens past weeks and the current one only", () => {
    expect(status.contentWeek).toBe(16);
    expect(isWeekOpen(1, status)).toBe(true);
    expect(isWeekOpen(16, status)).toBe(true);
    expect(isWeekOpen(17, status)).toBe(false);
    expect(isWeekOpen(42, null)).toBe(true);
  });

  it("counts the days until a future week", () => {
    expect(daysUntilWeek(17, status)).toBe(5);
    expect(daysUntilWeek(20, status)).toBe(26);
    expect(daysUntilWeek(10, status)).toBe(0);
  });
});
