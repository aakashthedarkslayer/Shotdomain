# Softbound v3 (web hero + three list modes)

Source of the November 2026 benchmark: a clay turntable of linen hardcover books under studio light. Every texture, cover illustration and sound is generated in code (no Figma, no AI images, no audio files). Story: [../../../references/case-study-softbound.md](../../../references/case-study-softbound.md). Patterns: [../../../references/web.md](../../../references/web.md) (section "Web hero patterns").

| Folder | What | Published |
|-|-|-|
| `hero/` | The v3 hero: shelf turntable, open/edit/close, clay bin, brass pull cord, time-of-day relight | https://claude.ai/artifact/J92qgb7GKLoq9TNCgchj31 |
| `list-spine/` | Spine View: the shelf seen as a row of spines | https://claude.ai/artifact/2iRxpJNsCiP4ZNUVprvTPB |
| `list-catalog/` | Card Catalogue: index-card drawer you browse | https://claude.ai/artifact/JE6fisWuwuzzxApajSsNMB |
| `list-rows/` | List: scannable rows (painted thumbnail, title, 2-line excerpt, tag, date, sections, swipe to bin/pin, long-press peek, live search highlight) | https://claude.ai/artifact/VizU1KMb73TzsmcKbQPbS5 |

Each folder is self-contained: `index.html` + `src/*.js` (the modules listed in its `CONTRACT.md`), `build.py`, `tools/`, three labs, `STORYBOARD.md`, `CONTRACT.md`, and `still-*.png` stills. `page.html` is a prebuilt page. Shots, judge runs and videos were left out.

## Build and run
```
cd hero            # or list-spine / list-catalog / list-rows
python3 build.py out.html --local     # one standalone file, opens in a browser
python3 build.py out.html             # Artifact form (no doctype/head), for publishing
python3 -m http.server 8000           # then open /index.html (loads src/*.js directly) or /art-lab.html, /open-lab.html, /sound-lab.html
```
three.js r128 and the two Google Fonts load from CDNs, so you need a network. `tools/shot.js`, `record.js`, `export_assets.js` use `puppeteer-core` (run `npm i puppeteer-core` inside `tools/`) and a local Chrome at `/Applications/Google Chrome.app`; edit that path on other machines. `export_assets.js <outdir>` dumps the 18 covers, linen and paper PNGs for the Flutter port (sounds were exported as WAV from SBSound's offline render).

## Where to look
- `src/art.js`: painter (layered Canvas2D scene, then a WebGL2 painterly pass: Kuwahara, wet bleed, granulation), `linen()`, `paper()`.
- `src/scene.js`: renderer, studio light, gobo, dust, plinth, `applyTod(p)` relight, turntable physics, search, helix overview.
- `src/book.js`, `src/open.js`: the book object and open/edit/close; `src/binview.js`, `src/cord.js`, `src/alive.js`: bin, cord, living covers.
- `src/sound.js`: WebAudio synthesis + haptics. `src/rows.js` (list-rows only): the row list.
