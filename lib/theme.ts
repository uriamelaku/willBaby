// The theme is a small device preference, so it lives in localStorage (not IndexedDB):
// the inline script below can apply it before the first paint.

export type ThemePreference = "light" | "dark" | "auto";

/** Used until the user picks a theme in More. */
export const DEFAULT_THEME: ThemePreference = "light";

export const THEME_STORAGE_KEY = "willbaby-theme";

export const parseThemePreference = (value: string | null): ThemePreference =>
  value === "light" || value === "dark" || value === "auto" ? value : DEFAULT_THEME;

export function readThemePreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch (error) {
    console.error("Reading the theme preference failed", error);
    return DEFAULT_THEME;
  }
}

/** "auto" removes the attribute, so the CSS follows prefers-color-scheme. */
export function applyThemePreference(preference: ThemePreference): void {
  if (preference === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = preference;
}

export function saveThemePreference(preference: ThemePreference): void {
  applyThemePreference(preference);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (error) {
    console.error("Saving the theme preference failed", error);
  }
}

// Runs in <head> before paint: light unless the user chose dark or auto (same rule as
// parseThemePreference). If storage is unavailable, the page stays light.
export const themeInitScript = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(t!=="auto")document.documentElement.dataset.theme=t==="dark"?"dark":"light"})()`;
