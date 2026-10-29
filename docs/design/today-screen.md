# "Today" screen — approved design

Visual reference: [`today-screen.html`](today-screen.html) (open in a browser; 390×844 phone frame, light theme, sample data for week 14+3).
Approved by the user on 2026-10-28 after comparing six directions ("1ד · השילוב" in the design canvas).

## Rules
- **Fits one phone screen without scrolling** (390×844). This is a hard requirement for the main screen.
- Style: "peach & cream" (see `docs/design.md` tokens), Rubik, rounded cards (28–32px), light card shadow.

## Layout, top to bottom
1. **Header:** will·B·aby logo (B in `--brand` belly shape) + profile button (initial letter).
2. **Hero card (white):**
   - First line: greeting "בוקר טוב, {name}" (time-of-day aware).
   - Right column: fruit illustration (above), "בגודל של {fruit}", length · weight, "השבוע ה-{n} להריון", chip "עוד {daysLeft} ימים ללידה".
   - Left: **trimester ring** — one circle split into 3 equal segments with gaps (T1 weeks 1–13, T2 14–27, T3 28–40). Completed trimesters filled in `--brand`; current trimester filled by its own progress, with a white dot marking the current position; future trimesters in the pale tint. Week+day ("14+3"), "שבועות" and the overall progress percent (day / 280) centered inside the ring.
   - No separate trimester boxes — the ring carries that information.
3. **"בקרוב" card:** title + link "כל הבדיקות". A small horizontal timeline of the **next 3 tests/appointments**; each shows name, date/time, and a chip with **days remaining**. Booked appointments have a mint dot with a check and a mint chip; tests that still need an appointment have a dashed coral dot, "לקבוע תור" and a peach chip (changed 2026-10-28 at the user's request, replacing the "nearest is mint" rule).
4. **Belly-photo square (~140×120)** with **four tool shortcuts (2×2) beside it**: dashed frame with camera icon + "לצלם עכשיו", label "תמונת בטן · שבוע {n}". The square is **shown only when no belly photo was taken for the current week**; the shortcuts then take the full row. The user picks up to four shortcuts with 📌 on the Tools screen (`settings.homeShortcuts`); until then they follow the stage: weight, names, bag, bets; from week 28 kicks, contractions, bag, weight.
5. **Daily tip:** full-width long rectangle (yellow tint), label "הטיפ של היום", WhatsApp share icon, the tip text.
6. **Bottom navigation:** Today · Week · Journal · Tools · More.

## Not on this screen (decided)
- No separate countdown tile (days left is in the hero chip).
- No trimester tiles under the ring.

## Implementation notes (2026-10-28)
- Built in `features/today/` (`today.ts` holds greeting, ring geometry and the upcoming list; tested).
- The medical disclaimer (required by CLAUDE.md on medical screens) is a small line inside the daily-tip card.
- The week's fun fact stays on the Week screen. The backup reminder is a dot on the More tab plus a note in the backup card, so Today never needs to scroll.
- The upcoming timeline uses each test's optional `shortName`; titles are clamped to one line.
- The belly-photo square is 140×120 so the screen still fits with the longest (three-line) tip; `tests/e2e/today.spec.ts` checks there is no vertical overflow at 390×844.
