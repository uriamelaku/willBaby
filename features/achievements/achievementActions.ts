import { bagProgress, isBagComplete } from "@/features/hospitalBag/hospitalBag";
import { checkAchievements, toEarnedBadge, type AchievementState } from "@/features/achievements/achievements";
import { getBadges, getHospitalBagItems } from "@/lib/content";
import { findPregnancyStatus, parseLocalDate } from "@/lib/pregnancy";
import type { StorageAdapter } from "@/lib/storage/types";

async function loadAchievementState(storage: StorageAdapter, now: Date): Promise<AchievementState> {
  const [pregnancies, photos, journal, kickSessions, checklist, names] = await Promise.all([
    storage.list("pregnancy"),
    storage.list("photos"),
    storage.list("journal"),
    storage.list("kickSessions"),
    storage.list("checklist"),
    storage.list("names"),
  ]);
  const [pregnancy] = pregnancies;
  return {
    onboarded: pregnancy !== undefined,
    week: pregnancy ? (findPregnancyStatus(parseLocalDate(pregnancy.lmpDate), now)?.week ?? 0) : 0,
    photos: photos.length,
    journalDates: journal.map((entry) => entry.date),
    finishedKickSessions: kickSessions.filter((session) => session.endedAt).length,
    hospitalBagComplete: isBagComplete(bagProgress(getHospitalBagItems(), checklist)),
    hasFavoriteName: names.some((name) => name.favorite),
  };
}

/** Saves the badges earned since the last check; runs on app open and after every write. */
export async function awardNewBadges(storage: StorageAdapter, now: Date): Promise<void> {
  const [state, earned] = await Promise.all([loadAchievementState(storage, now), storage.list("badges")]);
  for (const badge of checkAchievements(getBadges(), state, earned)) {
    await storage.save("badges", toEarnedBadge(badge, now));
  }
}
