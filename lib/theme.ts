// The theme is a small device preference, so it lives in localStorage (not IndexedDB):
// the inline script below can apply it before the first paint.

export type ThemePreference = "light" | "dark" | "auto";

export const THEME_STORAGE_KEY = "willbaby-theme";

export const parseThemePreference = (value: string | null): ThemePreference =>
  value === "light" || value === "dark" ? value : "auto";

export function readThemePreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch (error) {
    console.error("Reading the theme preference failed", error);
    return "auto";
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
    if (preference === "auto") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (error) {
    console.error("Saving the theme preference failed", error);
  }
}

// Runs in <head> before paint; if storage is unavailable the page simply follows the OS theme.
export const themeInitScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
