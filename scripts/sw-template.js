// Service worker template; scripts/build-sw.mjs fills in the version and file list after `next build`.
// It caches app files only. User data lives in IndexedDB and is never fetched or cached here.

const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const CACHE_NAME = `willbaby-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith("willbaby-") && key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const isImmutableAsset = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    // Offline navigation to a page that was not cached: open the start page instead.
    if (request.mode === "navigate") {
      const start = await caches.match("/");
      if (start) return start;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(isImmutableAsset(url) ? cacheFirst(event.request) : networkFirst(event.request));
});
