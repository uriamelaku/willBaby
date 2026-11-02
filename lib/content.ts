import badges from "@/content/he/badges.json";
import daily from "@/content/he/daily.json";
import hospitalBag from "@/content/he/hospitalBag.json";
import surprises from "@/content/he/surprises.json";
import tests from "@/content/he/tests.json";
import weeks from "@/content/he/weeks.json";
import {
  TOTAL_DAILY_DAYS,
  type Badge,
  type DailyItem,
  type HospitalBagItem,
  type Surprise,
  type MedicalTest,
  type WeekContent,
} from "@/content/schema";

// Content JSON is validated at build time (tests/content.test.ts), so it is typed here without parsing.
const weekContents = weeks as WeekContent[];
const dailyItems = daily as DailyItem[];
const medicalTests = tests as MedicalTest[];
const hospitalBagItems = hospitalBag as HospitalBagItem[];
const badgeList = badges as Badge[];
const surpriseList = surprises as Surprise[];

export const findWeekContent = (contents: WeekContent[], week: number) =>
  contents.find((content) => content.week === week);

/** The daily items for a pregnancy day, in content order; days past the last day (294..300) keep the last day's. */
export const findDailyItems = (items: DailyItem[], daysPregnant: number) => {
  const day = Math.min(Math.max(daysPregnant, 0), TOTAL_DAILY_DAYS - 1);
  return items.filter((item) => item.day === day);
};

export const getWeekContent = (week: number) => findWeekContent(weekContents, week);

export const getDailyItems = (daysPregnant: number) => findDailyItems(dailyItems, daysPregnant);

export const getMedicalTests = () => medicalTests;

export const getMedicalTest = (id: string) => medicalTests.find((test) => test.id === id);

export const getHospitalBagItems = () => hospitalBagItems;

export const getBadges = () => badgeList;

export const getSurprises = () => surpriseList;
