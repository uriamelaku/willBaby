import { describe, expect, it } from "vitest";
import { parseThemePreference, themeInitScript } from "@/lib/theme";

describe("parseThemePreference", () => {
  it.each(["light", "dark", "auto"] as const)("keeps %s", (value) => {
    expect(parseThemePreference(value)).toBe(value);
  });

  it.each([null, "", "blue"])("falls back to light for %j", (value) => {
    expect(parseThemePreference(value)).toBe("light");
  });
});

describe("themeInitScript", () => {
  /** Runs the inline script against a fake document and storage; returns data-theme. */
  const run = (stored: string | null, storageThrows = false) => {
    const dataset: { theme?: string } = {};
    const localStorage = {
      getItem: () => {
        if (storageThrows) throw new Error("blocked");
        return stored;
      },
    };
    new Function("document", "localStorage", themeInitScript)(
      { documentElement: { dataset } },
      localStorage,
    );
    return dataset.theme;
  };

  it("applies light by default and when storage is unavailable", () => {
    expect(run(null)).toBe("light");
    expect(run(null, true)).toBe("light");
  });

  it("applies a saved dark or light choice", () => {
    expect(run("dark")).toBe("dark");
    expect(run("light")).toBe("light");
  });

  it("leaves auto to the operating system", () => {
    expect(run("auto")).toBeUndefined();
  });
});
