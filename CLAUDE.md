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
- **Two button scales.** App screens (`/app`, `/schedules`, `/profile`,
  `/billing`, share pages, sign-in) use the 6 px in-app button; marketing pages
  (`/` and the legal pages) use the 100 px pill (`shape="pill"`). The nav bar's
  small 28–32 px CTAs keep the 6 px radius on every page, as in the spec.
  Otherwise don't mix the two scales on one screen.
- **Dark mode** follows the visitor's system setting with the same structure in
  a dark palette (canvas `#000`, cards `#0a0a0a`, ink `#ededed`). `band-dark`
  is a dark section in any mode; `band-flip` (the featured pricing card) is
  dark on light pages and light on dark pages.
- **Status colours:** blue (`#0070f3`) means done/success and links, as in the
  spec; text uses the deep variants (`#ab570a` warning, `#c50000` error) so it
  stays readable.
- **The mesh gradient** appears only behind the homepage hero.
