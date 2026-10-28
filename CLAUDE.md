# willBaby — Project Plan & Claude Instructions

## Goal
Build a mobile-first Hebrew (RTL) pregnancy-tracking PWA. Every day it shows a tip or fact, and every week a full summary (baby development, body changes, tips, partner corner, relevant tests), in a warm tone with a touch of humor. Initially for personal use, with a structure that can later open to the public. Prioritize a working, simple product over extra features.

Name and logo: **will·B·aby** — the shared "B" reads as both "will Be" and "Baby". The B is drawn as a pregnant-belly silhouette in the brand color.

## Decisions (approved)
- **Users and roles:** at onboarding the user picks a role: `pregnant` or `partner`. Content and wording adapt to the role.
- **Language:** Hebrew only for now, with a structure ready for more languages (next-intl, `messages/he.json`, `content/he/`).
- **Pregnancy calculation:** all input methods convert to one "day 0" (LMP), and everything derives from it. Full term = 280 days.
  - LMP: day 0 = entered date; due = day 0 + 280.
  - Due date: day 0 = due − 280.
  - IVF day-5 transfer: day 0 = transfer − 19; due = transfer + 261.
  - IVF day-3 transfer: day 0 = transfer − 17; due = transfer + 263.
  - Display both "week 14+3" and "the 15th week". Content weeks 1–42.
  - Due date can be updated after an ultrasound; keep a history of changes.
  - All dates use the device's local calendar date (not UTC), so the day changes at local midnight.
- **Multiples:** one baby, twins, or more, supported from the start (plural wording, `twinsNote` content).
- **Content:** a fixed, curated content bank (no AI generation): 42 weekly summaries + 294 daily items (42 × 7), each with a pregnant and a partner version. The daily item is chosen by `daysPregnant`, so it is stable for the day.
- **Tone:** warm with humor. No scare tactics, no "must".
- **Medical content:** tests by week per common Israeli practice + appointment management. General information only, an internal `source` for every fact (Ministry of Health, health funds), and a visible disclaimer on every medical screen: the app does not diagnose or give medical advice. No professional review is planned.
- **Baby's sex:** optional, with a reveal screen. Wording adapts (he/she) after it is set; otherwise neutral.
- **Tools:** journal + mood, weekly belly photos, kick counter, contraction timer, weight tracking, hospital bag checklist, baby names list with voting.
- **MVP scope:** core + basic tools (onboarding, Today, weekly summary, content, journal, belly photos, tests and appointments, WhatsApp share, backup, PWA, dark mode). The other tools, gamification and sex reveal come in phase 2 (see `docs/plan.md`).
- **Notifications:** none for now. Upcoming tests and appointments show inside the app only.
- **Sharing:** share a fact or tip to WhatsApp (Web Share API, fallback `wa.me/?text=`).
- **Gamification:** milestone badges, one-time surprises in special weeks, family bets entered manually on one device.
- **After birth:** "the baby is born" screen + pregnancy summary and album now; a baby mode in the future.
- **Data:** stored locally only (IndexedDB via Dexie). No accounts, no Google, no server. Backup and restore to a JSON file. Code goes through one `StorageAdapter` so a sync backend can be added later without touching the rest.
- **No analytics** for now.
- **No "stop tracking" screen** in the MVP (later phase). Until then, data can be deleted from settings.
- **Platform:** PWA, installable to the home screen and working offline.
- **Design:** illustrated and cute, fruit emoji for the baby's size, automatic dark mode + manual toggle, font Rubik.
- **Budget:** free only. Deploy to Vercel at `willbaby.vercel.app` (or the closest free name).

- **Developer:** the user is an experienced developer; explanations can be technical and concise.

## Tech stack
- Next.js (App Router) + TypeScript, static export (`output: "export"`).
- Tailwind CSS with RTL (`dir="rtl"`, logical classes `ms-`/`me-`), own UI components.
- Zustand (state), Dexie.js (IndexedDB), localStorage only for small preferences.
- date-fns (dates), Recharts (weight chart), Framer Motion (animations).
- PWA: hand-written service worker generated after build (`scripts/build-sw.mjs`; Serwist was evaluated but needs a Turbopack workaround plus esbuild/swc), Zod (content and backup validation), next-intl (texts).
- Vitest (logic) + Playwright (main flows).
- Git/GitHub; Vercel connected to the repository.

## Architecture & data rules
- Fully client-side; no server, no API routes for now.
- Feature-based structure: each tool in `features/<name>/` with its components, hooks and logic; `app/` pages only compose them.
- All persistence goes through `StorageAdapter`; never call Dexie directly from UI components.
- Every user record has `id` (UUID), `createdAt`, `updatedAt` to allow future sync/merge.
- Schema changes go through Dexie versions (`db.version(n).stores(...)`) with an `upgrade` function; `settings.schemaVersion` is checked on backup import.
- Content lives in `content/he/*.json` and is validated with Zod at build time; invalid or missing content fails the build.
- Texts use variables, never hard-coded gender: `{baby}`, `{you}`, `{partnerName}`; one function builds the final wording by role, sex and number of babies.
- Belly photos are compressed in the browser before saving (max width 1080px, JPEG 0.8).
- The service worker caches app assets only, never user data.
- Accessibility: AA contrast, touch targets ≥ 44px, `aria-label` for emoji, respect `prefers-reduced-motion`.

## Working rules for Claude
Follow this file as the project source of truth; propose edits when decisions change.

**Workflow**
- Work in small, verifiable steps; complete and verify each step before the next. Follow the phases in `docs/plan.md`; do not implement unrequested features or future phases early.
- Before a significant change, briefly state what will be changed.
- Keep every change runnable and testable locally (`npm run dev`, `npm test`, `npm run build`).

**Code quality**
- Treat this as a real product maintained over time, but avoid overengineering.
- Clean, readable, maintainable code following React/TypeScript/Next.js best practices. Prefer the simplest solution that works (KISS).
- No duplication (DRY): reuse existing components and functions. No speculative features or abstractions (YAGNI).
- Clear, descriptive names for variables, functions and components.
- Small functions with a single clear responsibility, without excessive splitting.
- Keep business logic, data access and UI separate.
- Comment only where the code is not self-explanatory. Handle errors explicitly; never swallow them silently.
- Do not rewrite working code or optimize without a concrete need.
- Do not add frameworks, libraries, services or dependencies without a clear reason. Ask before major architectural changes.
- If you spot a problem or a better approach, present it with a recommendation instead of silently changing course.

**Testing**
- Run relevant tests, lint and build after changes, and fix errors before considering a task complete.
- Never claim tests passed unless they were actually executed.
- Write tests for important logic, especially pregnancy date calculations, content selection, backup/restore and badge rules.

**Security & privacy**
- No user data leaves the device. No trackers, no analytics, no third-party calls with user data.
- Never expose or commit API keys, secrets or `.env` files with real values.
- Validate all input, including imported backup files.

**Data**
- Explain significant data-model changes before applying them.
- Never delete user data or write a destructive migration without explicit approval.

**Git**
- Commit locally after each verified step.
- **Never push to GitHub (any branch, including `main`) without explicit permission.** A local commit does not authorize a push.
- At the end of each task, mention any commits that are not yet pushed (without asking to push).
- Never merge to `main` or open a pull request without explicit approval.

**Deployment**
- Never deploy to production, activate paid services, or change external infrastructure (Vercel, domains) without explicit approval.

**Communication**
- Communicate in Hebrew; keep explanations short, clear and practical.
- After each task, summarize what changed, what was tested, remaining issues or risks, and the next step.

**Progress tracking**
- The development plan and its progress tracker live in `docs/plan.md`. Keep the tracker up to date as work progresses.
- In every significant update and every summary, show the tracker list with a status mark next to each item: ✅ done and verified, 🔄 in progress, ⬜ not started, ❌ failed or needs a fix.
- Mark ✅ only after the item is implemented and its tests, lint and build actually passed.

## First implementation task
Phase 0 in `docs/plan.md`: create the Next.js + TypeScript + Tailwind skeleton with RTL, Hebrew lang, Rubik font and light/dark theme tokens; a single "coming soon" home page with the will·B·aby logo text; `lib/pregnancy.ts` with Vitest tests for all calculation methods and edge cases. Do not implement other features in this task.
