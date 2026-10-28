import { describe, expect, it } from "vitest";
import { updateDueDate } from "@/features/pregnancy/updateDueDate";
import type { Pregnancy } from "@/lib/storage/types";

const pregnancy: Pregnancy = {
  id: "p1",
  createdAt: "2026-02-01T10:00:00.000Z",
  updatedAt: "2026-02-01T10:00:00.000Z",
  method: "lmp",
  inputDate: "2026-01-01",
  lmpDate: "2026-01-01",
  dueDate: "2026-10-08",
  babiesCount: 1,
  dueDateHistory: [{ dueDate: "2026-10-08", changedAt: "2026-02-01T10:00:00.000Z" }],
  status: "active",
};

const today = new Date(2026, 2, 1, 12, 0);
const now = new Date("2026-03-01T10:00:00.000Z");

describe("updateDueDate", () => {
  it("moves day 0 with the new due date and appends to the history", () => {
    const result = updateDueDate(pregnancy, "2026-10-12", today, now);
    expect(result).toEqual({
      ok: true,
      pregnancy: {
        ...pregnancy,
        lmpDate: "2026-01-05",
        dueDate: "2026-10-12",
        dueDateHistory: [
          ...pregnancy.dueDateHistory,
          { dueDate: "2026-10-12", changedAt: "2026-03-01T10:00:00.000Z" },
        ],
      },
    });
  });

  it("keeps the onboarding method and input date", () => {
    const result = updateDueDate(pregnancy, "2026-10-01", today, now);
    expect(result.ok && result.pregnancy).toMatchObject({ method: "lmp", inputDate: "2026-01-01" });
  });

  it.each([
    ["", "invalidDate"],
    ["2026-02-30", "invalidDate"],
    ["2026-10-08", "unchanged"],
    // Day 0 would be after today.
    ["2026-12-15", "inFuture"],
    // Day 0 would be more than 300 days before today.
    ["2026-02-01", "tooFarInPast"],
  ] as const)("rejects %j as %s", (dueDate, error) => {
    expect(updateDueDate(pregnancy, dueDate, today, now)).toEqual({ ok: false, error });
  });
});

describe("updateDueDate by last period", () => {
  it("sets day 0 to the new last-period date and recomputes the due date", () => {
    const result = updateDueDate(pregnancy, "2026-01-08", today, now, "lmp");
    expect(result).toEqual({
      ok: true,
      pregnancy: {
        ...pregnancy,
        lmpDate: "2026-01-08",
        dueDate: "2026-10-15",
        dueDateHistory: [
          ...pregnancy.dueDateHistory,
          { dueDate: "2026-10-15", changedAt: "2026-03-01T10:00:00.000Z" },
        ],
      },
    });
  });

  it.each([
    ["2026-01-01", "unchanged"],
    ["2026-03-02", "inFuture"],
    ["2025-04-01", "tooFarInPast"],
    ["nope", "invalidDate"],
  ] as const)("rejects %j as %s", (lmpDate, error) => {
    expect(updateDueDate(pregnancy, lmpDate, today, now, "lmp")).toEqual({ ok: false, error });
  });
});
