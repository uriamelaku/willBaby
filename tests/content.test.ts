import { describe, expect, it } from "vitest";
import {
  dailySchema,
  findMissingDays,
  findMissingWeeks,
  weeksSchema,
  type DailyItem,
  type WeekContent,
} from "@/content/schema";
import daily from "@/content/he/daily.json";
import weeks from "@/content/he/weeks.json";

// Turn on once all 42 weeks and 294 daily items are written (tracked in docs/plan.md).
const REQUIRE_COMPLETE_CONTENT = false;

const validWeek: WeekContent = {
  week: 20,
  fruit: { emoji: "🍌", name: "בננה" },
  size: { cm: 25.6, grams: 300 },
  headline: "חצי הדרך! {baby} כבר שומע את הקול של {you}",
  baby: ["משהו על {baby}"],
  body: ["משהו על הגוף"],
  tips: ["טיפ"],
  partner: { tip: "טיפ ל{partnerName}", mission: "משימה זוגית" },
  funFact: "עובדה משעשעת",
  testIds: ["anatomy-scan"],
  sources: ["משרד הבריאות"],
};

const validDailyItem: DailyItem = {
  day: 0,
  type: "tip",
  text: "שתי מים, {you} עושה עבודה מדהימה",
  partnerText: "תביא לה כוס מים",
};

const issuesOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe("content files (build gate)", () => {
  it("weeks.json is valid", () => {
    const result = weeksSchema.safeParse(weeks);
    expect(issuesOf(result)).toEqual([]);
  });

  it("daily.json is valid", () => {
    const result = dailySchema.safeParse(daily);
    expect(issuesOf(result)).toEqual([]);
  });

  it.runIf(REQUIRE_COMPLETE_CONTENT)("has all 42 weeks and 294 daily items", () => {
    expect(findMissingWeeks(weeksSchema.parse(weeks))).toEqual([]);
    expect(findMissingDays(dailySchema.parse(daily))).toEqual([]);
  });
});

describe("weeksSchema", () => {
  it("accepts a valid week, with or without twinsNote", () => {
    expect(weeksSchema.safeParse([validWeek]).success).toBe(true);
    expect(weeksSchema.safeParse([{ ...validWeek, twinsNote: "פי שניים" }]).success).toBe(true);
  });

  it.each([0, 43, 1.5])("rejects week %j", (week) => {
    expect(weeksSchema.safeParse([{ ...validWeek, week }]).success).toBe(false);
  });

  it("rejects a missing field", () => {
    const withoutFunFact: Partial<WeekContent> = { ...validWeek };
    delete withoutFunFact.funFact;
    expect(weeksSchema.safeParse([withoutFunFact]).success).toBe(false);
  });

  it("rejects an unknown key (typo)", () => {
    expect(weeksSchema.safeParse([{ ...validWeek, headlin: "x" }]).success).toBe(false);
  });

  it("rejects empty lists and blank texts", () => {
    expect(weeksSchema.safeParse([{ ...validWeek, tips: [] }]).success).toBe(false);
    expect(weeksSchema.safeParse([{ ...validWeek, headline: "   " }]).success).toBe(false);
    expect(weeksSchema.safeParse([{ ...validWeek, sources: [] }]).success).toBe(false);
  });

  it("rejects unknown variables", () => {
    const result = weeksSchema.safeParse([{ ...validWeek, headline: "שלום {babby}" }]);
    expect(issuesOf(result)).toEqual(["Unknown variable(s): babby"]);
  });

  it("rejects duplicate weeks", () => {
    const result = weeksSchema.safeParse([validWeek, validWeek]);
    expect(issuesOf(result)).toEqual(["Duplicate week 20"]);
  });
});

describe("dailySchema", () => {
  it("accepts a valid item", () => {
    expect(dailySchema.safeParse([validDailyItem]).success).toBe(true);
  });

  it.each([-1, 294])("rejects day %i", (day) => {
    expect(dailySchema.safeParse([{ ...validDailyItem, day }]).success).toBe(false);
  });

  it("rejects an unknown type", () => {
    expect(dailySchema.safeParse([{ ...validDailyItem, type: "quiz" }]).success).toBe(false);
  });

  it("allows 25 words and rejects 26", () => {
    const words = (count: number) => Array(count).fill("מילה").join(" ");
    expect(dailySchema.safeParse([{ ...validDailyItem, text: words(25) }]).success).toBe(true);
    expect(dailySchema.safeParse([{ ...validDailyItem, partnerText: words(26) }]).success).toBe(
      false,
    );
  });

  it("requires a source for a fact", () => {
    const fact = { ...validDailyItem, type: "fact" as const };
    expect(issuesOf(dailySchema.safeParse([fact]))).toEqual(["A fact needs a source"]);
    expect(dailySchema.safeParse([{ ...fact, source: "משרד הבריאות" }]).success).toBe(true);
  });

  it("rejects duplicate days", () => {
    const result = dailySchema.safeParse([validDailyItem, validDailyItem]);
    expect(issuesOf(result)).toEqual(["Duplicate day 0"]);
  });
});

describe("completeness", () => {
  it("lists missing weeks and days", () => {
    const allWeeks = Array.from({ length: 42 }, (_, i) => ({ ...validWeek, week: i + 1 }));
    expect(findMissingWeeks(allWeeks)).toEqual([]);
    expect(findMissingWeeks(allWeeks.filter((w) => w.week !== 7))).toEqual([7]);

    const allDays = Array.from({ length: 294 }, (_, day) => ({ ...validDailyItem, day }));
    expect(findMissingDays(allDays)).toEqual([]);
    expect(findMissingDays(allDays.slice(1, 293))).toEqual([0, 293]);
  });
});
