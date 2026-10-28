import { describe, expect, it } from "vitest";
import type { Surprise } from "@/content/schema";
import surprises from "@/content/he/surprises.json";
import { markSurpriseSeen, surpriseFor } from "@/features/surprises/surprises";
import type { Settings } from "@/lib/storage/types";

const list = surprises as Surprise[];
const settings = (seenSurprises?: number[]): Settings => ({
  id: "s",
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  schemaVersion: 2,
  seenSurprises,
});

describe("weekly surprises", () => {
  it("shows the surprise of the current week only", () => {
    expect(surpriseFor(list, 20, settings())?.week).toBe(20);
    expect(surpriseFor(list, 21, settings())).toBeUndefined();
    expect(surpriseFor(list, 12, undefined)?.week).toBe(12);
  });

  it("shows each surprise once", () => {
    expect(surpriseFor(list, 20, settings([12, 20]))).toBeUndefined();
  });

  it("marks a week as seen without duplicates", () => {
    expect(markSurpriseSeen(settings(), 20).seenSurprises).toEqual([20]);
    expect(markSurpriseSeen(settings([12, 20]), 20).seenSurprises).toEqual([12, 20]);
  });
});
