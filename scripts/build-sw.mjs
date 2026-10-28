// Writes out/sw.js after `next build`: the template plus a list of every exported file
// and a version hash of their contents, so each deploy gets a fresh cache.
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = fileURLToPath(new URL("../out/", import.meta.url));
const template = await readFile(new URL("./sw-template.js", import.meta.url), "utf-8");

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

/** Public URL of an exported file; pages are served without ".html" (and index.html as its folder). */
function urlFor(relativePath) {
  const path = `/${relativePath.split(sep).join("/")}`;
  if (path === "/index.html") return "/";
  if (path.endsWith("/index.html")) return path.slice(0, -"index.html".length);
  return path.endsWith(".html") ? path.slice(0, -".html".length) : path;
}

// Error pages answer with a 404 status, which would make cache.addAll (and the install) fail.
const skipped = (path) => /(^|[\\/])(sw\.js|404\.html|_not-found.*)$/.test(path);
const files = (await listFiles(outDir)).filter((file) => !skipped(relative(outDir, file))).sort();
const hash = createHash("sha256");
for (const file of files) {
  hash.update(relative(outDir, file));
  hash.update(await readFile(file));
}
const version = hash.digest("hex").slice(0, 12);
const urls = files.map((file) => urlFor(relative(outDir, file)));

await writeFile(
  join(outDir, "sw.js"),
  template.replace("__VERSION__", version).replace("__PRECACHE__", JSON.stringify(urls, null, 2)),
);
console.log(`Service worker: ${urls.length} files precached, version ${version}`);
