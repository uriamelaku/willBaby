# willBaby — Architecture, Screens & Data Model

## Overview
A static Next.js export: all logic runs in the browser and all data stays on the device. No server, no cost, and no medical data leaves the phone.

## Screens and flow
**Onboarding (once):**
1. Welcome screen with the logo and "let's start"
2. Role: "I'm pregnant" / "my partner is pregnant"
3. Names (mine, partner's optional)
4. Calculation method: LMP / due date / IVF (transfer date + embryo day 3 or 5)
5. Number of babies (1, 2, 3+), optional sex and name
6. "Wow" screen: "You're in week 14+3! The baby is the size of a lemon"

**Bottom navigation:**
| Tab | Contents |
| --- | --- |
| Today | week+day, fruit of the week, countdown, daily item, surprising fact, tool shortcuts, upcoming appointments |
| Week | weekly summary: baby, body, tips, partner corner, relevant tests; previous/next week |
| Journal | entries, mood, weekly belly photos, "the belly grows" gallery |
| Tools | kicks, contractions, weight, hospital bag, names, appointments & tests, family bets |
| More | settings, badges, backup & restore, edit pregnancy details, about & disclaimer |

**Special screens:** sex reveal, weekly surprise (full screen, once), "the baby is born" (from week 37), summary & album.

## Pregnancy logic (`lib/pregnancy.ts`)
```ts
const daysPregnant = differenceInCalendarDays(today, lmpDate); // 0..300
const week = Math.floor(daysPregnant / 7);   // completed weeks
const dayOfWeek = daysPregnant % 7;          // 0..6, shown as "14+3"
const contentWeek = clamp(week + 1, 1, 42);  // "the 15th week"
const daysLeft = differenceInCalendarDays(dueDate, today);
const progress = clamp(daysPregnant / 280, 0, 1);
const trimester = week < 14 ? 1 : week < 28 ? 2 : 3;
```
Edge cases: before week 4 → gentle "still early" content; after 40 → "any day now" content for weeks 41–42; after 42 → offer "is the baby born?"; validation: day 0 must be 0–300 days before today.

## Data model (Dexie / IndexedDB)
Every record: `id` (UUID), `createdAt`, `updatedAt` (ISO timestamps). Calendar dates (`lmpDate`, `dueDate`, journal and appointment dates) are stored as local `YYYY-MM-DD` strings so they never shift across time zones or in backups.

Schema version 1 holds the MVP tables (`profile`, `pregnancy`, `babies`, `journal`, `photos`, `appointments`, `settings`); the other tables are added in later Dexie versions together with their features.

| Table | Main fields |
| --- | --- |
| `profile` | name, role (`pregnant` / `partner`), partnerName |
| `pregnancy` | method (`lmp` / `due` / `ivf3` / `ivf5`), inputDate, lmpDate, dueDate, babiesCount, dueDateHistory[], status (`active` / `born`) |
| `babies` | index, sex (`unknown` / `boy` / `girl`), name, revealedAt |
| `birth` | date, time, weights[], notes |
| `journal` | date, week, text, mood (1–5), tags[] |
| `photos` | week, blob (compressed), caption, takenAt |
| `weights` | date, kg |
| `kickSessions` | startedAt, endedAt, kicks[] |
| `contractions` | sessionId, startedAt, endedAt |
| `appointments` | title, date, time, place, linkedTestId, done, notes |
| `checklist` | listType (`hospitalBag`), itemId, custom, checked |
| `names` | name, sex, votes {me, partner} (−1/0/1), favorite |
| `bets` | guesserName, dueDateGuess, weightGuess, sexGuess, nameGuess |
| `badges` | badgeId, earnedAt, seenAt |
| `settings` | seenSurprises[], disclaimerAcceptedAt, schemaVersion (the theme is a device preference in localStorage) |

**Backup:** export all tables to `willbaby-backup-YYYY-MM-DD.json` (photos as Base64, or ZIP when large). Import checks `schemaVersion` and runs migrations. Until sync exists, this is also how data moves to the partner's phone.

## Gamification logic
`checkAchievements(state)` runs on app open and after every save, returning new badges/surprises not yet seen. Badge rules come from a closed list of conditions (no free code).

Family bets scoring (lowest wins; twins compare with the average weight):
```ts
score = |guessDate − birthDate| (days)
      + |guessKg − birthKg| × 10
      − (sexCorrect ? 3 : 0) − (nameCorrect ? 10 : 0)
```

## Folder structure
```text
willbaby/
├─ app/                      # pages (App Router)
│  ├─ layout.tsx             # dir="rtl", lang="he", fonts, theme
│  ├─ page.tsx               # redirects to onboarding or today
│  ├─ onboarding/  today/  journal/  reveal/  born/
│  ├─ week/[n]/page.tsx      # static for 1..42 (generateStaticParams)
│  ├─ tools/                 # kicks, contractions, weight, bag, names, appointments, bets
│  ├─ more/                  # settings, badges, backup, about
│  ├─ manifest.ts
│  └─ sw.ts                  # service worker (Serwist)
├─ features/                 # logic + UI per feature
├─ components/ui/            # Button, Card, Sheet, Tabs, BottomNav, WeekFruit
├─ lib/                      # pregnancy, db, storage/, achievements, text, backup
├─ content/he/               # weeks, daily, tests, badges, surprises, hospitalBag
├─ content/schema.ts         # Zod schemas
├─ messages/he.json          # UI texts (next-intl)
├─ public/icons/             # PWA icons 192/512 + maskable
├─ tests/                    # Vitest + Playwright
└─ next.config.ts            # output: "export" + Serwist
```

## Risks
| Risk | Mitigation |
| --- | --- |
| Browser data cleared / new phone | backup reminder every 4 weeks, `navigator.storage.persist()` |
| iOS clears storage of sites not opened for a long time | install as PWA, explain on the backup screen |
| Inaccurate medical info | official sources per fact, general wording, disclaimer on every medical screen |
| Photo storage size | compression + show used storage in settings |
