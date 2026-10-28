// Serves the static export locally: node scripts/preview.mjs [dir=out] [port=4173]
import { resolve } from "node:path";
import { serveOut } from "./serve-out.mjs";

const [dir = "out", port = "4173"] = process.argv.slice(2);
await serveOut(dir, Number(port));
console.log(`Serving ${resolve(dir)} on http://localhost:${port}`);
