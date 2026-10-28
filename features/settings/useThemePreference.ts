"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  readThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The saved theme preference; the default during prerender, the stored value in the browser. */
export function useThemePreference() {
  const preference = useSyncExternalStore(subscribe, readThemePreference, () => DEFAULT_THEME);

  const setPreference = (next: ThemePreference) => {
    saveThemePreference(next);
    listeners.forEach((listener) => listener());
  };

  return [preference, setPreference] as const;
}
