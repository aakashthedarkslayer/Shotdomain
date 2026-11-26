# ShotDomain directions round: CONTRACT

Written by the orchestrator before any agent launched. Agents code to this file and never edit it, `shell.html` or `build.py`.

## 1. What we are designing

ShotDomain (a web app for designers and agencies who hand websites to clients) is being redesigned around one mechanic the user picked: **Template piles**. After you type a domain, the site's pages are grouped into piles by the template they are built from (all blog posts, all docs pages, all product pages...). You pick and review piles, not hundreds of rows. Fanning a pile out shows every page; the pages that break their template are pulled out for you, with the reason. The tool gets better at 400 pages, not just prettier.

Four directions show four looks for this same mechanic: **A art-led**, **B art and signature motion** (recommended in the tabs), **C a world**, **D a wild card**.

## 2. Shared interface (in `shell.html`; read it, never redefine it)

- `window.SAMPLE_SITE`: example.com, 412 pages, six templates (Blog post 214, Docs page 140, Product 48, Home 1, Pricing 1, One-off pages 8), each with `paths`, `outliers` (`{path, why, variant}`), `capture` progress (`done/total/failed`, docs has 2 failed pages) and `picked`; four `devices` (Desktop and iPhone 14 Pro picked); `options`; `share`.
- `window.PAGE_ART.render(templateId, seed, {device: 'desktop'|'phone', variant: 'normal'|'no-hero'|'overflow'|'stray-font'})`: an SVG string of a miniature page of that template. Same id and seed give the same page in every direction. Tint it with CSS custom properties on any ancestor: `--pa-paper`, `--pa-ink`, `--pa-soft`, `--pa-accent`, `--pa-image`. Outliers use their `variant`, so a broken page visibly looks broken.
- `window.Directions.<x> = { mount(sectionEl), show(), hide() }`. The shell calls `mount` once, `show` when the tab opens (play the signature moment once on the first show, unless `window.PREFERS_REDUCED_MOTION`), `hide` when it closes (stop every loop and timer).
- Layout classes from the shell: `.direction > .stage > .screens > figure.screen(.live) > .frame > .artboard` and `.direction > .panel`. Each `.artboard` is a 1280 x 800 canvas the shell scales to fit; design every screen at 1280 x 800.

## 3. Files (one writer per file)

| Agent | Owns | Model |
|-|-|-|
| A | `design/directions/dir-a.html`, `design/directions/art/a-*`, `design/directions/shots/a/` | opus |
| B | `design/directions/dir-b.html`, `design/directions/art/b-*`, `design/directions/shots/b/` | opus |
| C | `design/directions/dir-c.html`, `design/directions/art/c-*`, `design/directions/shots/c/` | opus |
| D | `design/directions/dir-d.html`, `design/directions/art/d-*`, `design/directions/shots/d/` | opus |

Orchestrator only: `shell.html`, `build.py`, `shot.mjs`, `CONTRACT.md`, `page.html`, everything outside `design/directions/`. The app itself is not touched in this round.

A fragment is: one scoped `<style>` (every selector starts with `#dir-<x>`), one `<section id="dir-<x>" class="direction" hidden>`, and one `<script>` that sets `Directions.<x>`. No global CSS, no global names besides `Directions.<x>`, no edits to shared data.

## 4. Each direction must show (same moment in the same screen, so they compare)

1. **Live screen (1280 x 800): the piles mid-capture.** example.com, six piles with their names, URL patterns and counts; One-off pages not picked; live progress per pile (Blog, Home and Pricing done, Docs 96 of 140 with 2 failed and a retry, Product queued); Desktop and iPhone picked. Interactive: open a pile, and the pile's signature behaviour. Autoplays its signature moment once (5 to 6 s) with a ghost cursor, hands over at the first pointer or key input, and is skipped under reduced motion.
2. **Still: Blog post opened.** Its pages fanned or laid out, and the 3 outliers pulled out with their reasons ("Hero image missing", "Table runs off the page", "Old header and fonts"), each shown on Desktop and iPhone.
3. **Still: the start.** The domain typed, the crawl sorting URLs into piles by pattern, the devices and options in view, and the capture call to action.

Every real function needs a visible home, in a screen or named in the panel's "Where everything lives": enter a domain and start; piles from URL patterns with counts; pick or unpick a pile, and search for one exact page; devices; options (full page, hide cookie banners, a login session, custom CSS); live progress per pile; failed pages and retry; odd pages pulled out after capture; reviewing a pile across devices; a full-size preview; Download ZIP; the share link (30 days) and stopping it.

## 5. The bar and the rules

- The bar is the user's: custom shapes, components, transitions and artwork, something they have never seen. "Clean, modern, nice animations" is a failure. Each live screen has at least two custom-rendered elements (canvas, SVG art, 3D transform, physics, shader, custom shape).
- Artwork, not grey boxes: draw it in code (SVG, canvas, CSS 3D, WebGL). Save one still of the direction's key artwork as `shots/<x>/art.png`.
- Avoid the generated-page defaults: cream background with a serif display and a terracotta accent; near-black with one acid accent; SaaS card kits with one radius and one soft grey shadow; ALL-CAPS eyebrows; middle-dot meta lines; mono labels; arrows glued to labels. Sentence case. Plain, concrete copy.
- Accessibility in the preview too: text at 4.5:1, keyboard focus visible, interactive things are buttons with names, reduced motion respected.
- Motion: transform and opacity; emphasized decel `cubic-bezier(.2,0,0,1)` for arrivals, springs for anything released. Stop every loop when nothing moves.

## 6. Verify (each agent, in its own lane)

1. `python3 design/directions/build.py <scratch>/x.html --local --only <x>` (run from the project root; writes one standalone page with only your direction).
2. `node design/directions/shot.mjs <scratch>/x.html <x> <steps.json> design/directions/shots/<x>` with steps for: the rest state after the autoplay, two mid-animation frames, the pile opened, and a reduced-motion load. Read every PNG, fix what you see, at least 3 rounds.
3. Report: the look, the signature moment, the artwork and where it lives, how each real function is placed, PNG paths, an honest verdict (what is still weak), and any corner you cut.
