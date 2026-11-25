# Case study: Softbound, from web v2 to a shipped Android app

Effort and quality level reached 2026-11-03 to 2026-11-07. Source: [../templates/examples/softbound-v3/](../templates/examples/softbound-v3/README.md). Technique notes: [web.md](web.md) (web hero patterns), [flutter-device-performance.md](flutter-device-performance.md), [web-to-flutter-port.md](web-to-flutter-port.md). Companion: [case-study-notes-directions.md](case-study-notes-directions.md) (where v2 came from).

Links: hero https://claude.ai/artifact/J92qgb7GKLoq9TNCgchj31, Spine https://claude.ai/artifact/2iRxpJNsCiP4ZNUVprvTPB, Catalogue https://claude.ai/artifact/JE6fisWuwuzzxApajSsNMB, List https://claude.ai/artifact/VizU1KMb73TzsmcKbQPbS5.

## Timeline
1. **Web v2** (direction B of the notes preview): clay hardcovers, First glance 8 / Wow 7.
2. **Web v3**: storyboard and contract first; ART, SOUND, OPEN, SCENE agents each owned files and a lab. Judged blind against v2: **won 3 of 3 runs, but Wow stayed 7** (target was 9).
3. **Features restored**: parity check against the v3 list ("always evolve, never downgrade").
4. **Clay bin + brass pull cord**: throw, gulp, burp, red-hot kiln for delete; undo toast; cord with a next-sky globe flips time of day.
5. **List modes (web)**: Spine View and Card Catalogue prototypes in parallel, then scannable Rows when the user wanted a real list.
6. **Flutter Android port**: foundation by the orchestrator (tokens, store, camera 1:1 with web, world, assets exported from the web code, harness), then HOME, CORD, STUDIO, SHELF, OPEN, BIN agents in isolated copies; 62 tests, release APK.
7. **Round 2, look + performance**: device captures vs the web showed a washed morning, lost clay colour, floating books; STUDIO, BOOK, SHELFBIN agents fixed look and perf. 77 tests.
8. **Views + picker**: list (rows), Stack (from Spine), Catalogue, a view picker in the header; `enum ShelfView`; 89 then 129 tests.
9. **Device-debugging round** on a real phone (arm64, Android 14, 120Hz): PERF_LOG measured session, A/B by layer, fixes below. Kit v3.0.0 finalised.

## Scores (ui-critic, First glance / Wow)
| Piece | FG / Wow | Note |
|-|-|-|
| Web v2 | 8 / 7 | the benchmark |
| Web v3 | beat v2 3/3 blind | Wow 7 |
| Flutter HOME | 8 / 6.5 | |
| CORD | 8 / 7 | |
| STUDIO | 7 / 6 | faint book shadows on clay, orange night floor |
| SHELF | 7 / 8 | helix fly-in and bleed were highlights |
| OPEN | 8 / 7 | leaves riffled as flat slabs |
| BIN | 7 / 7 | red-hot kiln read well |
Final device verdict: night spin raster p50 ~5ms, 0 jank, same as morning and golden; idle 30fps only from the living-cover Timer, by design.

## What made it premium
- A concept world with one object (the clay book) and rituals for every action, not a styled list.
- All art and sound generated in code: covers per tag per time of day, linen, paper, synthesized sounds. Nothing stock.
- Light as a model: window, gobo, dust, relight by blending the model, driven by a physical pull cord.
- Physics with weight: detents, lean, Verlet ribbons, hinge spring overshoot, clay that dents.
- Living covers, first-launch ghost-finger demo, sound and haptics on every beat.
- Several views of the same data (shelf, stack, catalogue, rows) so it is also quick to scan.

## Mistakes and how they were fixed
| Problem | Fix |
|-|-|
| App crashed on overlapping SFX (audioplayers MediaPlayer mode) | lowLatency (SoundPool), own player pool, audio focus none so music is not paused |
| audioplayers FramePositionUpdater leaked a frame callback per play, forever | no-op PositionUpdater in our pool |
| Frame stalls from `toImageSync` during motion | never during motion; bake async (`Picture.toImage`) and warp the last image |
| Flicker: an image disposed while still on screen (draws nothing on Impeller) | defer dispose ~250ms |
| Lost touches after opening Catalogue: a full-screen Listener in a Stack swallowed other layers | inactive views are IgnorePointer; view switches queue the latest request instead of dropping taps |
| Day/night transition did not look like the prototype | animate the light model live (blended direction), not a cross-fade of two bakes; pre-render end states off-thread |
| Catalogue scroll GPU 28-40ms per frame | bake cards, vertex-colour tint, no per-item filters: **1.6ms** |
| Night spin jank (night ~2x day GPU) | cause: blurred text-shadow halo on the cross-fading info text and a ColorFilter on faces. Crisp shadow there (soft halo only on static header); tint with vertex colours + BlendMode.modulate |
| Living-cover repaint leaked into shadows | RepaintBoundary |
| Hang in picker test | don't await showView before pumping frames |
| Merge dropped a closing brace in tokens.dart; relative-path merge silently merged nothing | tokens: base + each agent's appended block; merge script with ABSOLUTE paths |
| Caret misplaced under perspective | `Cam.plane` flattens z for hit-testing |
Rules distilled: bake faces and rooms; no live full-screen shader during camera moves; Impeller ColorFilter, saveLayer, clip and screen/multiply/overlay each cost an offscreen pass; idle must be zero frames (Timer for low rate, lazy tickers); idempotent dispose; World.detach.

## Process lessons
- **Contract first**, one agent per owned area in isolated copies, models by difficulty (opus for rendering, physics, shaders; sonnet for contained work). One writer per file.
- **Agents were too slow running the full suite** (~13 minutes, and concurrent runs slow everyone). Agents run only their own tests; the orchestrator runs the full suite once after the merge.
- **Merge with absolute paths**; never line-merge the tokens file; resolve conflicts on render PNGs by ignoring them.
- **Always evolve, never downgrade**: a parity checklist (v3 feature list) was checked element by element at each port and port round.
- **Measure on the device**: opt-in PERF_LOG, `--dart-define` A/B (FORCE_TOD, FORCE_VIEW, PERF_HIDE=layer), scripted adb sessions guarded by an app-in-front check; raster vs build split by removing a layer at a time (tests only see CPU). Version codes must keep rising across diagnostic builds. USB drops on big installs: wireless debugging.
- **Ask before device captures** (crop status bars) and before starting another agent round once a usable version exists.
- Judge from recordings and side-by-sides at the phone's real size, per time of day.
