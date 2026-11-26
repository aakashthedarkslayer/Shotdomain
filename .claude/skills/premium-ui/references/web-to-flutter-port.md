# Web hero first, then a device-perfect Flutter port

The recipe that produced Softbound: build the hero in HTML/three.js (fast to iterate, user previews it), win the user's pick, then port to Flutter and hold it to the web at pixel level.

## Quality bar for the port
- **Side-by-side with the web reference at the phone's real size** (e.g. 412x915), per time of day / theme, same state. Compare crops, not thumbnails. List every difference; fix until none is visible at 1x.
- **Parity checklist ("always evolve, never downgrade"):** list every feature, view, gesture and sound of the old version; tick each in the new one before showing anything. Removal only with a better replacement that keeps the function.
- Device captures only with permission; check the app is in front, crop status bars.

## Architecture that carried over
1. **Shared camera.** Same eye/target/fov as the web scene so world units are 1:1. `Cam` projects world points to pixels and places any widget on a plane in 3D: `Transform(transform: cam.plane(model, worldW, worldH, pixelSize))` at the screen origin (`softbound/lib/world/camera.dart`). Keep the authored aspect (widen fov on taller screens).
2. **Flatten z for hit-testing.** A projective Transform confuses `RenderBox.globalToLocal` (taps in the page mapped to caret 0). Zero the z row and column of the matrix:
```dart
return (vp * model * pixelToLocal)
  ..setRow(2, Vector4(0, 0, 1, 0))
  ..setColumn(2, Vector4(0, 0, 1, 0));
```
3. **2.5D BookView with baked faces.** Each face of an object (cover, spine, page block, edges) is a cached image drawn on its plane; per frame only matrices change. Sort faces by depth; a live widget (the real text editor) sits *between* the faces behind and in front of it. Shade with vertex-colour modulate (see flutter-device-performance.md section 2), never ColorFilter.
4. **Baked studio light.** Room, floor, plinth and shadows rendered once per time of day to images (async), warped to the current camera; relight live only during transitions.
5. **Time of day / theme as a world state** with blended light, not an inversion.

## Render-test harness (no device needed)
`softbound/test/render/helper.dart`: boots the real app inside `flutter test` with bundled fonts and art, fake time, writes PNGs.
```dart
final r = await Render.boot(tester, tod: Tod.golden, size: const Size(412, 915));
await r.shot('home');                                  // test/render/out/home.png
await r.strip('spin', 2.0, () async { /* start an interaction */ });  // contact sheet, 1 frame / 100 ms
```
Details: load fonts with `FontLoader` inside `t.runAsync`; `t.view.physicalSize/devicePixelRatio`; `await t.runAsync(() => b.toImage(...))` for capture (needs real async); advance with `t.pump(16ms)` loops. Read the PNGs/strips, and send them to `ui-critic`. Also use it for regression tests (leak test, hit-test position tests).
Tests only see CPU: always follow with the on-device session in flutter-device-performance.md.
Drop-in version: `templates/flutter/test/render_test_helper.dart` (app-agnostic), with `kit_example_test.dart` (leak + GPU-cost + render) and `gpu_cost_canvas.dart`.

## Web → Flutter mapping (what each web technique became)
| Web prototype | Flutter port | Template |
|-|-|-|
| three.js `PerspectiveCamera` (eye, target, fov) | `Cam25D` with the same numbers; `authored` keeps the framing on taller phones | `lib/kit/cam25d.dart` |
| Meshes with materials | Faces baked to images once per content × lighting key, placed with `cam.plane`, one picture per object | `lib/kit/baked_face.dart` |
| Lit or bent meshes (page curl, a pot lathe) | `drawVertices` grid with an ImageShader and per-vertex light colours | `lib/kit/vertex_tint.dart` |
| A GLSL room or floor shader every frame | The same GLSL as a `FragmentProgram` (same uniform order), baked to an image at rest, warped during camera moves, live only during a relight | `image_lifetime.dart`, `live_relight.dart`, `cam25d.dart` `planeHomography` |
| `requestAnimationFrame` loop | One sleeping `WorldClock`; subscribers leave when they settle | `lib/kit/world_clock.dart` |
| JS springs and Verlet (`sstep`, `stepRope`) | Pure-Dart 1:1 ports (same constants, same dt clamp), unit-testable | `spin_physics.dart`, `verlet_chain.dart` |
| CSS `mix-blend-mode: screen/multiply` | `BlendMode.plus` / `modulate` (pipeline blends) | `vertex_tint.dart` |
| CSS `filter: blur()` / text-shadow halos | Pre-blurred snapshot or images; crisp shadows on animating text | flutter-device-performance.md |
| `box-shadow` under objects | One shadow mesh (cast + pool + contact) | `shadow_mesh.dart` |
| WebAudio synth SFX | The same synth exported to WAV assets, played through the lowLatency pool | `sfx_pool.dart` |
| Canvas-painted art (covers, paper) | Exported from the web code with a node script (`design/v3/tools/export_assets.js`: 18 covers = 6 tags × 3 times, paper, linen, 9 WAVs), never redrawn by hand | — |
| DOM inputs on a 3D page | A real `TextField` on a `BakedFace.live` face (z flattened, so the caret lands where you tap) | `baked_face.dart` |
| Several DOM views toggled by class | Layers in one Stack, each `InactiveView` when not active, switched by `ViewSwitcher` | `inactive_view.dart`, `world_clock.dart` |

## Port order that worked (Softbound)
1. Foundation first, written by the orchestrator: tokens, store, camera, world clock + hooks, art loader, sfx, the shared object view (BookView v0), render harness, an empty layer slot per owner. Then analyze, then a release build.
2. Export the assets from the web code.
3. One agent per layer (studio, shelf, open, bin, home, cord, then the views), each in its own copy against `CONTRACT.md`. Each one reads the web source for exact timings ("port it, don't reinvent it worse").
4. Merge using absolute paths. Never line-merge the tokens file: append or swap whole blocks.
5. Round 2 is look + performance: compare against the web at phone size (cropped device refs per time of day), then measure on the device with PERF_LOG and fix. Repeat until there are no visible diffs and no jank.
6. Re-run the parity checklist against the web feature list before showing the user.
