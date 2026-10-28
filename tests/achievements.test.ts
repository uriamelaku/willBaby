import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { Badge } from "@/content/schema";
import { awardNewBadges } from "@/features/achievements/achievementActions";
import badges from "@/content/he/badges.json";
import {
  checkAchievements,
  longestStreak,
  meetsRule,
  toEarnedBadge,
  unseenBadges,
  type AchievementState,
} from "@/features/achievements/achievements";
import { WillBabyDb } from "@/lib/db";
import { createIndexedDbStorage } from "@/lib/storage/indexedDb";
import type { EarnedBadge } from "@/lib/storage/types";

const allBadges = badges as Badge[];

const empty: AchievementState = {
  onboarded: false,
  week: 0,
  photos: 0,
  journalDates: [],
  finishedKickSessions: 0,
  hospitalBagComplete: false,
  hasFavoriteName: false,
};

const earned = (badgeId: string, seenAt?: string): EarnedBadge => ({
  id: badgeId,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  badgeId,
  earnedAt: "2026-09-01T10:00:00.000Z",
  seenAt,
});

const ids = (list: Badge[]) => list.map((badge) => badge.id);

describe("longestStreak", () => {
  it("counts consecutive local dates, ignoring duplicates and order", () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak(["2026-03-01"])).toBe(1);
    expect(longestStreak(["2026-03-03", "2026-03-01", "2026-03-02", "2026-03-02", "2026-03-05"])).toBe(3);
  });

  it("crosses month ends and the DST change", () => {
    expect(longestStreak(["2026-02-27", "2026-02-28", "2026-03-01"])).toBe(3);
    expect(longestStreak(["2026-03-26", "2026-03-27", "2026-03-28", "2026-03-29"])).toBe(4);
  });
});

describe("badge rules", () => {
  it.each([
    [{ type: "onboarded" } as const, { onboarded: true }],
    [{ type: "week", min: 14 } as const, { week: 14 }],
    [{ type: "photos", min: 5 } as const, { photos: 5 }],
    [{ type: "journalStreak", days: 2 } as const, { journalDates: ["2026-03-01", "2026-03-02"] }],
    [{ type: "kickSessions", min: 1 } as const, { finishedKickSessions: 1 }],
    [{ type: "hospitalBagComplete" } as const, { hospitalBagComplete: true }],
    [{ type: "favoriteName" } as const, { hasFavoriteName: true }],
  ])("%j is met only when its condition holds", (rule, patch) => {
    expect(meetsRule(rule, empty)).toBe(false);
    expect(meetsRule(rule, { ...empty, ...patch })).toBe(true);
  });

  it("week badges need completed weeks", () => {
    expect(meetsRule({ type: "week", min: 20 }, { ...empty, week: 19 })).toBe(false);
  });
});

describe("checkAchievements", () => {
  it("returns every badge earned at once for a user who joins mid-pregnancy", () => {
    const state = { ...empty, onboarded: true, week: 21 };
    expect(ids(checkAchievements(allBadges, state, []))).toEqual(["welcome", "first-trimester", "halfway"]);
  });

  it("does not return badges already earned", () => {
    const state = { ...empty, onboarded: true, week: 21 };
    expect(ids(checkAchievements(allBadges, state, [earned("welcome"), earned("halfway")]))).toEqual([
      "first-trimester",
    ]);
  });

  it("builds the earned record and lists unseen badges in content order", () => {
    expect(toEarnedBadge(allBadges[0], new Date("2026-09-01T10:00:00.000Z"))).toEqual({
      badgeId: "welcome",
      earnedAt: "2026-09-01T10:00:00.000Z",
    });
    const list = [earned("halfway"), earned("welcome", "2026-09-02T10:00:00.000Z"), earned("first-trimester")];
    expect(ids(unseenBadges(allBadges, list))).toEqual(["first-trimester", "halfway"]);
  });
});

describe("awardNewBadges", () => {
  it("saves each new badge once, from the data in storage", async () => {
    const db = new WillBabyDb(`test-${crypto.randomUUID()}`);
    const storage = createIndexedDbStorage(db);
    const now = new Date(2026, 9, 28, 12, 0);
    try {
      await storage.save("pregnancy", {
        method: "lmp",
        inputDate: "2026-07-13",
        lmpDate: "2026-07-13",
        dueDate: "2027-04-19",
        babiesCount: 1,
        dueDateHistory: [],
        status: "active",
      });
      await storage.save("names", { name: "נגה", sex: "girl", votes: {}, favorite: true });
      await storage.save("kickSessions", { startedAt: now.toISOString(), kicks: [] });

      await awardNewBadges(storage, now);
      await awardNewBadges(storage, now);

      const saved = (await storage.list("badges")).map((badge) => badge.badgeId).sort();
      // Week 15+2: welcome and first trimester; the running kick session does not count yet.
      expect(saved).toEqual(["first-trimester", "we-have-a-name", "welcome"]);
    } finally {
      await db.delete();
    }
  });
});
