# Case study: the 4-direction notes preview (v2 benchmark)

This is the effort and quality level reached in November 2026. Treat it as the **minimum** for any concept round, and use it to plan time, rounds and agents.

- **The finished page:** [templates/examples/notes-directions/notes-directions.html](../templates/examples/notes-directions/notes-directions.html). Open it in a browser; the first tab is B.
- **Stills:** in `templates/examples/notes-directions/shots/`.
- **Client verdict:** "All 4 UI/UX are incredible… I liked the idea." The Wow scores still stalled at 7 (see *Path to Wow 9*).

## Why this round existed
Round 1 of Atelier offered 3 metaphor worlds, and only 1 landed. The client then showed Dribbble shots (illustrated travel, 3D-character translate app, photo-led travel, gadget shop) and asked why we never offered UI like that.

The fix: show a **range**, from art-led polish to a world to a wild card, with real artwork in every direction.

## The four directions (same app, same 5 notes, same note opened in phone 2)
| | Direction | Look | Signature moment | Technique |
|-|-|-|-|-|
| A | **Meadow**: art-led polish | Hand-drawn layered SVG cover per tag (Kyoto pagoda, a kitchen, a cat in a window, a paper plane over a skyline, a monsoon window); Young Serif + Figtree; soft dawn colour fields | The card's cover grows into the note header on a spring, with depth layers moving at different rates; covers are alive (petals, steam, a breathing cat); delete = the scene's lights go out | One `art(tag)` → SVG function with 5 depth groups, a spring-driven resize morph, CSS animations only on visible covers |
| B | **Softbound**: art + signature motion (*our pick*) | Linen-clay 3D hardcovers with A's illustrations as debossed labels and foil titles on a warm clay plinth; Bricolage Grotesque + Onest + Newsreader | Drag to spin the shelf; tap and the cover hinges open while the camera moves into the page; drag down and the book sinks like jelly | three.js r128, one renderer, a canvas-rasterized SVG → CanvasTexture, MeshPhysical sheen, a frame loop that stops when idle |
| C | **Atelier**: a world | Paper sheets on walnut/oak under a brass lamp, a wicker basket; Caveat + Fraunces + Manrope | Hold to crumple → flick into the basket → fish the ball out, keeping its creases; pull the lamp chain for day/night | Canvas 2D, a per-pixel-shaded paper ball, layout with no covered titles |
| D | **Inkwell**: the wild card | Notes as ink blooms in dark water, each tag its own hue and shape; Cormorant Garamond + Hanken Grotesk | Tap: the bloom floods the screen, then parts into a clear reading pool; typing pushes the shoreline; delete = the ink dissolves | WebGL fragment shader (domain-warped FBM, a repulsion field from the text bounds, dither) |

## Process that produced it
1. **I wrote the contract first:**
   - `directions-shell.html`: tabs, phone frames, the spec panel, `window.SAMPLE_NOTES` and `Directions.x = {mount, show, hide}`.
   - `scripts/build_directions.py`: assembles the page from the fragments.
2. **Then 4 agents ran in parallel**, each owning only `dir-x.html`, with models by difficulty: opus for the art, 3D and shader directions; sonnet for porting an existing concept.
3. **Each agent checked its own work:** it screenshotted with `scripts/shot.js` (its own headless Chrome, parallel-safe), read its PNGs, and did 3+ improve rounds.
4. **The orchestrator merged:** it built the page, took one shot of all tabs plus a 400px check, then sent everything to **one `ui-critic` pass across all 4 directions** and published.
5. **Fix rounds resumed the same agents** (SendMessage), so each kept its full context.
6. **Wall-clock time:** about 25 minutes for round 1 and about 10–15 minutes for each later round.

## Score progression (ui-critic, First glance / Wow)
| | Round 1 | Round 2 | Round 3 |
|-|-|-|-|
| A Meadow | 8 / 5 | 9 / 6 | 9 / 6 |
| B Softbound | 6 / 6 | 8 / 7 | 8 / 7 |
| C Atelier | 6 / 7 | 7 / 7 | 7 / 7 |
| D Inkwell | 7 / 7 | 8 / 7 | 8 / 7 |

The critic's client-love ranking flipped from A > D > B > C in round 1 to **B > A > C > D** once B became the hybrid.

## Lessons (apply them every time)
1. **Art wins the first 3 seconds.** The art-led direction scored the highest first glance from round 1. Pure 3D pastel shapes with no art scored 6, and B was "five blank slabs in a void".
2. **The hybrid is usually the pick:** A's artwork on B's signature object. Never recommend a direction whose still frame has no art.
3. **Polish plateaus at round 3.** Scores moved +0–1, and Wow stayed capped at 7. More rounds on all 4 directions waste time. Stop, let the client choose, and invest in one.
4. **Still frames cap Wow.** The critic sees PNGs; Wow lives in motion, sound and touch. For Wow ≥9, judge screen recordings and the real device.
5. **Hidden gestures don't sell.**
   - Each live phone autoplays its signature moment once, with a ghost fingertip (in the world's material, e.g. an ink drop).
   - Start it with IntersectionObserver (≥60% visible) and hand control over at the first touch.
   - **End on the most beautiful frame** (B's demo first ended on its weakest frame, the open book).
6. **Compare like with like:** same sample content, and the same note opened in phone 2.
7. **Verify a "bug" before fixing it.** D's "corrupted text" turned out to be the screenshot script's End key, not the app.
8. **Keep work inside the project** (`design/directions/`). A reboot wiped `/tmp` mid-round, and recovery meant reading back the published artifact.
9. **Once a usable version is published, ask before starting another round.** The user stopped an automatic round 3.
10. **Shell gotcha (fixed in the v2 template):** in this case study `.phone` had no `box-sizing`, so the screens were 300×640, not 282×622. The template now uses border-box, so screens are 282×622.

## Path to Wow 9 (planned, not built)
Pick ONE direction and rebuild its signature moment at hero quality:

| Direction | Hero rebuild |
|-|-|
| A | The camera flies *into* the illustration (3D parallax planes); the art's time of day follows the real clock |
| B | Physics flicks off the shelf, a real page-curl shader, soft paper sound |
| C | A true crumple simulation, paper sound, a physics arc into the basket |
| D | A GPU fluid simulation (Navier–Stokes) that reacts to the finger and to typing |

Judge it by screen recording plus testing on the phone with sound and haptics, not stills.
