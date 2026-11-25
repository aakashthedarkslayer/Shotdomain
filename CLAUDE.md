@AGENTS.md
@DESIGN.md

## Design system

`DESIGN.md` is the visual spec for every page: the **Riso proof** system.
ShotDomain prints a proof of a website for your client, so the interface is
printed in two spot inks on paper: riso blue for type, frames and buttons,
fluorescent pink for what you pick, where you are and focus. Follow it for
colours, type, spacing, shape, elevation, components and motion. Tokens live
in `app/globals.css`; components use the semantic names (`bg-bg`,
`bg-surface`, `text-fg`, `text-muted`, `border-line`, `card`, `bg-primary`,
`text-accent`...), never raw hex values.

The rules most easily broken:

- **Own identity.** ShotDomain keeps its own name and logo mark (the aperture
  corners), printed in riso blue. Never use another company's logo, name,
  wordmark, typeface or design system. Nothing here comes from Vercel's.
- **No black.** The darkest ink is deep blue (`text-fg`). Primary buttons are
  riso blue (`bg-primary`).
- **Two inks.** Pink (`accent`) is only for picked items, the current step,
  focus and the second plate in prints; pink text uses `text-accent-text`.
  Yellow and red are only for warnings and errors (with an icon).
- **One family.** Anybody with its width axis: `display` (62%, 900) for
  poster and section heads, `type-head` (75%) for titles, body at normal
  width, `type-cond` (75%) with tabular figures for captions, file names,
  URLs and counts. IBM Plex Mono only for pasted code. Three weights: 400,
  600, 900.
- **Shape says what a thing is.** Printed things (cards, sheets, frames,
  alerts, dialogs) are square-cut; things you press (buttons, inputs, chips,
  toggles) are `rounded-md`. Avatars and switches are round.
- **Flat.** No gradients, glass, soft card shadows or hard offset shadows.
  Only floating things (`card-raised`) and the hero proof cast a soft
  blue-tinted shadow.
- **Real over decorative.** The hero proof prints real frames in two inks
  with `scripts/riso-print.mjs`; everywhere else screenshots stay in true
  colour. No invented social proof, no icon-in-a-circle grids.
- **Dark mode** prints the same inks on navy stock. `.ink-panel` is a block of
  deep blue ink in any mode; `.ink-flip` (the featured price) is ink on paper
  and paper on navy; `.paper-sheet` keeps light-mode inks in any mode.
- **Accessibility floor:** every text pair 4.5:1 or more, input edges and
  focus rings 3:1, tap targets at least 24 px (the phone menu's rows are
  48 px), dialogs named by their title, one h1 per view, reduced motion
  respected. Re-run the axe check after visual changes.

## Hallmark

The site is also held to the Hallmark skill (`.claude/skills/hallmark`, MIT).
Where Hallmark and `DESIGN.md` disagree, Hallmark wins:

- **No eyebrows.** A section opens on its heading. No small label above it,
  in mono or otherwise.
- **No mono or tracked-capital labels.** Labels, tags, captions and table
  heads use the body face, a step smaller, in sentence case. Mono is only for
  real technical material: URLs, file names, cookie names and values, code.
- **No middle-dot meta lines** (`A · B · C`). Put the facts in separate
  spans with a gap, or in columns.
- **No arrows glued to button or link labels.** The verb stands alone.
- **No dashes in copy.** Use a comma, a colon, a full stop or parentheses.
- **Every colour goes through a token.** Raw values live only as primitives
  in `:root` in `app/globals.css`; components use the semantic names. Input
  borders use `border-field-edge` (3:1 against the page).
- **The stamp.** The first lines of `app/globals.css` are Hallmark's stamp,
  critique line and waivers. Keep them first, and update them when the
  design changes.
- **Real screenshots.** The homepage's proof sheet and worked example use real
  ShotDomain output in `public/screens/`. Retake them as
  `public/screens/README.md` describes after a visual change to the homepage
  or the share page.

After a visual change, run the linter with the app running on port 3000
(`npm run build && npx next start -p 3000`). Fix every FAIL, and fix or
waive every REFLEX in the stamp:

```
node .claude/skills/hallmark/scripts/sloplint.mjs app components --genre modern-minimal --render --url http://localhost:3000/ --url http://localhost:3000/terms
node .claude/skills/hallmark/scripts/sloplint.mjs app components --genre modern-minimal --render --scope app --url http://localhost:3000/profile --url http://localhost:3000/billing --url http://localhost:3000/login
```

The render tier needs `puppeteer-core` and a Chrome or Chromium. Point it at
them with `HALLMARK_PUPPETEER` and `CHROME_PATH`.
