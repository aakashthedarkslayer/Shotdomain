@AGENTS.md
@DESIGN.md

## Design system

`DESIGN.md` is the visual spec for every page: the **Contact sheet** system.
ShotDomain's output is a photographer's proof sheet of a website, so the page
is proof paper, real screenshots sit in black film with edge-printed frame
numbers, and a red china marker marks what you pick. Follow it for colours,
type, spacing, radius, elevation, components and motion. Tokens live in
`app/globals.css`; components use the semantic names (`bg-bg`, `bg-surface`,
`text-fg`, `text-muted`, `border-line`, `card`, `bg-primary`,
`text-accent`...), never raw hex values.

The rules most easily broken:

- **Own identity.** ShotDomain keeps its own name and logo mark (the aperture
  corners), drawn in ink. Never use another company's logo, name or wordmark.
- **One family.** Archivo, with its width axis: `display` / `type-wide` for
  headings, body at normal width, `type-narrow` with tabular figures for
  frame captions, file names, URLs and counts. Geist Mono only for pasted
  code (cURL, cookie values, CSS).
- **Film is for frames.** `film-strip` and `.band-dark` hold real screenshots
  or a real file listing, never decoration. Edge amber (`text-edge-print`)
  appears only on film.
- **Red means picked.** `accent` (marker red) is for picked items, the
  current step and focus. Errors use `danger` with an icon and words. Done is
  black, not green.
- **One control radius.** 2 px frames, 4 px prints, 6 px controls; no pills.
  `Button shape="pill"` is the marketing call in the same 6 px shape.
- **Flat.** No gradients, glass or soft card shadows. Only menus and dialogs
  (`card-elevated`) cast a shadow.
- **Dark mode** is the darkroom: the same structure on black, marker turned
  up to safelight red. `.band-dark` is film in any mode; `.band-flip` (the
  featured price) is film on paper and paper in the darkroom.
- **Accessibility floor:** every text pair 4.5:1 or more, input edges 3:1,
  tap targets at least 24 px (the phone menu's rows are 48 px), dialogs named
  by their title, one h1 per view, reduced motion respected. Re-run the axe
  check after visual changes.
- **Real over decorative.** Show what the product really produces (real
  frames, the real ZIP layout, real file names and device sizes). No invented
  social proof, no icon-in-a-circle grids, no placeholder mockups.

`DESIGN.LICENSE` covers the earlier Vercel-inspired spec this file replaced.

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
