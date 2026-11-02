import { describe, expect, it } from "vitest";
import { nextDailyTipIndex, parseDailyTipPosition } from "@/features/today/dailyTip";

describe("nextDailyTipIndex", () => {
  it("starts a new day (or a first visit) from the first item", () => {
    expect(nextDailyTipIndex(undefined, 100, 4)).toBe(0);
    expect(nextDailyTipIndex({ day: 99, index: 2 }, 100, 4)).toBe(0);
  });

  it("moves to the next item on the same day and wraps around", () => {
    expect(nextDailyTipIndex({ day: 100, index: 0 }, 100, 4)).toBe(1);
    expect(nextDailyTipIndex({ day: 100, index: 3 }, 100, 4)).toBe(0);
  });

  it("stays in range when the day has fewer items", () => {
    expect(nextDailyTipIndex({ day: 100, index: 3 }, 100, 1)).toBe(0);
    expect(nextDailyTipIndex({ day: 100, index: 0 }, 100, 0)).toBe(0);
  });
});

describe("parseDailyTipPosition", () => {
  it("reads a saved position", () => {
    expect(parseDailyTipPosition('{"day":100,"index":2}')).toEqual({ day: 100, index: 2 });
  });

  it.each([null, "", "not json", "null", '{"day":"100","index":2}', '{"day":100}'])(
    "ignores a missing or invalid value (%s)",
    (value) => {
      expect(parseDailyTipPosition(value)).toBeUndefined();
    },
  );
});
