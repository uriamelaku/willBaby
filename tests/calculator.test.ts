import { describe, expect, it } from "vitest";
import { calculateWeekOn } from "@/features/calculator/calculator";

describe("calculateWeekOn", () => {
  const lmp = "2026-07-13";

  it("gives the week and day on a future date", () => {
    const result = calculateWeekOn(lmp, "2026-12-25");
    expect(result.kind).toBe("result");
    if (result.kind !== "result") return;
    // 165 days: 23+4, the 24th week, second trimester, 115 days before the due date.
    expect(result.status).toMatchObject({ daysPregnant: 165, week: 23, dayOfWeek: 4, contentWeek: 24, trimester: 2, daysLeft: 115 });
  });

  it("covers day 0, the due date and the end of the range (day 300)", () => {
    expect(calculateWeekOn(lmp, lmp)).toMatchObject({ kind: "result", status: { week: 0, dayOfWeek: 0 } });
    expect(calculateWeekOn(lmp, "2027-04-19")).toMatchObject({ kind: "result", status: { week: 40, daysLeft: 0 } });
    expect(calculateWeekOn(lmp, "2027-05-09")).toMatchObject({ kind: "result", status: { daysPregnant: 300 } });
  });

  it("tells a date before day 0 from one past day 300", () => {
    expect(calculateWeekOn(lmp, "2026-07-12")).toEqual({ kind: "beforeStart" });
    expect(calculateWeekOn(lmp, "2027-05-10")).toEqual({ kind: "afterEnd" });
  });

  it("rejects empty or malformed dates", () => {
    expect(calculateWeekOn("", "2026-12-25")).toEqual({ kind: "invalidDate" });
    expect(calculateWeekOn(lmp, "")).toEqual({ kind: "invalidDate" });
    expect(calculateWeekOn(lmp, "2026-02-30")).toEqual({ kind: "invalidDate" });
  });
});
