# Web reference (React / Next / plain HTML)

## Craft toolbox
| Effect | Tool |
|-|-|
| Custom objects, generative art | `<canvas>` 2D, or WebGL via a small hand-rolled program or `three`/`ogl` when 3D is the point. Avoid long hand-written SVG paths. |
| Material texture | SVG `feTurbulence` data-URI noise; GLSL fragment shaders for living surfaces |
| 3D lift / tilt / fold | CSS `perspective` on the parent, `transform-style: preserve-3d`, `rotateX/rotateY/translateZ`, `backface-visibility: hidden` for folds and flips |
| Choreographed motion | Web Animations API (`el.animate(keyframes, {easing, fill})`) with per-keyframe easing; FLIP for layout morphs; View Transitions API for page continuity |
| Physics | requestAnimationFrame integration with friction `Math.pow(k, dt)` and springs; stop the loop when settled |
| Depth of field | `filter: blur() brightness()` on the background layer only. It's cheap on the compositor; animate it, but keep the blurred layer static. |
| Gestures | Pointer Events with `setPointerCapture` and `touch-action: none` on the interactive surface; your own long-press, fling and pinch from pointer data |
| Haptics | `navigator.vibrate` where supported (Android); design so nothing depends on it |
| Sound (optional) | Web Audio, only started after a user gesture |

## Performance rules
- Animate only `transform` and `opacity` on the compositor. Promote moving layers with `will-change` sparingly.
- Pre-render static art to an offscreen canvas or image once; draw images per frame.
- No per-frame `filter: blur` on large *changing* content. Blur a static layer instead.
- Run the rAF loop only while something moves.
- `prefers-reduced-motion`: replace movement with fades.
- Fonts: self-host or use Google Fonts with `display=swap`, with real fallback stacks. Preload the display face.

## Seeing it
- Use Playwright (MCP or script):
  - set the viewport to 390×844 for mobile and 1440×900 for desktop;
  - use `emulateMedia({colorScheme: 'dark'|'light'})`;
  - drive real gestures with `page.mouse` in 16ms steps;
  - shoot mid-animation frames.
  - Stitch the frames with `ffmpeg -filter_complex hstack=inputs=N` and Read the strip.
- Serve with no-cache headers while iterating (`scripts/nocache_server.py`), so you never review a stale build.
- Chrome DevTools performance traces with 4× CPU throttling to check for smooth frames.

## Concept previews
Build concept comparisons as ONE self-contained HTML page:
- a phone frame;
- tabs for each concept;
- canvas or CSS-3D scenes with real interactions;
- a side panel listing "try this" gestures and the palette.

Publish it as an Artifact and let the user play. This is the single highest-leverage step in the whole process.

## Web hero patterns (Softbound v3)
Working source: [../templates/examples/softbound-v3/](../templates/examples/softbound-v3/README.md) (`hero/` plus three list modes). Story and scores: [case-study-softbound.md](case-study-softbound.md).

### Art generated in code (no Figma, no paid AI)
- **Recipe** (`hero/src/art.js`): (1) compose a layered scene per category in Canvas2D with hand-wobbled shapes and brush dabs, lit by a tiny model (albedo x (ambient + key x lit), haze by depth, emissive windows); (2) run ONE shared WebGL2 painterly pass: domain-warp wobble, anisotropic Kuwahara (brush regions), edge pooling, wet bleed and backruns, pigment granulation, paper fibre, then a per-time-of-day grade; (3) tileable linen and paper textures from periodic noise.
- Author in a fixed design space (300x400) and render once at 768x1024; cache per (tag, time). Budget: all covers under ~600ms.
- Because it is code, the same art exports to PNG for the Flutter port (`hero/tools/export_assets.js`).

### Studio light, gobo, time-of-day relight (`hero/src/scene.js`)
- One key light from a window at the top-right, a window-frame shadow (gobo) on the floor, a light shaft plus drifting dust, soft ground contact.
- Three states from the real clock (morning, golden, night with the gobo off and a lamp pool). Do not cross-fade two renders: `applyTod(p)` blends the light MODEL (direction, colours, intensities, env intensity, gobo) with eased `p` over ~1.4s, so the transition moves like a sun. Pre-bake the end states.
- The brass pull cord (`cord.js`) is the control; the glass globe previews the next sky.

### Turntable and 2.5D camera
- Books sit on a circle; drag spins with friction and snaps to detents; each book leans with angular velocity (centrifugal tilt, <=7 degrees); ribbons are Verlet ropes. A pure camera function (project, `plane` that flattens z for hit-testing) was the shared piece that let Flutter match 1:1.
- Render loop sleeps when settled and wakes on input (`wake(ms)`).

### Synthesized sound (`hero/src/sound.js`)
- WebAudio only, started after a user gesture, no files: thup, tick, whoosh, riffle, scratch, clap, pop, sink, bleed. Each has a known duration so it can be rendered offline and exported as WAV (Flutter plays the same sounds). Mute persisted; haptics via `SBHaptics` where supported.

### Labs per subsystem
`art-lab.html`, `open-lab.html`, `sound-lab.html`: one page per subsystem so an agent can iterate on it alone (view every cover at every time, the open sequence on a loop, every sound with a waveform) with no scene around it. Contract assigns each file one owner.

### Single-file bundling (`build.py`)
`index.html` loads `src/*.js` in contract order; `python3 build.py out.html [--local]` inlines them into one page (Artifact form strips doctype/head). Every module must feature-detect the ones before it so labs run alone.

### Blind judging against the previous version
Record both versions the same way (`tools/record.js`, `shot.js`), strip the labels, give the critic only the recordings/sheets and ask which wins and the Wow score. v3 beat v2 in 3 of 3 blind runs, still at Wow 7: judging is how you find the next fix list, not a finish line. Judge from recordings, never from a single still.

### List modes for "easy to check files" without losing the premium feel
A hero shelf is lovely but slow to scan. Ship views of the SAME data, switched by a view picker, each reachable by a flight of the actual objects (books fly into place):
- **Spine view** (`list-spine/`): books turn to show spines, dense and still tactile.
- **Card catalogue** (`list-catalog/`): index cards in a drawer, flick to browse.
- **Scannable rows** (`list-rows/`, `rows.js`): painted thumbnail, title, 2-line excerpt, tag, date and word count, sections, swipe left to bin and right to pin, long-press peek, live search highlight. Rows are the "real" list; keep type and hit targets ordinary and put the art in the thumbnail and the transitions.
Rule: every view keeps every feature (open, delete, undo, search).
