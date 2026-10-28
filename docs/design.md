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

Colors are gender-neutral on purpose; after a sex reveal the user may add a color touch (no pink/blue by default).

## Typography
Rubik (Google Fonts, Hebrew support). Headings 600, body 400, base size 17px.

## Theme
`prefers-color-scheme` by default, with a manual toggle in settings (light / dark / auto).

## Accessibility
AA contrast at least, touch targets ≥ 44px, `aria-label` for emoji, respect `prefers-reduced-motion` (no confetti for reduced motion).

## Future
Replace emoji with original SVG fruit illustrations with faces. `<WeekFruit week={n}/>` is isolated so the swap changes no screen.

## Approved screens
- **Today:** [`design/today-screen.md`](design/today-screen.md) + visual reference [`design/today-screen.html`](design/today-screen.html).

## Accessibility note on brand color
`--brand` (#FF8A7A) is for fills, the logo and the ring. Text on light backgrounds and primary-button text use a darker brand shade that passes AA, e.g. `#C4483A` (active nav tab, links).
