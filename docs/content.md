# willBaby — Content Structure & Writing Rules

The content bank: 42 weekly summaries and 294 daily items (42 × 7), each with a pregnant and a partner version. Claude writes the first draft; the user reviews and approves.

## Weekly summary (`content/he/weeks.json`)
```json
{
  "week": 20,
  "fruit": { "emoji": "🍌", "name": "בננה" },
  "size": { "cm": 25.6, "grams": 300 },
  "headline": "חצי הדרך! {baby} כבר שומע את הקול שלך",
  "baby": ["..."],
  "body": ["..."],
  "tips": ["..."],
  "partner": { "tip": "...", "mission": "משימה זוגית לשבוע" },
  "funFact": "...",
  "twinsNote": "... (optional)",
  "testIds": ["anatomy-scan"],
  "sources": ["..."]
}
```

## Daily item (`content/he/daily.json`)
`{ day, type, text, partnerText, source? }`, where `type` is one of `tip` · `fact` · `funny` · `emotional` · `partner`. A fixed weekly rotation keeps variety.

## Tests (`content/he/tests.json`)
`{ id, name, weekFrom, weekTo, description, isOptional, source }`. Initial list per common Israeli practice — verify the ranges against official sources (Ministry of Health, health funds) before publishing:

| Test | Weeks (approx.) |
| --- | --- |
| First ultrasound (heartbeat, dating) | 6–9 |
| Nuchal translucency + first-trimester screening | 11–14 |
| Early anatomy scan | 14–16 |
| Second-trimester screening | 16–20 |
| Late anatomy scan | 20–24 |
| Glucose challenge test | 24–28 |
| GBS culture (optional) | 35–37 |
| Monitoring | from 40 |

## Badges (`content/he/badges.json`)
`{ id, name, emoji, description, rule }`; `rule` comes from a closed list.

| Badge | Condition |
| --- | --- |
| Welcome | onboarding done |
| First trimester behind us | week ≥ 14 |
| Halfway | week ≥ 20 |
| Third trimester | week ≥ 28 |
| Full term | week ≥ 37 |
| Belly photographer | 5 belly photos |
| Journal star | 7 days in a row |
| Little footballer | first kick session |
| Bag is ready | hospital bag 100% |
| We have a name! | a name marked favorite |

## Surprises (`content/he/surprises.json`)
One-time full-screen moments in weeks 12, 20, 24, 30, 37 and 40 (confetti, balloons, heartbeat). Seen ones are stored in `settings.seenSurprises`.

## Writing rules
- Warm tone with a wink of humor; no scare tactics, no "must".
- Short sentences, up to 25 words per daily item.
- Medical and scientific facts only from recognized sources, with an internal `source` per fact.
- General information only; the app never diagnoses or gives medical advice.
- Partner content addresses the partner directly.
- Variables instead of gender: `{baby}`, `{you}`, `{partnerName}`; plural forms for multiples.
  - `{baby}`: the baby's name if set, otherwise "הבייבי"; "התאומים" for twins, "הבייביז" for 3+. Never attach a letter before it (ל{baby} would read "להבייבי"); rephrase instead.
  - `{you}`: the user's name. `{partnerName}`: the partner's name, or "בן או בת הזוג" (pregnant user) / "בת הזוג" (partner user) when not set.
  - Words that agree with the baby use a selector `[masculine|feminine|plural]`, e.g. `{baby} כבר [שומע|שומעת|שומעים]`. Unknown sex uses the masculine form; two or more babies use the plural.
  - The pregnant version addresses a woman; the partner version uses wording that fits any gender.
  - Weekly summaries have one version, so `baby`, `body`, `tips` and `funFact` are written impersonally (fit both roles); only `partner` addresses the partner.
  - All of the above is checked at build time (`content/schema.ts`).
- Sensitive tools (kicks, contractions) always show: "If something feels wrong, contact your doctor or the delivery room."
