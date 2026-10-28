"use client";

import { useSyncExternalStore } from "react";
import { readThemePreference, saveThemePreference, type ThemePreference } from "@/lib/theme";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The saved theme preference; "auto" during prerender, the stored value in the browser. */
export function useThemePreference() {
  const preference = useSyncExternalStore(subscribe, readThemePreference, () => "auto" as const);

  const setPreference = (next: ThemePreference) => {
    saveThemePreference(next);
    listeners.forEach((listener) => listener());
  };

  return [preference, setPreference] as const;
}
