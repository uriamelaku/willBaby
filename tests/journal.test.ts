import { describe, expect, it } from "vitest";
import {
  sortJournalEntries,
  toJournalRecord,
  validateJournalInput,
} from "@/features/journal/journal";
import type { JournalEntry } from "@/lib/storage/types";

const lmpDate = "2026-01-01";
const today = new Date(2026, 3, 15, 20, 0);

describe("validateJournalInput", () => {
  it("accepts text, a mood, or both", () => {
    expect(validateJournalInput({ date: "2026-04-15", text: "יום טוב" }, lmpDate, today)).toBeNull();
    expect(validateJournalInput({ date: "2026-04-15", text: "", mood: 3 }, lmpDate, today)).toBeNull();
  });

  it("rejects an entry with no text and no mood", () => {
    expect(validateJournalInput({ date: "2026-04-15", text: "  " }, lmpDate, today)).toBe("empty");
  });

  it.each(["2025-12-31", "2026-04-16", "not-a-date"])("rejects date %s", (date) => {
    expect(validateJournalInput({ date, text: "x" }, lmpDate, today)).toBe("invalidDate");
  });
});

describe("toJournalRecord", () => {
  it("computes the content week and trims the text", () => {
    expect(toJournalRecord({ date: "2026-04-15", text: " שלום ", mood: 4 }, lmpDate)).toEqual({
      id: undefined,
      date: "2026-04-15",
      week: 15,
      text: "שלום",
      mood: 4,
      tags: [],
    });
  });

  it("keeps id and tags when editing", () => {
    const existing = { id: "abc", tags: ["בחילות"] } as JournalEntry;
    expect(toJournalRecord({ date: "2026-01-01", text: "x" }, lmpDate, existing)).toMatchObject({
      id: "abc",
      week: 1,
      tags: ["בחילות"],
    });
  });
});

describe("sortJournalEntries", () => {
  it("sorts newest date first, then newest created", () => {
    const entry = (id: string, date: string, createdAt: string) =>
      ({ id, date, createdAt }) as JournalEntry;
    const sorted = sortJournalEntries([
      entry("a", "2026-04-01", "2026-04-01T08:00:00Z"),
      entry("b", "2026-04-02", "2026-04-02T08:00:00Z"),
      entry("c", "2026-04-01", "2026-04-01T20:00:00Z"),
    ]);
    expect(sorted.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });
});
