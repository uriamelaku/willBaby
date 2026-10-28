import { describe, expect, it } from "vitest";
import type { DailyItem, WeekContent } from "@/content/schema";
import { findDailyItem, findWeekContent } from "@/lib/content";

const item = (day: number): DailyItem => ({
  day,
  type: "tip",
  text: `טקסט ${day}`,
  partnerText: `טקסט לבן הזוג ${day}`,
});

const daily = [item(0), item(105), item(293)];

describe("findDailyItem", () => {
  it("picks the item for the pregnancy day", () => {
    expect(findDailyItem(daily, 105)).toEqual(item(105));
  });

  it("keeps the last item for days 294..300", () => {
    expect(findDailyItem(daily, 294)).toEqual(item(293));
    expect(findDailyItem(daily, 300)).toEqual(item(293));
  });

  it("returns undefined when the day has no content yet", () => {
    expect(findDailyItem(daily, 50)).toBeUndefined();
  });
});

describe("findWeekContent", () => {
  it("finds a week or returns undefined", () => {
    const week16 = { week: 16 } as WeekContent;
    expect(findWeekContent([week16], 16)).toBe(week16);
    expect(findWeekContent([week16], 17)).toBeUndefined();
  });
});
