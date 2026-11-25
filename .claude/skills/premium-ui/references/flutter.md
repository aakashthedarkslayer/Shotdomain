# Flutter reference

## Craft toolbox
| Effect | Tool |
|-|-|
| Custom objects, organic shapes | `CustomPainter`, `Path`, `PathMetrics` (draw-on strokes) |
| Material texture (paper fibre, wood grain, noise) | `FragmentProgram` GLSL (`shaders:` in pubspec), `FlutterFragCoord()`, fbm and domain warp |
| Deforming objects (crumple, cloth, bend) | `Canvas.drawVertices` on a grid with an `ImageShader` of the object's cached image, plus per-vertex Lambert shading (`BlendMode.modulate`). Note: `Vertices.raw` copies its buffers when it's built, so fill them first. |
| 3D lift / tilt | `Matrix4` with perspective `setEntry(3,2,0.0011)`. A lifted object gets **negative** z (`w = 1 + 0.0011·z`). Apply it with `canvas.transform(m.storage)`. |
| Physics | Integrate by hand in a `Ticker` (friction `pow(k, dt)`), or use `SpringSimulation`; stop the ticker when everything has settled |
| Depth of field | `RepaintBoundary.toImageSync(pixelRatio:.5)` → blur once into an image (PictureRecorder + `ImageFilter.blur`) → crossfade with opacity |
| Device-aware light | `sensors_plus` accelerometer with a low-pass ~0.08, clamped, repainting only on change. Wrap `listen` in try/catch, because a missing plugin throws synchronously. Skip it on web. |
| Haptics | `HapticFeedback.selectionClick / lightImpact / mediumImpact` |
| Real text fields with character | a custom `TextEditingController.buildTextSpan` (e.g. wet ink that dries); `StrutStyle(forceStrutHeight)` to lock lines to a grid |

## Performance rules (Impeller, especially OpenGL ES Android)
- Each object: rasterize once (`PictureRecorder` → `toImageSync` at DPR × ~1.25) → `drawImageRect` per frame. Key the cache on content, size and font changes; `dispose()` old images.
- Shadows: pre-blurred images, not `MaskFilter.blur` per frame.
- Skip `saveLayer`/`Opacity` over full-screen areas during animation. A one-off fade of 150ms or less is fine.
- Split layers: static scene in one `RepaintBoundary`, moving things in another, overlays on top.
- Cache static art (pads, baskets, chrome) as images per theme.

## Gotchas learned the hard way
- `google_fonts` runtime fetching fails silently in Android **release** builds (there's no INTERNET permission in the main manifest), so text falls back to the system font. **Bundle the TTFs** in `pubspec.yaml` `fonts:`. For static TTFs, the gwfh API works: `https://gwfh.mranftl.com/api/fonts/<family>?download=zip&subsets=latin,latin-ext&variants=700&formats=ttf`.
- Anything aligned to text (ruled lines, baselines) must use `MediaQuery.textScalerOf(context).scale(fontSize) * heightFactor`. Otherwise the user's font size setting breaks the alignment. Rules inside a scrolling field must follow its `ScrollController`.
- Text with no `Material` ancestor shows the yellow debug underline. Wrap screens in `Material(type: MaterialType.transparency)`.
- Naming a tokens class `Ink` clashes with Material's `Ink` widget. Use `Inks`.
- `dart format` reflows code, so string-anchored edits made after formatting may stop matching. Re-read the file before editing.
- Widget tests give every `TestGesture` event the same timestamp (zero), so long-press and tap-duration logic behaves differently than on a device. Use the `tester.pump` time, or verify on a real device or in the browser.
- macOS has no `timeout` command. Use `perl -e 'alarm shift; exec @ARGV' 300 flutter test …`.
- `flutter test` can appear to hang when the disk is full. Each full project copy is about 900MB, so clean up copies after merging.

## Seeing it (screenshots of real interactions)
- **Web build + Playwright** (fastest loop, real gestures):
  - Build with `flutter build web --release --pwa-strategy=none`. **No service worker**, or you'll see stale builds.
  - Serve it with a no-store server: `python3 -I <skill>/scripts/nocache_server.py build/web 8767`.
  - In Playwright, set the viewport to 390×844, use `emulateMedia({colorScheme})`, and drive it with `page.mouse`: down / move in 16ms steps / up.
  - Shoot mid-animation frames with timed waits.
  - The canvas has no DOM, so get object positions from semantics rects. Don't guess from a downscaled strip.
- **iOS simulator:**
  - `flutter build ios --simulator --debug`, then `xcrun simctl install/launch`.
  - Stills: `xcrun simctl io booted screenshot x.png`.
  - Video: `recordVideo`, then `ffmpeg -vf fps=12` to extract frames.
- **Android:**
  - Use `flutter build apk --release`, then `adb install -r` and `adb shell am start -n <pkg>/.MainActivity`.
  - The emulator may run headless (`-no-window`). Use `adb shell screencap -p /sdcard/x.png` + `adb pull`.
  - **Never screencap the user's physical phone without asking.**
- **Frame timing on a device:** `integration_test` + `binding.watchPerformance(..., reportKey:)`. Run it with `flutter drive --profile --driver=test_driver/perf_driver.dart --target=integration_test/perf_test.dart -d <id>`. Ask first, because it takes over the screen.
- **Goldens** for quick visual checks of painters in tests. Test fonts render as boxes, so judge geometry, not type.
