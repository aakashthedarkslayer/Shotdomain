---
name: premium-ui
description: Use for ANY UI or UX work in Flutter or on the web (React/Next/HTML/CSS) - new apps, screens, redesigns, animations, "make it beautiful/premium/outstanding/unique". Drives a concept-first process (metaphor, live HTML previews the user picks from, custom rendering, physics, haptics), a screenshot + critic loop, performance-safe architecture, and parallel agents with models matched to task difficulty. The bar is Apple-Design-Award level, never "clean but ordinary".
---

# Premium UI

**What the user means by premium-ui (their words, every time this kit is used):** "I don't want the normal premium UI. I want the custom (almost everything built custom: components, shapes, animations, transitions), super premium, which no one built yet, and the user will fall in love like they didn't see anything like this. The output must be GOD level or beyond."
- **"Normal premium" is a fail:** a polished layout, stock imagery, nice easing, a good palette. That is styling, not design.
- **Custom everywhere:** custom-built shapes, components, transitions and motion on every key screen, plus custom artwork (illustration, 3D, layered art or shaders, generated in code).
- **The test:** *has the user seen anything like this before?* If yes, it is below the bar, whatever else is true.
- **A new mechanic, not a new skin.** Art on the standard layout of the category (a store's search bar, chips, 2-column grid, product page, bag) is "seen before", however beautiful (Kora v3.2: 4 painted, woven and shader directions on a store grid all scored 7/7). Invention starts in *how people browse, choose and act*, so §1 starts with a cheap paradigm sweep.
- **Enforced, not advisory:** in projects with `.premium-ui`, the `premium-gate` hook blocks every Artifact publish (and every build/polish `ui-feature-agent` spawn) until `PREMIUM_GATES.md` proves the bar with evidence (template: [templates/PREMIUM_GATES.template.md](templates/PREMIUM_GATES.template.md)). Below 9/9 it passes only with the user's own words in `USER-OK`, checked against the conversation. Fix the work, never the gate file; never invent evidence or a quote.

**The bar:** someone watches the app for ten seconds and falls in love. Apple Design Award, Awwwards Site of the Day.
Ask of every screen: *would someone screen-record this and post it?* If not, it isn't done.

"Clean, modern, with nice animations" is the median, and **the median is failure**.
Ultra premium needs two things at once:
- **first-glance beauty:** rich artwork, refined type, impeccable hierarchy. This is what makes a client fall in love in the first 3 seconds.
- **invention:** interaction that comes from a world. This is what makes them keep playing.

Never trade one for the other.

**Look first, then move (the order is not optional).** Most of what a user judges is the resting screen: what they see when they open the link, before any tap. Lesson (Kora store, v3.0.0): a whole parallel-agent round went into physics, sound and tap-triggered moments on an inherited layout. The critic score rose, but the user saw "nothing changed".
1. **Stills first, and the stills carry the art.** In any new, deeper or "make it wow" round, redesign the resting screens first and get them approved as **no-tap stills**. The stills must contain the custom artwork and custom-rendered elements (illustration, 3D, shader, custom shapes), not just new layout and colour: re-colouring a catalogue layout is not a new look. Only then build physics, sound and tap moments.
2. **A static mock before agents.** Before agents spend hours, ship a ≤30-minute static mock of the new look and get the user's OK. Agents deepen an approved look; they never discover it.
3. **Visible-difference check before you show anything.** Put old and new rest-state screenshots side by side. If a non-designer would call it "the same app" within 3 seconds, it isn't ready to show.
4. **Pivot rule (the threshold IS the bar).** If First glance or Wow is **< 9**, it is **below bar**: say so in those words. The next round is a **new visual direction** (new art, composition, custom elements), or a **new paradigm** from the sweep when the critic says `Skeleton: standard`; never polish and never more motion. Never call anything "ready" or "ship" below 9/9.
5. **"Never downgrade" protects features, not layouts.** Carry every feature and flow forward, but layout, hierarchy, type and imagery are free to change, and usually must for a visible upgrade.
6. **No silent progress below the bar.** Moving from directions to stills, stills to build, or build to polish while First glance or Wow is under 9 needs the user's explicit OK. Ask with the gap stated plainly ("this is 8/6, below your bar of 9/9") and record their exact words in `USER-OK`. The gate hook checks the quote.
Users usually can't say what they want. Never make them design it. Show a **range** of ultra-premium directions, live.

Before starting, read the reference for the platform: [references/flutter.md](references/flutter.md) (and the working code in [references/flutter-patterns.md](references/flutter-patterns.md)) or [references/web.md](references/web.md).
For anything bigger than one screen, read [references/parallel-agents.md](references/parallel-agents.md) and build in parallel.
Working examples of the live preview pages are in [templates/examples/](templates/examples/): `directions-shell.html` (the 4-direction page shell and its contract; build it in parallel per references/parallel-agents.md), `concept-previews.html` and `interaction-previews.html` (2 open/close animations). Match that level.
**The benchmark to beat:** `notes-directions/notes-directions.html` (4 live directions). Read [references/case-study-notes-directions.md](references/case-study-notes-directions.md) once per project: it covers what it took, the scores, and why Wow stalled at 7.
**v3 map (read what the step needs):**
- Flutter code you can copy: [templates/flutter/](templates/flutter/) (world/cam, render harness, PERF_LOG, baked layers). Patterns: [references/flutter-patterns.md](references/flutter-patterns.md).
- Device perf (PERF_LOG, Impeller cost, audio, image lifetime): [references/flutter-device-performance.md](references/flutter-device-performance.md); run it with `scripts/device_perf.sh <package> <apk> <label> --assert 'spin=[1-9]'`.
- Web hero then Flutter port: [references/web-to-flutter-port.md](references/web-to-flutter-port.md). Web hero example: [templates/examples/softbound-v3/](templates/examples/softbound-v3/). Case study (scores, what broke, what fixed it): [references/case-study-softbound.md](references/case-study-softbound.md).
- Proven open-source Flutter code to study before inventing (Wonderous, Vignettes, shaders, Rive, flutter_animate, Flame), pattern → exact file: [references/flutter-repos.md](references/flutter-repos.md). Clone on demand; never vendor.
- Fast multi-agent builds: [references/fast-orchestration.md](references/fast-orchestration.md) with [templates/orchestration/](templates/orchestration/) (CONTRACT, agent brief, PROGRESS pause/resume). Agents: `ui-feature-agent`, `ui-critic`, `perf-verifier`.
On a new project, run **Bootstrap** (bottom of this file) first.

---

## 1. Concept: a range of directions, then a world

**Before you design, ask once (optional):** "Share any app shots you love: Dribbble, Behance, or screenshots." Treat what they share as a floor for *visual* finish, never as a layout to copy.

### 0. Paradigm sweep (first, cheap; `PHASE: paradigms`)
Before any art direction, find a **new interaction paradigm**: a new way to browse, choose and act in this category. The theme comes later.
- Sketch **6 rough single-screen paradigms** as stills (static HTML or SVG, ~20 minutes each, in parallel; no motion, no polish, grey is fine). Each one changes the **mechanic**, not the look. Kora examples for clothing: an almirah whose doors open onto hangers; a trial room you drag garments into, onto a figure; an endless bolt of cloth that unrolls as you scroll; a slot-machine outfit builder; haggling (mol-bhav) down a real discount ladder; a 2.5D bazaar street.
- Test each with: *"Take the art away. Is what's left the standard layout of this category?"* If yes, it is a skin, not a paradigm; replace it.
- The `ui-critic` answers **never seen? YES/NO** for each sketch (sweep mode). Show all 6 on one page, critic answers and the honest trade-off beside each, then let the **user pick** (AskUserQuestion). Record each as `PARADIGM:` and the pick as `PICKED:` + `PICKED-BY-USER:` (their exact words) in `PREMIUM_GATES.md`; the gate blocks every later phase until both exist.
- Then build the picked paradigm: either the 4 art directions below (4 looks for the **same** paradigm), or straight to stills when the user wants speed.
- **Asset reality check (before any art-heavy scene).** Look at the real product images. Stock photo cutouts placed in an illustrated or 3D scene cap First glance at about 7, and relighting them in code doesn't fix it. Either pick paradigms and directions that don't need photo realism (illustrated in code, typographic, 3D-modelled, generative), or tell the user plainly that real photography is needed for 9. Record it as `ASSETS:` in the gate file (stock cutouts cap First glance at 7 there too).

**Real app AND art-led, never a trade-off.** Every direction must carry custom artwork and custom-rendered elements, and must work as a real, shippable app of its kind: every real function is there and easy to find (a store shows real products and prices, and you can search, filter, add to the bag and check out). Real functions do **not** mean the standard layout: the paradigm decides how they are laid out and reached. A concept that hides a function behind its metaphor gets "not a real app" (Kora round 1); a concept that copies the category's standard skeleton gets "seen before" (Kora v3.2). Checkout, payment, forms and settings stay familiar on purpose: invention lives in browsing, discovery and the product moment.

**Show 4 directions that span the range** (4 looks for the picked paradigm, never 4 skins on the standard layout). Not 3 variations of one idea. Showing only metaphor worlds lost a client before: only 1 of 3 landed.

| # | Direction | What it is | Why clients fall for it |
|-|-|-|-|
| A | **Art-led polished** | Dribbble/Behance-grade: a hero illustration, 3D renders or photography, refined type, generous space, impeccable hierarchy, soft colour fields | Instant visual love; it feels familiar and expensive |
| B | **Art-led + signature motion** | A, brought to life: illustrations split into parallax layers that react to tilt or scroll, shared-element morphs (a card *becomes* the page), 3D objects you drag to spin, artwork that reacts to data | The beauty of A plus a "how did they do that?" moment. **Usually the recommended pick** |
| C | **A world** | The app lives inside a metaphor or material; every action is a ritual (see below) | Unforgettable, but it needs a client who's open to it |
| D | **Wild card** | One genuinely unexpected idea: a spatial canvas, generative art, kinetic type, a sound-led UI | Calibrates the range; sometimes it wins |

**Artwork is part of the design, not a placeholder.** A and B live or die on the art. Options:
- draw layered SVG or canvas illustrations by hand; this is free, and the layers make parallax possible;
- CSS/three.js 3D objects;
- AI-generated images, e.g. Figma `generate_image`, which costs credits, so ask first;
- photos or illustrations the user supplies.

Never ship grey boxes or emoji in a preview. In the app, bundle the art as assets: layered SVG or PNG, Rive or Lottie for animated art.

### For C (and for B's signature moments): a world, not a layout
The world *generates* the interactions, so the wild animations stop being random effects and feel inevitable.

- **Map every core action to a physical ritual inside that world.** In the notes app built with this kit (Atelier):
  - Create = tear a sheet off a pad.
  - Read = pick the sheet up.
  - Delete = crumple it and throw it in a wastebasket.
  - Undo = fish the ball back out of the basket.
  - Theme = pull the lamp chain.
  - Overview = gather the sheets into a stack, or fan them out like cards.
- **For each of the 4 directions, write:** the look, how create/read/update/delete look, the one unforgettable moment, the palette, the type, the artwork plan, and feasibility.
- **Build all 4 as ONE interactive HTML preview page** (real artwork, real gestures, real sample content) and publish it as an Artifact so the user can *play* with them. Describing concepts in text gets a shrug; a live preview gets "I love this one".
  - Each direction shows 2–3 screens (home, detail, and create or edit) side by side in phone frames, like a Dribbble shot, **and** one screen is fully interactive.
  - Page shape:
    - phone frames;
    - one tab per direction;
    - a side panel with a "try this" list of gestures, the palette, and an honest trade-off line;
    - the recommended option marked.
  - **Hidden gestures don't sell.** On first show, each live phone autoplays its signature moment once (5–6s), with a ghost fingertip. It hands control over at the first touch, and is skipped under reduced motion.
  - **Compare like with like:** every direction uses the same sample content and opens the same item in phone 2.
  - **The hybrid often wins:** put A's artwork on B or C's signature object (e.g. illustrated covers on 3D notebooks). Never recommend a direction whose still frame has no art.
  - Follow the Artifact tool's flow (quickstart, then write the page, check it once, publish). Before publishing, take one look at the page in Playwright with mid-animation frames, and fix what you see.
  - Recommend one, but **let the user choose**. They often pick differently from you, and they may mix directions ("B's look with C's delete").
  - Do the same for any big interaction decision later, such as how a note opens: preview 2 options live before building.
- **Text input stays real text fields**, styled to fit the world. Don't hand-paint text editing: IME, selection, accessibility and non-Latin input all break.

## 2. Signature moments: the "no one would think of it" layer

Once the base works, raise the ceiling with moments that come *from the world*. These patterns are proven and reusable:

| Pattern | Example |
|-|-|
| **Undo is a place, not a toast** | A wastebasket you can look inside and fish things out of. |
| **Theme is an object** | A lamp pull-chain. The light pool sweeps across the scene. |
| **The material remembers** | A smoothed-out sheet keeps faint creases forever. |
| **Wet → dry** | Fresh ink lands glossy and dries matte. Fresh paint, fresh frost. |
| **The device is part of the world** | Tilt moves the light (accelerometer), so shadows follow. |
| **Overview as a physical gesture** | Pinch to gather into a stack; long-press to fan like cards. |
| **The scene reacts to impact** | A landing sheet's air puff nudges its neighbours, plus a haptic tap. |
| **Camera moves explain structure** | Opening lifts the item toward you, with a 3D tilt and depth-of-field on the rest. |
| **Onboarding inside the world** | First-run notes that teach the gestures, written in the world's voice. |

Rule: **each key screen has ≥2 custom-rendered elements** (painter/canvas, shader, physics, 3D transform). Not stock widgets rearranged.

## 3. Craft standards

- **Tokens first:** colours, type scale, spacing, radii, layered shadows and motion (durations, curves, springs) live in one tokens file. Screens read only tokens. The `ui-lint` hook enforces this.
- **Light:** one light source, consistent. Shadows fall away from it; highlights face it. Layered soft shadows (contact + ambient), never one black elevation.
- **Motion:** emphasized decel `Cubic(0.2,0,0,1)` for arrivals, gravity ease-in `Cubic(.6,0,.95,.45)` for drops, springs for anything a finger released. Stagger 40–70ms. Small overshoot for stiff materials.
- **Haptics are part of the design:** selection on pickup and threshold crossings, medium on completion (crumple, land in basket), light on landings.
- **Type:** a characterful display face used with restraint, a quality reading face, a quiet UI face. **Bundle the fonts.** Never fetch them at runtime: offline breaks, and Android release builds have no INTERNET permission by default.
- **Every state is designed:** empty (an invitation inside the world, e.g. a hand-drawn arrow to the pad), loading, error, first run.
- **Dark mode is a world state, not an inversion:** evening lamp-light on walnut vs daylight on oak. Design both with the same care, and let the switch itself be a moment.
- **Never bury the important thing:** in free-form scenes (objects on a desk or canvas), use a layout solver so titles and key content are never covered, new items land in clear space, and neighbours gently resettle.
- **Design for scale from the start:** 3 items is a demo; plan for 100+. Provide an overview gesture (stack/fan, zoom-out) and cull rendering to what's visible.
- **Never lose user data:**
  - save on every settle and immediately on destructive actions;
  - make delete recoverable through the world (a basket, not a toast);
  - when stored data can't be parsed, keep a copy instead of overwriting it.
- **Sound** is optional but powerful (paper rustle, a thunk in the basket). Keep it subtle, respect the silent switch, and only start it after a user gesture on the web.
- **Accessibility always:**
  - mirror canvas-drawn objects as Semantics/ARIA nodes with actions;
  - give hold or gesture actions a direct alternative;
  - honour reduced motion;
  - keep AA contrast and support text scaling;
  - make anything aligned to text (ruled lines, baselines) scale with the user's text size.

## 4. Performance architecture (decide on day one)

Premium motion that stutters is worse than no motion. A mid-range Android phone on OpenGL ES is the target device, not the simulator.
- **Rasterize-and-cache:** draw complex static objects once into an image; per frame, draw images. Rebuild only when their content changes.
- **Pre-blur shadows** into images (2–3 softness levels, crossfaded). No per-frame blur, no per-frame `saveLayer` or Opacity over large areas.
- **Snapshot-then-blur once** for depth-of-field or focus effects, then crossfade the blurred snapshot by opacity.
- **Run the animation loop only while something moves.** Stop it when settled, and never animate idle.
- **No per-frame text layout:** cache it by content and size.
- **Test in release/profile mode on a real device.** Debug mode lies. Measure with an opt-in `PERF_LOG`, split build vs raster, and follow [references/flutter-device-performance.md](references/flutter-device-performance.md) (Impeller: no ColorFilter/saveLayer/screen blends; idle = zero frames; async bakes, deferred image dispose).

## 5. The loop (required)

1. **Build** the slice.
2. **Look at it:** (Flutter without a device: render-test harness, see [references/web-to-flutter-port.md](references/web-to-flutter-port.md); compare pixel-level to the web reference.) Take real screenshots of real interactions, mid-animation frames included. See the platform reference for how.
   - Stitch frames into a strip with `ffmpeg … hstack` and Read it.
   - Never screenshot a user's personal phone without asking: it may be showing their private apps. The `device-privacy-guard` hook enforces this.
   - Know the canvas coordinates before scripting gestures. Read semantics rects; don't estimate from a downscaled strip, or you'll "test" the wrong object.
3. **Critique:** send the screenshot paths, the concept and the art direction to the `ui-critic` agent (Opus). Always include **rest-state stills (no taps)** of every key screen, plus the previous round's rest stills. First glance is scored from the stills alone; Wow and Motion are scored from frames and recordings.
   - Fix its top issues, re-shoot and re-critique.
   - Stop when every axis is ≥8 and both First glance and Wow are ≥9, with a maximum of 4 rounds.
   - If the verdict is RETHINK, or First glance or Wow is < 9 (below bar), go back to §1 for a new visual direction instead of polishing (pivot rule). Save every critic report to a file: the gate reads scores from it.
   - **Before showing the user:** run the visible-difference check (old and new rest stills side by side). "The same app" means it isn't ready.
4. **Verify:** analyze, tests and a release build all pass. Then install on the device (`scripts/device_perf.sh`) and let the user feel it.
   - **Never call UI work done without device numbers** (raster p50/p90, jank) for the key interactions in every theme/time-of-day. Tests only see the CPU. Assert the state actually changed (a spin that did not spin is not "smooth"). See [references/flutter-device-performance.md](references/flutter-device-performance.md).
5. **Report:** what changed, what was verified and how, and what is still unverified. Say plainly when something hasn't been seen on a real device.

## 6. Working with the user

- **Defaults over questions.** Ask only when the answer changes what you build: which concept, which of 2 previewed interactions, where to install. Use one AskUserQuestion with a recommended option.
- **When they say "more premium", "not wow" or "more unique",** first fix what a still shows. Redesign the resting screens (composition, type scale, imagery, colour) as 2–3 static mocks they can compare, and get one approved. Only when First glance is ≥ 9 propose the next layer of §2 signature moments (3–5 ideas in one line each), then build them in parallel. Motion on an unchanged layout reads as "nothing changed".
- **Cost vs visible value:** before a long or parallel round, name what will look different in a still. If nothing will, cut the round or change it. Hours of invisible plumbing before the static screens look new is the most expensive way to disappoint.
- **Speed:** when the user wants speed, parallelize: contract first, one writer per file, agents spawn critic/verifier sub-agents, scoped tests only, merge with absolute paths (references/parallel-agents.md, references/fast-orchestration.md, templates/orchestration/). Give a short status line between steps, and ask before another fix round once a usable version exists.

## Bootstrap (new project)

0. Flutter? Start from [templates/flutter/](templates/flutter/) instead of a blank project.
1. Copy [templates/CLAUDE.project.md](templates/CLAUDE.project.md) to the project root as `CLAUDE.md`, or merge it into an existing one, and fill in the concept once it's chosen.
2. `touch .premium-ui`. This opts the project into the `ui-lint` and `premium-gate` hooks, which stay silent in projects without the marker. Copy [templates/PREMIUM_GATES.template.md](templates/PREMIUM_GATES.template.md) to the project root as `PREMIUM_GATES.md`; fill it with evidence before every publish.
3. Create the tokens file: Flutter `lib/theme/tokens.dart`; web `src/styles/tokens.css` (+ `tokens.ts`).
4. Start at §1.0, the paradigm sweep (`PHASE: paradigms`).
