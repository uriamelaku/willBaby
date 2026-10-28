# willBaby — Design & Branding

Style: illustrated and cute — large rounded corners, warm soft colors, big fruit emoji in the center, micro-animations on every interaction.

## Logo
will·B·aby: the B is drawn as a pregnant-belly silhouette in the brand color. App icon: the B-belly alone on a cream background.

## Color tokens
| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--brand` | #FF8A7A (peach-coral) | #FF9E90 | the B, primary buttons |
| `--accent` | #8FD3C1 (mint) | #6FC2AD | success, badges |
| `--sun` | #FFD36E (soft yellow) | #F2C55C | surprises, highlights |
| `--bg` | #FFF8F3 (cream) | #1E1B24 | background |
| `--card` | #FFFFFF | #2A2633 | cards |
| `--text` | #3B3344 | #F3EEF6 | text |
| `--muted` | #6E6377 | #B9AFC1 | secondary text (instead of opacity) |
| `--brand-text` | #C4483A | #FF9E90 | brand-colored small text, links, active tab (AA) |
| `--brand-soft` · `--peach-soft` · `--mint-soft` · `--sun-soft` | #FFE4DD · #FFF1EC · #DDF2EC · #FFE9C2 | darker tints | ring track, chips, highlighted cards (each with a matching `-text` color) |

Colors are gender-neutral on purpose; after a sex reveal the user may add a color touch (no pink/blue by default).

## Typography
Rubik (Google Fonts, Hebrew support). Headings 600, body 400, base size 17px.

## Theme
Light by default, with a manual toggle in settings (light / dark / auto); "auto" follows `prefers-color-scheme`.

## Accessibility
AA contrast at least, touch targets ≥ 44px, `aria-label` for emoji, respect `prefers-reduced-motion` (no confetti for reduced motion).

## Future
Replace emoji with original SVG fruit illustrations with faces. `<WeekFruit week={n}/>` is isolated so the swap changes no screen.

## Approved screens
- **Today:** [`design/today-screen.md`](design/today-screen.md) + visual reference [`design/today-screen.html`](design/today-screen.html).

## Accessibility note on brand color
`--brand` (#FF8A7A) is for fills, the logo and the ring. Text on light backgrounds uses `--brand-text` (#C4483A, AA); text on brand fills uses `--on-brand`.

## App-wide style (from the approved Today screen)
- Header on every main tab: logo (B in a rounded brand badge) + profile button with the user's initial (opens More).
- Cards: `rounded-card` (28px), white on cream, no shadow; only the Today hero card has the soft brand shadow (none in dark mode).
- Bottom navigation: line icons, rounded top corners, soft shadow, active tab in `--brand-text`.
- Share buttons are icon buttons (44px) on the card's top corner.
