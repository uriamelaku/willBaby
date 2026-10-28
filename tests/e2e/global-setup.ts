import { existsSync } from "node:fs";
import { serveOut } from "../../scripts/serve-out.mjs";

export const E2E_PORT = 4173;

// Serves the static export inside the test runner process, so stopping it never depends on
// killing a child process (which hangs on Windows).
export default async function globalSetup() {
  if (!existsSync("out/index.html")) {
    throw new Error("No build found in out/. Run `npm run build` (or `npm run test:e2e`) first.");
  }
  const server = await serveOut("out", E2E_PORT);
  return () =>
    new Promise<void>((resolve) => {
      server.closeAllConnections();
      server.close(() => resolve());
    });
}
