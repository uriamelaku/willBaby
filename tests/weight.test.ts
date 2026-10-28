import { describe, expect, it } from "vitest";
import {
  sortWeights,
  toWeightRecord,
  validateWeightInput,
  weightChange,
  weightChartPoints,
} from "@/features/weight/weight";
import type { WeightEntry } from "@/lib/storage/types";

const lmpDate = "2026-01-01";
const today = new Date(2026, 3, 15, 20, 0);

const entry = (id: string, date: string, kg: number): WeightEntry => ({
  id,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  date,
  kg,
});

describe("validateWeightInput", () => {
  it("accepts a weight between day 0 and today", () => {
    expect(validateWeightInput({ date: "2026-01-01", kg: "61.5" }, lmpDate, today)).toBeNull();
    expect(validateWeightInput({ date: "2026-04-15", kg: "70" }, lmpDate, today)).toBeNull();
  });

  it.each(["2025-12-31", "2026-04-16", "nope"])("rejects date %s", (date) => {
    expect(validateWeightInput({ date, kg: "60" }, lmpDate, today)).toBe("invalidDate");
  });

  it.each(["", " ", "abc", "29.9", "250.1", "-60"])("rejects weight %j", (kg) => {
    expect(validateWeightInput({ date: "2026-02-01", kg }, lmpDate, today)).toBe("invalidWeight");
  });
});

describe("weights", () => {
  const entries = [entry("b", "2026-03-01", 64.2), entry("a", "2026-01-01", 61), entry("c", "2026-04-08", 66.75)];

  it("rounds to 0.1 kg and replaces the weight of the same date", () => {
    expect(toWeightRecord({ date: "2026-03-01", kg: "64.26" }, entries)).toEqual({
      id: "b",
      date: "2026-03-01",
      kg: 64.3,
    });
    expect(toWeightRecord({ date: "2026-03-02", kg: "64" }, entries).id).toBeUndefined();
  });

  it("sorts oldest first and computes the change", () => {
    expect(sortWeights(entries).map((e) => e.id)).toEqual(["a", "b", "c"]);
    expect(weightChange(entries)).toBe(5.8);
    expect(weightChange([entries[0]])).toBeNull();
  });

  it("places points by pregnancy week", () => {
    expect(weightChartPoints(entries, lmpDate)).toEqual([
      { week: 0, kg: 61 },
      { week: 8.4, kg: 64.2 },
      { week: 13.9, kg: 66.75 },
    ]);
  });
});
