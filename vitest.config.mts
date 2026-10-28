import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Fixed zone (UTC+2/+3 with DST) so local-vs-UTC date tests are deterministic.
    env: { TZ: "Asia/Jerusalem" },
  },
});
