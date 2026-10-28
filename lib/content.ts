import daily from "@/content/he/daily.json";
import weeks from "@/content/he/weeks.json";
import { TOTAL_DAILY_ITEMS, type DailyItem, type WeekContent } from "@/content/schema";

// Content JSON is validated at build time (tests/content.test.ts), so it is typed here without parsing.
const weekContents = weeks as WeekContent[];
const dailyItems = daily as DailyItem[];

export const findWeekContent = (contents: WeekContent[], week: number) =>
  contents.find((content) => content.week === week);

/** The daily item for a pregnancy day; days past the last item (294..300) keep showing it. */
export const findDailyItem = (items: DailyItem[], daysPregnant: number) => {
  const day = Math.min(Math.max(daysPregnant, 0), TOTAL_DAILY_ITEMS - 1);
  return items.find((item) => item.day === day);
};

export const getWeekContent = (week: number) => findWeekContent(weekContents, week);

export const getDailyItem = (daysPregnant: number) => findDailyItem(dailyItems, daysPregnant);
