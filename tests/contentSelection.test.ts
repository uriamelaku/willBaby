import { describe, expect, it } from "vitest";
import type { DailyItem, WeekContent } from "@/content/schema";
import { findDailyItems, findWeekContent } from "@/lib/content";

const item = (day: number, n = 0): DailyItem => ({
  day,
  type: "tip",
  text: `טקסט ${day}-${n}`,
  partnerText: `טקסט לבן הזוג ${day}-${n}`,
});

const daily = [item(0), item(105), item(105, 1), item(293), item(293, 1)];

describe("findDailyItems", () => {
  it("picks the day's items in content order", () => {
    expect(findDailyItems(daily, 105)).toEqual([item(105), item(105, 1)]);
  });

  it("keeps the last day's items for days 294..300", () => {
    expect(findDailyItems(daily, 294)).toEqual([item(293), item(293, 1)]);
    expect(findDailyItems(daily, 300)).toEqual([item(293), item(293, 1)]);
  });

  it("returns nothing when the day has no content yet", () => {
    expect(findDailyItems(daily, 50)).toEqual([]);
  });
});

describe("findWeekContent", () => {
  it("finds a week or returns undefined", () => {
    const week16 = { week: 16 } as WeekContent;
    expect(findWeekContent([week16], 16)).toBe(week16);
    expect(findWeekContent([week16], 17)).toBeUndefined();
  });
});
