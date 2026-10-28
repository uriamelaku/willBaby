import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // Fixed zone (UTC+2/+3 with DST) so local-vs-UTC date tests are deterministic.
    env: { TZ: "Asia/Jerusalem" },
  },
});
