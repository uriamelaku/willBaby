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

export const weekSchema = z
  .strictObject({
    week: z.int().min(1).max(MAX_CONTENT_WEEK),
    /** Omitted for the first weeks, before there is an embryo to compare (fruit and size go together). */
    fruit: z.strictObject({ emoji: z.string().min(1), name: text }).optional(),
    size: z.strictObject({ cm: z.number().positive(), grams: z.number().positive() }).optional(),
    headline: text,
    baby: textList,
    body: textList,
    tips: textList,
    partner: z.strictObject({ tip: text, mission: text }),
    funFact: text,
    twinsNote: text.optional(),
    testIds: z.array(z.string().min(1)),
    sources: textList,
  })
  .refine((week) => (week.fruit === undefined) === (week.size === undefined), {
    error: "fruit and size go together",
    path: ["size"],
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

const contentId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use a kebab-case id");

const contentWeek = z.int().min(1).max(MAX_CONTENT_WEEK);

export const medicalTestSchema = z
  .strictObject({
    id: contentId,
    name: text,
    /** Compact name for tight spots like the Today timeline. */
    shortName: text.optional(),
    weekFrom: contentWeek,
    weekTo: contentWeek,
    description: text,
    isOptional: z.boolean(),
    source: text,
  })
  .refine((test) => test.weekFrom <= test.weekTo, {
    error: "weekFrom must not be after weekTo",
    path: ["weekTo"],
  });

export const hospitalBagCategories = ["documents", "forBirth", "baby", "partner"] as const;

export const hospitalBagItemSchema = z.strictObject({
  id: contentId,
  category: z.enum(hospitalBagCategories),
  text,
});

/** The closed list of badge conditions (no free code); see features/achievements. */
export const badgeRuleSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("onboarded") }),
  z.strictObject({ type: z.literal("week"), min: z.int().min(1).max(MAX_CONTENT_WEEK) }),
  z.strictObject({ type: z.literal("photos"), min: z.int().min(1) }),
  z.strictObject({ type: z.literal("journalStreak"), days: z.int().min(2) }),
  z.strictObject({ type: z.literal("kickSessions"), min: z.int().min(1) }),
  z.strictObject({ type: z.literal("hospitalBagComplete") }),
  z.strictObject({ type: z.literal("favoriteName") }),
]);

export const badgeSchema = z.strictObject({
  id: contentId,
  name: text,
  emoji: z.string().min(1),
  description: text,
  rule: badgeRuleSchema,
});

export const surpriseEffects = ["confetti", "balloons", "heartbeat"] as const;

export const surpriseSchema = z.strictObject({
  week: contentWeek,
  emoji: z.string().min(1),
  effect: z.enum(surpriseEffects),
  title: text,
  text,
  /** Internal source for the fact in the text (not shown). */
  source: text,
});

export const librarySections = ["topics", "normal", "rights"] as const;

export const libraryEntrySchema = z.strictObject({
  title: text,
  text,
  /** For "what's normal": when to contact the doctor or the delivery room. */
  whenToCall: text.optional(),
  /** An official page to read more (opened only when the user taps it). */
  link: z.strictObject({ label: text, url: z.url({ protocol: /^https$/ }) }).optional(),
});

export const libraryTopicSchema = z.strictObject({
  id: contentId,
  section: z.enum(librarySections),
  icon: z.string().min(1),
  title: text,
  intro: text,
  entries: z.array(libraryEntrySchema).min(1),
  sources: textList,
});

export const weeksSchema = uniqueBy(weekSchema, "week");
export const dailySchema = uniqueBy(dailyItemSchema, "day");
export const testsSchema = uniqueBy(medicalTestSchema, "id");
export const hospitalBagSchema = uniqueBy(hospitalBagItemSchema, "id").min(1);
export const badgesSchema = uniqueBy(badgeSchema, "id").min(1);
export const surprisesSchema = uniqueBy(surpriseSchema, "week").min(1);
export const librarySchema = uniqueBy(libraryTopicSchema, "id").min(1);

export type WeekContent = z.infer<typeof weekSchema>;
export type DailyItem = z.infer<typeof dailyItemSchema>;
export type MedicalTest = z.infer<typeof medicalTestSchema>;
export type HospitalBagItem = z.infer<typeof hospitalBagItemSchema>;
export type BadgeRule = z.infer<typeof badgeRuleSchema>;
export type Badge = z.infer<typeof badgeSchema>;
export type Surprise = z.infer<typeof surpriseSchema>;
export type LibraryTopic = z.infer<typeof libraryTopicSchema>;

/** testIds in weekly summaries that do not exist in tests.json. */
export const findUnknownTestIds = (weeks: WeekContent[], tests: MedicalTest[]) => {
  const known = new Set(tests.map((test) => test.id));
  return [...new Set(weeks.flatMap((week) => week.testIds))].filter((id) => !known.has(id));
};

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
