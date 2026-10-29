import { describe, expect, it } from "vitest";
import {
  dailySchema,
  findMissingDays,
  findMissingWeeks,
  findUnknownTestIds,
  badgesSchema,
  hospitalBagSchema,
  librarySchema,
  surprisesSchema,
  testsSchema,
  weeksSchema,
  type DailyItem,
  type WeekContent,
} from "@/content/schema";
import badges from "@/content/he/badges.json";
import daily from "@/content/he/daily.json";
import hospitalBag from "@/content/he/hospitalBag.json";
import library from "@/content/he/library.json";
import surprises from "@/content/he/surprises.json";
import tests from "@/content/he/tests.json";
import weeks from "@/content/he/weeks.json";

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

  it("tests.json is valid", () => {
    const result = testsSchema.safeParse(tests);
    expect(issuesOf(result)).toEqual([]);
  });

  it("hospitalBag.json is valid", () => {
    expect(issuesOf(hospitalBagSchema.safeParse(hospitalBag))).toEqual([]);
  });

  it("badges.json is valid", () => {
    expect(issuesOf(badgesSchema.safeParse(badges))).toEqual([]);
  });

  it("surprises.json is valid and covers the special weeks", () => {
    expect(issuesOf(surprisesSchema.safeParse(surprises))).toEqual([]);
    expect(surprises.map((surprise) => surprise.week)).toEqual([12, 20, 24, 30, 37, 40]);
  });

  it("library.json is valid and fills every section", () => {
    expect(issuesOf(librarySchema.safeParse(library))).toEqual([]);
    expect(new Set(library.map((topic) => topic.section))).toEqual(new Set(["pregnancy", "birth", "afterBirth", "normal", "rights"]));
  });

  it("weekly testIds all exist in tests.json", () => {
    expect(findUnknownTestIds(weeksSchema.parse(weeks), testsSchema.parse(tests))).toEqual([]);
  });

  it("has all 42 weeks and 294 daily items (missing content fails the build)", () => {
    expect(findMissingWeeks(weeksSchema.parse(weeks))).toEqual([]);
    expect(findMissingDays(dailySchema.parse(daily))).toEqual([]);
  });
});

describe("weeksSchema", () => {
  it("accepts a valid week, with or without twinsNote", () => {
    expect(weeksSchema.safeParse([validWeek]).success).toBe(true);
    expect(weeksSchema.safeParse([{ ...validWeek, twinsNote: "פי שניים" }]).success).toBe(true);
  });

  it("allows a week without fruit and size, but not one without the other", () => {
    const early: Partial<WeekContent> = { ...validWeek, week: 2 };
    delete early.fruit;
    delete early.size;
    expect(weeksSchema.safeParse([early]).success).toBe(true);
    expect(issuesOf(weeksSchema.safeParse([{ ...validWeek, size: undefined }]))).toEqual([
      "fruit and size go together",
    ]);
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

  it("accepts a selector and rejects a malformed one", () => {
    const withSelector = { ...validWeek, headline: "{baby} [שומע|שומעת|שומעים] אותך" };
    expect(weeksSchema.safeParse([withSelector]).success).toBe(true);
    const result = weeksSchema.safeParse([{ ...validWeek, headline: "[שומע|שומעת]" }]);
    expect(issuesOf(result)).toEqual(["A selector needs exactly 3 forms: [m|f|pl]"]);
  });

  it("rejects a letter attached to {baby}", () => {
    const result = weeksSchema.safeParse([{ ...validWeek, headline: "שלום ל{baby}" }]);
    expect(issuesOf(result)).toEqual(["No letter right before {baby}"]);
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

describe("testsSchema", () => {
  const validTest = {
    id: "glucose-challenge",
    name: "העמסת סוכר",
    weekFrom: 24,
    weekTo: 28,
    description: "בדיקת דם",
    isOptional: false,
    source: "משרד הבריאות",
  };

  it("accepts a valid test", () => {
    expect(testsSchema.safeParse([validTest]).success).toBe(true);
  });

  it("rejects reversed weeks, bad ids and duplicates", () => {
    expect(issuesOf(testsSchema.safeParse([{ ...validTest, weekFrom: 30 }]))).toEqual([
      "weekFrom must not be after weekTo",
    ]);
    expect(testsSchema.safeParse([{ ...validTest, id: "Glucose Test" }]).success).toBe(false);
    expect(issuesOf(testsSchema.safeParse([validTest, validTest]))).toEqual([
      "Duplicate id glucose-challenge",
    ]);
  });

  it("finds unknown test ids in weeks", () => {
    const week = { testIds: ["glucose-challenge", "nope"] } as WeekContent;
    expect(findUnknownTestIds([week], [validTest])).toEqual(["nope"]);
  });
});

describe("hospitalBagSchema", () => {
  const item = { id: "id-card", category: "documents", text: "תעודת זהות" };

  it("accepts a valid list and rejects bad items, duplicates and an empty list", () => {
    expect(hospitalBagSchema.safeParse([item]).success).toBe(true);
    expect(hospitalBagSchema.safeParse([{ ...item, category: "toys" }]).success).toBe(false);
    expect(hospitalBagSchema.safeParse([{ ...item, id: "ID Card" }]).success).toBe(false);
    expect(issuesOf(hospitalBagSchema.safeParse([item, item]))).toEqual(["Duplicate id id-card"]);
    expect(hospitalBagSchema.safeParse([]).success).toBe(false);
  });
});

describe("badgesSchema", () => {
  const badge = { id: "halfway", name: "חצי הדרך", emoji: "⛰️", description: "20 שבועות", rule: { type: "week", min: 20 } };

  it("accepts rules from the closed list only", () => {
    expect(badgesSchema.safeParse([badge]).success).toBe(true);
    expect(badgesSchema.safeParse([{ ...badge, rule: { type: "custom", code: "x" } }]).success).toBe(false);
    expect(badgesSchema.safeParse([{ ...badge, rule: { type: "week" } }]).success).toBe(false);
    expect(badgesSchema.safeParse([{ ...badge, rule: { type: "week", min: 50 } }]).success).toBe(false);
    expect(issuesOf(badgesSchema.safeParse([badge, badge]))).toEqual(["Duplicate id halfway"]);
  });
});

describe("surprisesSchema", () => {
  const surprise = { week: 20, emoji: "⛰️", effect: "balloons", title: "חצי הדרך!", text: "{baby} [שומע|שומעת|שומעים]", source: "משרד הבריאות" };

  it("accepts a valid surprise and rejects bad effects, unknown variables and duplicate weeks", () => {
    expect(surprisesSchema.safeParse([surprise]).success).toBe(true);
    expect(surprisesSchema.safeParse([{ ...surprise, effect: "fireworks" }]).success).toBe(false);
    expect(surprisesSchema.safeParse([{ ...surprise, text: "{babby}" }]).success).toBe(false);
    expect(issuesOf(surprisesSchema.safeParse([surprise, surprise]))).toEqual(["Duplicate week 20"]);
  });
});

describe("librarySchema", () => {
  const topic = {
    id: "nutrition",
    section: "pregnancy",
    icon: "🥗",
    title: "תזונה",
    intro: "עקרונות",
    entries: [{ title: "מים", text: "לשתות", link: { label: "כל-זכות", url: "https://www.kolzchut.org.il/" } }],
    sources: ["משרד הבריאות"],
  };

  it("accepts a valid topic and rejects http links, unknown sections and empty entries", () => {
    expect(librarySchema.safeParse([topic]).success).toBe(true);
    const httpLink = { ...topic.entries[0], link: { label: "x", url: "http://example.com" } };
    expect(librarySchema.safeParse([{ ...topic, entries: [httpLink] }]).success).toBe(false);
    expect(librarySchema.safeParse([{ ...topic, section: "games" }]).success).toBe(false);
    expect(librarySchema.safeParse([{ ...topic, entries: [] }]).success).toBe(false);
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
