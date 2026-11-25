# <App name> — house rules

The bar: Apple Design Award / Awwwards level. Someone watches this app for ten seconds and falls in love.
"Clean, modern, with nice animations" is a FAILURE: that's the median. Polish is the floor; **invention** is the job.
For any UI/UX work, use the `premium-ui` skill (concept → live previews → build → screenshots → `ui-critic` → verify).
The bar is enforced: `PREMIUM_GATES.md` (root) must prove it before any publish (`premium-gate` hook). Start with the paradigm sweep (6 rough sketches of new mechanics, not themes); nothing is built until the user picks one. Below 9/9 needs the user's own words in `USER-OK`. Fix the work, never the gate file.

## The world
<Filled in once a concept is chosen. One paragraph: the metaphor or material the app lives in.>

| Action | Ritual in this world |
|-|-|
| Create | |
| Read / open | |
| Update | |
| Delete | |
| Undo | |
| Theme switch | |
| Overview / search | |

Palette (hex), type pairing, light source position, motion personality, haptic personality: <fill in>.

## Never ship
- The platform's default look (stock Material/Cupertino widgets, generic component-library cards, plain list + bottom nav) unless reinvented for this world.
- Hard-coded colours, font sizes, durations or radii outside the tokens file (`lib/theme/tokens.dart` or `src/styles/tokens.css`).
- Spinners. Loading is a skeleton or a designed moment from the world.
- An undesigned empty, error, loading or first-run state.
- Per-frame blurs, full-screen layers during animation, or animation loops that run while nothing moves.
- Fonts fetched at runtime. Bundle them.
- "Done" without device numbers (raster p50/p90, jank) for the key interactions in every theme/time-of-day, and without screenshots of the real interaction (mid-animation frames included), a `ui-critic` pass, and passing analyze, tests and a release build.

## Always
- One consistent light source; layered soft shadows falling away from it.
- Every key screen has ≥2 custom-rendered elements (painter/canvas, shader, physics, 3D).
- Haptics designed with the motion (selection / light / medium).
- Real text fields for typing, styled into the world.
- Accessibility:
  - semantic/ARIA mirrors for canvas objects;
  - a direct alternative for every gesture;
  - reduced motion;
  - AA contrast;
  - text scaling, with anything aligned to text scaling too.
- Test on a real mid-range device in release/profile mode.
