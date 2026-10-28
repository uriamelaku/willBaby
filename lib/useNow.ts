"use client";

import { useEffect, useState } from "react";

/** The current time, refreshed every `intervalMs` while `active` (for running timers). */
export function useNow(active: boolean, intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);
  return now;
}
