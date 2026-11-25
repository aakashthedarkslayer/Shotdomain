# Softbound v3: build contract

**Read first:** STORYBOARD.md (the experience), then this file.
**The v2 benchmark to beat:**
- `../directions/dir-b.html` (source);
- `../directions/shots/final-local.html#b` (runnable);
- `judge/test/v2-shelf-sheet.png` (v2's open sequence in motion).

**Stack:** plain browser JS with three.js r128 UMD, global `THREE`, from `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`.
- No other libraries.
- No external assets: every texture and sound is generated in code.
- Fonts come from Google Fonts: Bricolage Grotesque, Newsreader.

## Files and owners (edit ONLY your own files)
| File | Owner | Exposes |
|-|-|-|
| `src/art.js`, `art-lab.html` | ART agent | `window.SBArt` |
| `src/sound.js`, `sound-lab.html` | SOUND agent | `window.SBSound`, `window.SBHaptics` |
| `src/book.js`, `src/open.js`, `open-lab.html` | OPEN agent | `window.SBBook`, `window.SBOpen` |
| `src/scene.js`, `index.html`, `src/notes.js` | SCENE agent | `window.SB` |
| `CONTRACT.md`, `STORYBOARD.md`, `build.py`, `tools/` | orchestrator | — |

`index.html` loads, in order: three.js, `src/notes.js`, `src/art.js`, `src/sound.js`, `src/book.js`, `src/open.js`, `src/scene.js`. Every module must **work if a module loaded before it is missing**: feature-detect and fall back. The orchestrator inlines them all into one HTML file at the end.

## Shared data: `src/notes.js` (SCENE owns it)
`window.SB_NOTES` = the 5 v2 sample notes, each `{id, title, body, tag, date, mood}`, with tags Travel/Recipes/Personal/Work/Reading. New notes use the tag `Ideas`.
Cloth colours: Travel #A9C8EE, Recipes #F5B98A, Personal #EFB3C2, Work #A8DCC4, Reading #F3DB8C, Ideas #CDBDF2.

## `window.SBArt` (ART)
```js
SBArt.ready                      // Promise, resolves when the painter is initialised
SBArt.cover(tag, {time})         // Promise<HTMLCanvasElement>, 768×1024 painted illustration, no text. time: 'morning'|'golden'|'night' (default 'golden')
SBArt.linen(hex, size=512)       // {albedo: Canvas, normal: Canvas}, tileable linen weave
SBArt.paper(size=1024)           // Canvas, tileable warm paper fibre with very subtle grain
SBArt.timeNow()                  // 'morning'|'golden'|'night' from the real clock (night 20:00–06:00, golden 16:00–20:00)
```
Results are cached. Painting all 6 covers must take under 600ms on a laptop.

## `window.SBSound`, `window.SBHaptics` (SOUND)
```js
SBSound.unlock()                         // call on the first user gesture; no sound before it
SBSound.play(name, {pitch=1, gain=1, pan=0}) // name: thup | tick | whoosh | riffle | scratch | clap | pop | sink | bleed
SBSound.room(on)                         // very low room tone
SBSound.muted / SBSound.setMuted(bool)   // persisted in localStorage, wrapped in try/catch
SBHaptics.selection() / .light() / .medium()  // navigator.vibrate patterns where allowed; no-op elsewhere
```

## `window.SBBook`, `window.SBOpen` (OPEN)
```js
const book = SBBook.create(note, {clothHex, label /*Canvas*/, linen /*{albedo,normal}*/, paper /*Canvas*/})
book.group            // THREE.Group, origin at the bottom-centre of the spine side; the book stands upright, about 1.0 wide × 1.4 tall × 0.28 deep (world units)
book.setCover(angle)  // 0 = closed … Math.PI*0.95 = fully open (the hinge is on the spine)
book.setFan(t)        // 0…1, the page block splays and curls (page-curl shader)
book.squash(sx, sy)   // jelly squash about the base
book.ribbonAnchor     // THREE.Object3D where a ribbon hangs from; SCENE simulates the ribbon
book.setLabel(canvas) / book.setCloth(hex) / book.setTitle(text) // re-bind live (foil title on the cover and spine)
book.dispose()
SBOpen.open(book, SB) // Promise: lift arc, then hinge spring, fan, dolly to the page, then the editor overlay is shown
SBOpen.close()        // Promise: reverse, with a clap and an air puff, back to the slot
SBOpen.isOpen
```
SBOpen owns the reading/editing overlay (a real textarea on the page, debossed ink drying from wet to dry) and calls `SB.save(note)` when the user saves.

## `window.SB` (SCENE)
```js
SB.renderer, SB.scene, SB.camera, SB.screenEl /* the phone screen element */
SB.books              // [{book, note, slotAngle}]
SB.requestFrame()     // wake the frame loop (it must stop again when idle)
SB.onTick(fn)         // fn(dt) is called each frame while awake; returns an unsubscribe function
SB.puff(originVec3, strength) // air puff: ribbons and neighbours react
SB.save(note) / SB.remove(note) / SB.create(tag)
SB.time               // current 'morning'|'golden'|'night'
SB.light              // {key: DirectionalLight, gobo: …}, so open.js can match the lighting
SB.homeOverlay(show)  // fades the home UI chrome in and out
```
SCENE calls `SBOpen.open(book, SB)` when a book is tapped. If `SBOpen` is missing, it falls back to the v2-style open.
SCENE uses `SBBook.create`. If it is missing, it uses its own provisional book, built from the v2 code. **Build the provisional book behind exactly the same interface,** so the swap is free.

## Page
`index.html` is the hero page:
- one large phone (the screen is 390×844 CSS px, scaled to fit the viewport height) centred on a soft studio background;
- a one-line caption, a sound toggle and "Replay";
- the autoplay demo (STORYBOARD 10s) runs when the phone is ≥60% visible, stops on the first touch, and is skipped under reduced motion.

## Verification tools (shared, don't edit)
- `node tools/shot.js <page.html> <hash|-> <steps.json|-> <outdir>`: still screenshots (see its header).
- `node tools/record.js <page.html> <steps.json> <outdir> [--clip "<css>"]`: motion. It writes `<name>.mp4`, `<name>-sheet.png` (a frame every 100ms) and `<name>-fps.txt`. READ the sheets; that is how motion gets judged now.
- Wrap runs in `perl -e 'alarm 120; exec @ARGV' …`.
- Never use the Playwright MCP or another shared browser, and never touch a phone.

## v2 parity: never drop these (v3 must be a superset of v2)
Each agent keeps every item below; the orchestrator diffs old vs new element by element before showing the user. Anything intentionally replaced is listed here with its replacement.
- **Home:** "N notebooks" · "Your shelf" · search · front note: tag pill **with icon**, date · **N words**, title, **2-line excerpt** · tag chips **with icons** · dock with +.
- **Note page:** back · tag pill with icon · **delete** · date + word count · "Edited just now" after typing · Save.
- **Create:** choose the notebook's **tag/cloth** (picker shows on a fresh notebook; tap the pill any time) · title · body.
- **Delete:** with undo.
- **Replaced on purpose:** dock grid → helix library overview; dock calendar → time-of-day light.
- **Added from the best of v2 (keep these too):** living covers on the front book (`src/alive.js` + `book.setLabelFx/labelFrame`, from Meadow); the cover's lights go out as a book sinks and come back on undo (Meadow); the brass pull-cord for time of day (Atelier) *alongside* the sun button.
- **Delete evolved (2026-11-06):** the book leaps into a clay bin thrown on the plinth (anticipates during the drag-down, gulps, burps, sinks); undo spits it back. All three triggers are kept (drag down, the Delete key, trash in the note); undo is kept; reduced motion keeps the original sink-into-clay.
- **Bin evolved (2026-11-06, BIN agent):** deleted books stay in a clay pot on the plinth rim (spines + count badge) until emptied; tap the pot or "View" to look inside, browse, "Bring back" any book; hold-to-empty fires the pot like a kiln. Toast keeps Undo (5s ring, pauses on hover/focus) + View; Ctrl/⌘+Z restores the newest. `SB.bin` API. Files: `src/scene.js` (bin section), `src/binview.js`.
- **Pull-cord evolved (2026-11-06, CORD agent):** brass rosette + ball-chain + glass globe showing the next time of day; detent click, recoil clinks, sway on spin, one-time invitation; tap/Enter still work. File: `src/cord.js`.
