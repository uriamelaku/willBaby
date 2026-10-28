"use client";

import { useEffect, useState } from "react";

/** Milliseconds until the next local midnight. */
export function msUntilMidnight(now: Date): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

/**
 * The current time, refreshed at local midnight and whenever the app comes back to the foreground,
 * so an app left open (or resumed from the background) never shows yesterday's numbers.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setToday(new Date());
    const onVisibility = () => document.visibilityState === "visible" && refresh();
    let timer = setTimeout(function tick() {
      refresh();
      timer = setTimeout(tick, msUntilMidnight(new Date()) + 1000);
    }, msUntilMidnight(new Date()) + 1000);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return today;
}
