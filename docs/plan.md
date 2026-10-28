# willBaby — Development Plan & Progress Tracker

Status marks: ✅ done and verified · 🔄 in progress · ⬜ not started · ❌ failed or needs a fix.
Mark ✅ only after tests, lint and build actually passed.

## Phase 0 — Foundation
- ✅ Next.js + TypeScript + Tailwind project, RTL (`dir="rtl"`, `lang="he"`), Rubik font
- ✅ Theme tokens for light/dark (see `docs/design.md`)
- ✅ "Coming soon" home page with the will·B·aby logo text
- ✅ `lib/pregnancy.ts` + Vitest tests for every calculation method and edge case
- ✅ Dexie schema (`lib/db.ts`) + `StorageAdapter` interface and IndexedDB implementation
- ✅ Zod schemas for content (`content/schema.ts`), validated at build time (`prebuild`), including completeness
- ✅ GitHub repository (github.com/uriamelaku/willBaby) + Vercel deployment at https://will-baby.vercel.app (`vercel.json` serves the static export from `out/`)

## Phase 1 — MVP (core + basic tools)
- ✅ Onboarding: role, names, calculation method, number of babies, optional sex and name, "wow" screen
- ✅ "Today" screen: week+day, fruit, countdown, progress bar, daily item, fact card, upcoming appointments (tool shortcuts come with the phase 2 tools)
- ✅ Weekly summary with navigation between weeks and role-based version
- ✅ Bottom navigation: Today · Week · Journal · Tools · More
- ✅ Content: 42 weekly summaries + 294 daily items (pregnant + partner versions); a draft to review against official sources
- ✅ Journal + mood (1–5)
- ✅ Belly photos: one per week, compression, timeline gallery
- ✅ Tests by week + appointments linked to tests; upcoming ones on "Today"
- ✅ WhatsApp share (Web Share API, `wa.me` fallback)
- ✅ Backup and restore (JSON file) + backup reminder every 4 weeks + `navigator.storage.persist()`
- ✅ PWA: manifest, icons, offline support (hand-written service worker)
- ✅ Dark mode (automatic + manual toggle) and medical disclaimer
- ✅ Update the due date (e.g. after an ultrasound) with history, and delete all data from More
- ✅ Playwright tests for onboarding, Today, backup/restore

## Phase 2 — Tools & gamification
- ✅ Kick counter
- ✅ Contraction timer
- ⬜ Weight tracking with chart
- ⬜ Hospital bag checklist (default + custom items, in-app reminder from week 32)
- ⬜ Baby names list with two-person voting on one device ("whose turn")
- ⬜ Badges (`checkAchievements`)
- ⬜ Weekly surprises (weeks 12, 20, 24, 30, 37, 40)
- ⬜ Family bets + winner scoring
- ⬜ Sex reveal screen

## Phase 3 — After birth
- ⬜ "The baby is born" screen (date, time, weights, name)
- ⬜ Pregnancy summary and album (photos, journal, badges, bets winner)
- ⬜ Export album as image or PDF

## Future (not planned yet — do not start without approval)
- Sync and shared account between partners (new `StorageAdapter`, e.g. Supabase)
- Family bets via a shared link
- Notifications (push / email)
- More languages
- Baby mode (first year)
- Original SVG fruit illustrations instead of emoji
- Gentle "stop tracking" screen

## Deployment to Vercel (only with explicit approval)
1. Push the project to GitHub (with permission).
2. Vercel: Add New → Project → select the repository; Next.js is detected automatically.
3. `next.config.ts` uses `output: "export"`; `vercel.json` makes Vercel run `npm run build` (content check + service worker) and serve `out/` as a static site with clean URLs.
4. Address: https://will-baby.vercel.app (`willbaby` was taken).
5. Every push to `main` deploys to production; every branch gets a Preview URL.
6. After deploying: install to home screen on Android and iPhone, test in airplane mode.
