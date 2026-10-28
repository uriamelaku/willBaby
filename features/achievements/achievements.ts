import { addDays } from "date-fns";
import type { Badge, BadgeRule } from "@/content/schema";
import { formatLocalDate, parseLocalDate } from "@/lib/pregnancy";
import type { CalendarDate, EarnedBadge, RecordInput } from "@/lib/storage/types";

/** What the badge rules look at; built from storage by `loadAchievementState`. */
export interface AchievementState {
  onboarded: boolean;
  /** Completed pregnancy weeks (the "14" in 14+3). */
  week: number;
  photos: number;
  journalDates: CalendarDate[];
  finishedKickSessions: number;
  hospitalBagComplete: boolean;
  hasFavoriteName: boolean;
}

/** The longest run of consecutive calendar days among the dates (duplicates count once). */
export function longestStreak(dates: CalendarDate[]): number {
  const unique = new Set(dates);
  let longest = 0;
  for (const date of unique) {
    const previous = formatLocalDate(addDays(parseLocalDate(date), -1));
    if (unique.has(previous)) continue; // Not the start of a run.
    let length = 1;
    let day = parseLocalDate(date);
    while (unique.has(formatLocalDate((day = addDays(day, 1))))) length++;
    longest = Math.max(longest, length);
  }
  return longest;
}

export function meetsRule(rule: BadgeRule, state: AchievementState): boolean {
  switch (rule.type) {
    case "onboarded":
      return state.onboarded;
    case "week":
      return state.week >= rule.min;
    case "photos":
      return state.photos >= rule.min;
    case "journalStreak":
      return longestStreak(state.journalDates) >= rule.days;
    case "kickSessions":
      return state.finishedKickSessions >= rule.min;
    case "hospitalBagComplete":
      return state.hospitalBagComplete;
    case "favoriteName":
      return state.hasFavoriteName;
  }
}

/** Badges earned now that were not earned before. Earned badges are kept even if the condition stops holding. */
export const checkAchievements = (badges: Badge[], state: AchievementState, earned: EarnedBadge[]) => {
  const earnedIds = new Set(earned.map((badge) => badge.badgeId));
  return badges.filter((badge) => !earnedIds.has(badge.id) && meetsRule(badge.rule, state));
};

export const toEarnedBadge = (badge: Badge, now: Date): RecordInput<"badges"> => ({
  badgeId: badge.id,
  earnedAt: now.toISOString(),
});

/** Earned badges the user has not seen yet, in content order. */
export const unseenBadges = (badges: Badge[], earned: EarnedBadge[]) => {
  const unseen = new Set(earned.filter((badge) => !badge.seenAt).map((badge) => badge.badgeId));
  return badges.filter((badge) => unseen.has(badge.id));
};
