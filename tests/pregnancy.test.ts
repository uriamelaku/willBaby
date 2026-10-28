import { describe, expect, it } from "vitest";
import {
  FULL_TERM_DAYS,
  dueDateFromLmp,
  getPregnancyStatus,
  lmpFromInput,
  parseLocalDate,
  validateLmp,
} from "../lib/pregnancy";

/** Local calendar date; month is 1-based for readability. */
const date = (year: number, month: number, day: number, hours = 0, minutes = 0) =>
  new Date(year, month - 1, day, hours, minutes);

const lmp = date(2026, 1, 1);

describe("test environment", () => {
  it("runs in a time zone ahead of UTC", () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-120);
  });
});

describe("parseLocalDate", () => {
  it("parses YYYY-MM-DD as local midnight, not UTC midnight", () => {
    const parsed = parseLocalDate("2026-03-15");
    expect(parsed).toEqual(date(2026, 3, 15));
    // The native parser treats date-only strings as UTC, which is 02:00 local here.
    expect(new Date("2026-03-15").getHours()).toBe(2);
  });

  it.each(["", "2026-3-15", "15/03/2026", "2026-02-30", "2026-13-01", "abc"])(
    "rejects %j",
    (value) => {
      expect(() => parseLocalDate(value)).toThrow(RangeError);
    },
  );

  it("accepts Feb 29 in a leap year only", () => {
    expect(parseLocalDate("2028-02-29")).toEqual(date(2028, 2, 29));
    expect(() => parseLocalDate("2027-02-29")).toThrow(RangeError);
  });
});

describe("lmpFromInput", () => {
  it("LMP: day 0 is the entered date", () => {
    expect(lmpFromInput("lmp", date(2026, 1, 1))).toEqual(date(2026, 1, 1));
  });

  it("due date: day 0 is due − 280", () => {
    expect(lmpFromInput("due", date(2026, 10, 8))).toEqual(date(2026, 1, 1));
  });

  it("IVF day-5 transfer: day 0 is transfer − 19, due is transfer + 261", () => {
    const transfer = date(2026, 2, 1);
    const day0 = lmpFromInput("ivf5", transfer);
    expect(day0).toEqual(date(2026, 1, 13));
    expect(dueDateFromLmp(day0)).toEqual(date(2026, 10, 20));
  });

  it("IVF day-3 transfer: day 0 is transfer − 17, due is transfer + 263", () => {
    const transfer = date(2026, 2, 1);
    const day0 = lmpFromInput("ivf3", transfer);
    expect(day0).toEqual(date(2026, 1, 15));
    expect(dueDateFromLmp(day0)).toEqual(date(2026, 10, 22));
  });

  it("ignores the time of day of the input", () => {
    expect(lmpFromInput("lmp", date(2026, 1, 1, 23, 59))).toEqual(date(2026, 1, 1));
  });

  it("all methods agree on the same pregnancy", () => {
    const due = dueDateFromLmp(lmp);
    expect(lmpFromInput("due", due)).toEqual(lmp);
    expect(lmpFromInput("ivf5", date(2026, 1, 20))).toEqual(lmp);
    expect(lmpFromInput("ivf3", date(2026, 1, 18))).toEqual(lmp);
  });

  it("throws on an invalid date", () => {
    expect(() => lmpFromInput("lmp", new Date(NaN))).toThrow(RangeError);
  });
});

describe("dueDateFromLmp", () => {
  it("is day 0 + 280", () => {
    expect(dueDateFromLmp(lmp)).toEqual(date(2026, 10, 8));
  });

  it("crosses a leap day correctly", () => {
    expect(dueDateFromLmp(date(2027, 6, 1))).toEqual(date(2028, 3, 7));
  });
});

describe("validateLmp", () => {
  const today = date(2026, 6, 1);

  it("accepts today (day 0)", () => {
    expect(validateLmp(today, today)).toEqual({ valid: true });
  });

  it("accepts exactly 300 days ago", () => {
    expect(validateLmp(date(2025, 8, 5), today)).toEqual({ valid: true });
  });

  it("rejects 301 days ago", () => {
    expect(validateLmp(date(2025, 8, 4), today)).toEqual({
      valid: false,
      reason: "tooFarInPast",
    });
  });

  it("rejects a future date", () => {
    expect(validateLmp(date(2026, 6, 2), today)).toEqual({
      valid: false,
      reason: "inFuture",
    });
  });

  it("rejects invalid dates", () => {
    expect(validateLmp(new Date(NaN), today)).toEqual({
      valid: false,
      reason: "invalidDate",
    });
    expect(validateLmp(today, new Date(NaN))).toEqual({
      valid: false,
      reason: "invalidDate",
    });
  });
});

describe("getPregnancyStatus", () => {
  const statusOnDay = (daysPregnant: number) => {
    const today = new Date(lmp);
    today.setDate(today.getDate() + daysPregnant);
    return getPregnancyStatus(lmp, today);
  };

  it("day 0", () => {
    expect(statusOnDay(0)).toEqual({
      daysPregnant: 0,
      week: 0,
      dayOfWeek: 0,
      contentWeek: 1,
      daysLeft: 280,
      progress: 0,
      trimester: 1,
      dueDate: date(2026, 10, 8),
    });
  });

  it('shows "14+3" and "the 15th week"', () => {
    const status = statusOnDay(14 * 7 + 3);
    expect(status.week).toBe(14);
    expect(status.dayOfWeek).toBe(3);
    expect(status.contentWeek).toBe(15);
  });

  it("dayOfWeek wraps from 6 to 0 at a new week", () => {
    expect(statusOnDay(6)).toMatchObject({ week: 0, dayOfWeek: 6 });
    expect(statusOnDay(7)).toMatchObject({ week: 1, dayOfWeek: 0, contentWeek: 2 });
  });

  it.each([
    [13 * 7 + 6, 1],
    [14 * 7, 2],
    [27 * 7 + 6, 2],
    [28 * 7, 3],
  ])("day %i is trimester %i", (days, trimester) => {
    expect(statusOnDay(days).trimester).toBe(trimester);
  });

  it("due date day: 0 days left, progress 1", () => {
    expect(statusOnDay(FULL_TERM_DAYS)).toMatchObject({
      week: 40,
      daysLeft: 0,
      progress: 1,
      contentWeek: 41,
    });
  });

  it("halfway: progress 0.5", () => {
    expect(statusOnDay(140).progress).toBe(0.5);
  });

  it("past the due date: negative days left, progress capped at 1", () => {
    expect(statusOnDay(285)).toMatchObject({ daysLeft: -5, progress: 1 });
  });

  it("content week is capped at 42", () => {
    expect(statusOnDay(41 * 7).contentWeek).toBe(42);
    expect(statusOnDay(300)).toMatchObject({ week: 42, contentWeek: 42 });
  });

  it("throws outside the valid range", () => {
    expect(() => statusOnDay(-1)).toThrow(RangeError);
    expect(() => statusOnDay(301)).toThrow(RangeError);
  });
});

describe("local calendar date, not UTC", () => {
  it("the day changes at local midnight", () => {
    // 00:30 local on Jan 2 is still Jan 1 in UTC.
    const justAfterMidnight = date(2026, 1, 2, 0, 30);
    expect(justAfterMidnight.getUTCDate()).toBe(1);
    expect(getPregnancyStatus(lmp, justAfterMidnight).daysPregnant).toBe(1);
  });

  it("late evening still counts as the same local day", () => {
    expect(getPregnancyStatus(lmp, date(2026, 1, 1, 23, 59)).daysPregnant).toBe(0);
  });

  it("a 23-hour day at the DST start still counts as a full day", () => {
    // Israel moves clocks forward on Friday, March 27, 2026.
    const before = date(2026, 3, 27);
    const after = date(2026, 3, 28);
    expect(after.getTime() - before.getTime()).toBe(23 * 60 * 60 * 1000);
    expect(getPregnancyStatus(before, after).daysPregnant).toBe(1);
  });

  it("a 25-hour day at the DST end still counts as one day", () => {
    // Israel moves clocks back on Sunday, October 25, 2026.
    const before = date(2026, 10, 25);
    const after = date(2026, 10, 26);
    expect(after.getTime() - before.getTime()).toBe(25 * 60 * 60 * 1000);
    expect(getPregnancyStatus(before, after).daysPregnant).toBe(1);
  });

  it("a date from a date input matches the same local date", () => {
    expect(getPregnancyStatus(parseLocalDate("2026-01-01"), date(2026, 1, 8, 1)).week).toBe(1);
  });
});
