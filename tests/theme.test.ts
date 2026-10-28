import { describe, expect, it } from "vitest";
import { parseThemePreference } from "@/lib/theme";

describe("parseThemePreference", () => {
  it("keeps light and dark", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });

  it.each([null, "auto", "", "blue"])("falls back to auto for %j", (value) => {
    expect(parseThemePreference(value)).toBe("auto");
  });
});
