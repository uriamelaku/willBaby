"use client";

import { useEffect, useState } from "react";
import {
  nextDailyTipIndex,
  readDailyTipPosition,
  saveDailyTipPosition,
  type DailyTipPosition,
} from "./dailyTip";

/** The index of the day's item to show, and a way to move to the next one. */
export function useDailyTip(day: number, count: number) {
  // The initializer only reads, so React's double call in development does not skip an item.
  const [position, setPosition] = useState<DailyTipPosition>(() => ({
    day,
    index: nextDailyTipIndex(readDailyTipPosition(), day, count),
  }));
  // Past midnight (Today stays open) the new day starts from its first item.
  const index = position.day === day && position.index < count ? position.index : 0;

  useEffect(() => {
    saveDailyTipPosition({ day, index });
  }, [day, index]);

  const showNext = () => setPosition({ day, index: (index + 1) % count });

  return { index, showNext };
}
