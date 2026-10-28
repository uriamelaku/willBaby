import { z } from "zod";
import { MAX_CONTENT_WEEK } from "@/lib/pregnancy";
import { findUnknownVariables, hasMalformedSelector } from "@/lib/text";

// Content rules: see docs/content.md. Validated at build time (`prebuild` runs tests/content.test.ts).

export const DAYS_PER_WEEK = 7;
export const TOTAL_DAILY_ITEMS = MAX_CONTENT_WEEK * DAYS_PER_WEEK;
export const MAX_DAILY_WORDS = 25;

const text = z
  .string()
  .trim()
  .min(1)
  .refine((value) => findUnknownVariables(value).length === 0, {
    error: (issue) =>
      `Unknown variable(s): ${findUnknownVariables(issue.input as string).join(", ")}`,
  })
  .refine((value) => !hasMalformedSelector(value), "A selector needs exactly 3 forms: [m|f|pl]")
  // {baby} may be "הבייבי", so a prefix like ל{baby} would read "להבייבי".
  .refine((value) => !/[א-ת]\{baby\}/.test(value), "No letter right before {baby}");

const shortText = text.refine(
  (value) => value.split(/\s+/).length <= MAX_DAILY_WORDS,
  `At most ${MAX_DAILY_WORDS} words`,
);

const textList = z.array(text).min(1);

export const weekSchema = z.strictObject({
  week: z.int().min(1).max(MAX_CONTENT_WEEK),
  fruit: z.strictObject({ emoji: z.string().min(1), name: text }),
  size: z.strictObject({ cm: z.number().positive(), grams: z.number().positive() }),
  headline: text,
  baby: textList,
  body: textList,
  tips: textList,
  partner: z.strictObject({ tip: text, mission: text }),
  funFact: text,
  twinsNote: text.optional(),
  testIds: z.array(z.string().min(1)),
  sources: textList,
});

export const dailyItemTypes = ["tip", "fact", "funny", "emotional", "partner"] as const;

export const dailyItemSchema = z
  .strictObject({
    day: z.int().min(0).max(TOTAL_DAILY_ITEMS - 1),
    type: z.enum(dailyItemTypes),
    text: shortText,
    partnerText: shortText,
    source: text.optional(),
  })
  .refine((item) => item.type !== "fact" || item.source !== undefined, {
    error: "A fact needs a source",
    path: ["source"],
  });

/** Array schema that rejects two items with the same key (e.g. two entries for week 20). */
const uniqueBy = <T extends z.ZodType>(item: T, key: keyof z.infer<T> & string) =>
  z.array(item).superRefine((items, ctx) => {
    const seen = new Set<unknown>();
    items.forEach((entry, index) => {
      const value = (entry as Record<string, unknown>)[key];
      if (seen.has(value)) {
        ctx.addIssue({ code: "custom", message: `Duplicate ${key} ${value}`, path: [index, key] });
      }
      seen.add(value);
    });
  });

export const weeksSchema = uniqueBy(weekSchema, "week");
export const dailySchema = uniqueBy(dailyItemSchema, "day");

export type WeekContent = z.infer<typeof weekSchema>;
export type DailyItem = z.infer<typeof dailyItemSchema>;

const missingNumbers = (present: number[], from: number, to: number) => {
  const presentSet = new Set(present);
  return Array.from({ length: to - from + 1 }, (_, i) => from + i).filter(
    (n) => !presentSet.has(n),
  );
};

export const findMissingWeeks = (weeks: WeekContent[]) =>
  missingNumbers(weeks.map((w) => w.week), 1, MAX_CONTENT_WEEK);

export const findMissingDays = (daily: DailyItem[]) =>
  missingNumbers(daily.map((d) => d.day), 0, TOTAL_DAILY_ITEMS - 1);
