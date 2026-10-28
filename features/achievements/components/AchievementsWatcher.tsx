"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { Badge } from "@/content/schema";
import { awardNewBadges } from "@/features/achievements/achievementActions";
import { unseenBadges } from "@/features/achievements/achievements";
import { getBadges } from "@/lib/content";
import { onStorageChange, storage } from "@/lib/storage";

let running = false;
let pending = false;

/**
 * Awards new badges and returns the unseen ones. Runs one check at a time: a write during a check
 * (including its own) queues one more, and the call that found a check running returns undefined.
 */
async function checkBadges(): Promise<Badge[] | undefined> {
  if (running) {
    pending = true;
    return undefined;
  }
  running = true;
  try {
    do {
      pending = false;
      await awardNewBadges(storage, new Date());
    } while (pending);
    return unseenBadges(getBadges(), await storage.list("badges"));
  } finally {
    running = false;
  }
}

/** Checks for new badges on app open and after every write, and shows the unseen ones. */
export function AchievementsWatcher() {
  const t = useTranslations("badges");
  const [unseen, setUnseen] = useState<Badge[]>([]);
  // Closed in this session; their seenAt may still be saving while another check runs.
  const dismissed = useRef(new Set<string>());

  useEffect(() => {
    const refresh = () =>
      checkBadges()
        .then((list) => list && setUnseen(list.filter((badge) => !dismissed.current.has(badge.id))))
        .catch((error) => console.error("Checking badges failed", error));
    void refresh();
    return onStorageChange(() => void refresh());
  }, []);

  const markSeen = async () => {
    const seenAt = new Date().toISOString();
    const ids = new Set(unseen.map((badge) => badge.id));
    ids.forEach((id) => dismissed.current.add(id));
    setUnseen([]);
    try {
      const earned = await storage.list("badges");
      await Promise.all(
        earned
          .filter((record) => ids.has(record.badgeId) && !record.seenAt)
          .map((badge) => storage.save("badges", { ...badge, seenAt })),
      );
    } catch (error) {
      console.error("Marking badges as seen failed", error);
    }
  };

  if (unseen.length === 0) return null;

  // A toast rather than a modal, so it never blocks what the user is doing.
  return (
    <section
      role="status"
      aria-labelledby="new-badges-title"
      className="fixed inset-x-0 top-2 z-10 mx-auto w-[min(92vw,26rem)] rounded-card bg-card p-4 text-text shadow-lg motion-safe:animate-[toast-in_300ms_ease-out]"
    >
      <h2 id="new-badges-title" className="font-semibold">
        {t("newTitle", { count: unseen.length })}
      </h2>
      <ul className="my-3 flex flex-col gap-2">
        {unseen.map((badge) => (
          <li key={badge.id} className="flex items-center gap-3 rounded-2xl bg-mint-soft p-2">
            <span aria-hidden className="text-3xl">
              {badge.emoji}
            </span>
            <span className="flex flex-col">
              <span className="font-semibold">{badge.name}</span>
              <span className="text-sm text-muted">{badge.description}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button onClick={markSeen} className="w-full">
        {t("close")}
      </Button>
    </section>
  );
}
