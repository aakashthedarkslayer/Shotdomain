@AGENTS.md
@DESIGN.md

## Design system

`DESIGN.md` is the visual spec for every page: the Vercel-inspired system from
[awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT, see
`DESIGN.LICENSE`). Follow it for colours, type, spacing, radius, elevation and
components. Tokens live in `app/globals.css`; components use the semantic
names (`bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `border-line`, `card`,
`bg-primary`...), never raw hex values.

ShotDomain's adaptations of the spec:

- **Own identity.** ShotDomain keeps its own name and its own logo mark (the
  aperture corners), drawn in ink. Never use another company's logo, name or
  wordmark.
- **Two button scales.** App screens (`/profile`, `/billing`, share pages,
  sign-in, and the capture tool) use the 6 px in-app button; marketing pages
  (`/` and the legal pages) use the 100 px pill (`shape="pill"`). The capture
  tool lives in the homepage hero: before a capture starts the hero is
  marketing (pill input and CTA); once it starts, the hero is replaced by the
  tool, which keeps the 6 px scale inside its own area. The nav bar's
  small 28–32 px CTAs keep the 6 px radius on every page, as in the spec.
  Otherwise don't mix the two scales on one screen.
- **Dark mode** follows the visitor's system setting with the same structure in
  a dark palette (canvas `#000`, cards `#0a0a0a`, ink `#ededed`). `band-dark`
  is a dark section in any mode; `band-flip` (the featured pricing card) is
  dark on light pages and light on dark pages.
- **Status colours:** blue (`#0070f3`) means done/success and links, as in the
  spec; text uses the deep variants (`#ab570a` warning, `#c50000` error) so it
  stays readable. Blue text on the pale-blue fill uses `text-accent-text`
  (the spec's link-deep `#0761d1`, 5.2:1). Text and icons on a solid status
  or accent fill use `text-on-status` / `text-accent-ink`: white in light
  mode, black in dark mode, where the fills turn light.
- **Faint text** (`--faint`) is `#6f6f6f` in light mode, darker than the
  spec's `#888`, which is 3.4:1 on the canvas and fails WCAG AA for small text.
- **Accessibility floor:** every text pair 4.5:1 or more, tap targets at least
  24 px (the phone menu's rows are 48 px), dialogs named by their title, one
  h1 per view. Re-run the axe check after visual changes.
- **The mesh gradient** appears only behind the homepage hero, kept faint.
- **Real over decorative.** Show what the product really produces (the ZIP
  layout, real file names, real device sizes) instead of placeholder mockups
  or floating "toast" chips. No invented social proof ("Most popular" with no
  customers), no icon-in-a-circle feature grids, and give each homepage band
  its own layout rather than repeating eyebrow + centred heading + grid.
  Copy is plain: concrete facts, no em dashes.

## Hallmark

The site was redesigned with the Hallmark skill (`.claude/skills/hallmark`,
MIT). Where Hallmark and `DESIGN.md` disagree, Hallmark wins:

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
- **Real screenshots.** The homepage's worked example uses real ShotDomain
  output in `public/screens/`. Retake it as `public/screens/README.md`
  describes after a visual change to the homepage or the share page.

After a visual change, run the linter with the app running on port 3000
(`npm run build && npx next start -p 3000`). Fix every FAIL, and fix or
waive every REFLEX in the stamp:

```
node .claude/skills/hallmark/scripts/sloplint.mjs app components --genre modern-minimal --render --url http://localhost:3000/ --url http://localhost:3000/terms
node .claude/skills/hallmark/scripts/sloplint.mjs app components --genre modern-minimal --render --scope app --url http://localhost:3000/profile --url http://localhost:3000/billing --url http://localhost:3000/login
```

The render tier needs `puppeteer-core` and a Chrome or Chromium. Point it at
them with `HALLMARK_PUPPETEER` and `CHROME_PATH`.
