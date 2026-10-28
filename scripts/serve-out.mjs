// Minimal static server for the exported app (maps /path to /path.html like the host does).
// Used by `npm run preview` (scripts/preview.mjs) and in-process by the Playwright global setup.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

async function resolveFile(root, urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^([/\\])+/, "");
  const candidates = [clean, `${clean}.html`, join(clean, "index.html")];
  for (const candidate of candidates) {
    const full = join(root, candidate);
    if (!full.startsWith(root)) continue;
    try {
      if ((await stat(full)).isFile()) return full;
    } catch {
      // Not this candidate; try the next one.
    }
  }
  return null;
}

/** Starts serving `dir` on `port`; resolves with the server once it listens. */
export function serveOut(dir, port) {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    const file = (await resolveFile(root, req.url)) ?? join(root, "404.html");
    res.writeHead(file.endsWith("404.html") && !req.url.startsWith("/404") ? 404 : 200, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
    });
    res.end(await readFile(file));
  });
  return new Promise((resolveServer) => server.listen(port, () => resolveServer(server)));
}
