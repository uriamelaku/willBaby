import { describe, expect, it } from "vitest";
import {
  MAX_HOME_SHORTCUTS,
  defaultShortcuts,
  homeShortcuts,
  toggleShortcut,
  withShortcuts,
} from "@/features/tools/tools";
import type { Settings } from "@/lib/storage/types";

const settings = (homeShortcuts?: string[]): Settings => ({
  id: "s",
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  schemaVersion: 2,
  homeShortcuts,
});

describe("home shortcuts", () => {
  it("defaults to the library and weight, adding kicks and contractions from week 28", () => {
    expect(defaultShortcuts(27)).toEqual(["library", "weight", "hospitalBag", "names"]);
    expect(defaultShortcuts(28)).toEqual(["library", "kicks", "contractions", "weight"]);
    expect(homeShortcuts(settings(), 20)).toEqual(defaultShortcuts(20));
    expect(homeShortcuts(undefined, 30)).toEqual(defaultShortcuts(30));
  });

  it("uses the user's choice once made, even an empty one, ignoring unknown ids", () => {
    expect(homeShortcuts(settings(["names", "kicks"]), 30)).toEqual(["names", "kicks"]);
    expect(homeShortcuts(settings([]), 30)).toEqual([]);
    expect(homeShortcuts(settings(["names", "old-tool"]), 30)).toEqual(["names"]);
  });

  it("adds in Tools order, removes, and refuses a fifth", () => {
    expect(toggleShortcut(["weight"], "kicks")).toEqual(["kicks", "weight"]);
    expect(toggleShortcut(["kicks", "weight"], "kicks")).toEqual(["weight"]);
    const full = defaultShortcuts(20);
    expect(full).toHaveLength(MAX_HOME_SHORTCUTS);
    expect(toggleShortcut(full, "bets")).toBeNull();
  });

  it("stores the choice on the settings record", () => {
    expect(withShortcuts({ schemaVersion: 2 }, ["bets"])).toEqual({ schemaVersion: 2, homeShortcuts: ["bets"] });
  });
});
