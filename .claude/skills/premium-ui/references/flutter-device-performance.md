# Flutter: measuring and fixing performance on a real device

Learned shipping Softbound (2026-11). Tests see CPU only; the GPU, audio and image lifetimes only show up on the phone. Worked examples: `softbound/lib/main.dart`, `lib/fx/sfx.dart`, `lib/studio/studio_layer.dart`, `lib/book/book_view.dart`, `test/leak_test.dart`.

## 0. Rules at a glance → drop-in template (`templates/flutter/`)
| Rule | Template |
|-|-|
| Opt-in on-device frame logger; bisect GPU cost with `PERF_HIDE` / `FORCE_*` defines | `lib/kit/perf_log.dart` |
| One frame loop that sleeps when nothing moves; `detach()` on dispose; queue view switches | `lib/kit/world_clock.dart` |
| Idle effects: Timer ~30Hz → ValueNotifier inside a RepaintBoundary; gated, finite, stopped while hidden | `lib/kit/low_rate_effect.dart` |
| Tint and shade with vertex-colour modulate; `plus` not `screen`; cut polygons on the CPU instead of clipping | `lib/kit/vertex_tint.dart` |
| Bake faces once, and per frame only change matrices (one picture per object) | `lib/kit/baked_face.dart` |
| Async bakes; retire images ~250ms later; idempotent dispose; one bake in flight, latest wins | `lib/kit/image_lifetime.dart` |
| No live full-screen shader during camera moves: warp the last bake (plane homography) | `lib/kit/cam25d.dart` `planeHomography` |
| Relight live only during the sweep; bake the end state ahead | `lib/kit/live_relight.dart` |
| Soft shadows as one vertex mesh, no blur | `lib/kit/shadow_mesh.dart` |
| Inactive layered views: IgnorePointer + ExcludeSemantics | `lib/kit/inactive_view.dart` |
| audioplayers: lowLatency, own pool, no-op PositionUpdater, focus none | `lib/kit/sfx_pool.dart` |
| Regression tests: leaks (`transientCallbackCount`), GPU-cost counts, renders | `test/kit_example_test.dart`, `test/gpu_cost_canvas.dart`, `test/render_test_helper.dart` |

## Measured budgets (Softbound, I2202, Android 14, 120Hz, Impeller, release + PERF_LOG)
| Scene | Raster p50 | Notes |
|-|-|-|
| Shelf spin (5+ baked books, shadows, gobo) | ~5ms | Same at morning, golden and night, 0 jank, once the night-only ColorFilter and the blurred text halo were removed |
| Catalogue flick-scroll (40 notes, drawVertices cards) | 1.6ms | Was 28–40ms with multiply blends, a colour filter per card and clips |
| Night spin before the halo fix | p90 ~25ms | ~10 dropped frames/s, from a blurred `Shadow` on cross-fading text |
| Idle | 30fps | Only the living-cover Timer, by design. Everything else sleeps |
Budget for new work: raster p90 under 8ms at 120Hz (16.7ms at 60Hz). Zero frames at idle, except for one deliberate low-rate effect.

## 1. Measure on the device, opt-in
Add a `PERF_LOG` dart-define frame logger (zero cost when off). It prints build/raster percentiles every second *only while frames are produced*, plus `transientCallbackCount` (leaked tickers show here) and your own state (view, mode):
```dart
if (const bool.fromEnvironment('PERF_LOG')) _perfLog(world);
void _perfLog(World world) {
  final b = <double>[], r = <double>[]; var last = DateTime.now();
  SchedulerBinding.instance.addTimingsCallback((List<FrameTiming> ts) {
    for (final t in ts) { b.add(t.buildDuration.inMicroseconds / 1000); r.add(t.rasterDuration.inMicroseconds / 1000); }
    if (DateTime.now().difference(last).inMilliseconds < 1000 || b.isEmpty) return;
    last = DateTime.now();
    String q(List<double> v) { v.sort(); return 'p50 ${v[v.length ~/ 2].toStringAsFixed(1)} p90 ${v[(v.length * .9).floor().clamp(0, v.length - 1)].toStringAsFixed(1)} max ${v.last.toStringAsFixed(1)}'; }
    final jank = [for (var i = 0; i < b.length; i++) if (b[i] > 16.7 || r[i] > 16.7) 1].length;
    debugPrint('PERF n=${b.length} jank=$jank | build ${q(b)} | raster ${q(r)} | transient=${SchedulerBinding.instance.transientCallbackCount}');
    b.clear(); r.clear();
  });
}
```
- **Build (CPU) vs raster (GPU):** raster is the usual killer and tests can't see it. Split the cost by *removing one layer at a time* with diagnostic dart-defines: `FORCE_TOD=golden`, `FORCE_VIEW=catalogue`, `PERF_HIDE=<layer>`; compare raster p90.
- Build a release/profile APK with `--dart-define=PERF_LOG=true`, run a **scripted adb input session** (`adb shell input swipe/tap`), read `adb logcat -s flutter | grep PERF`. Guard every scripted input with an "app is in front" check (`dumpsys window | grep mCurrentFocus`) so taps never land in the user's other apps.
- Never capture the device screen without permission (it may show private apps); crop status bars. `hooks/` has the guard.
- Log SFX starts too (`Sfx.debugWhere`) so a sound that fires every frame is visible next to the frame numbers.

## 2. Impeller GPU cost rules
Each of these costs an offscreen pass or a backdrop copy: `ColorFilter`, `saveLayer`/`Opacity` on big areas, clips with anti-alias on animated content, advanced blends (`screen`, `multiply`, `overlay`, `softLight`...).
- Tint with **vertex colours + `BlendMode.modulate`** (a pipeline blend) instead of `ColorFilter`. This was a per-face filter that only applied at night and made night 2x the GPU cost of day:
```dart
final k = Color.lerp(white, BookStyle.shade, o.shade * BookStyle.shadeMax)!;   // tex x lerp(white, shade, a)
final v = ui.Vertices(ui.VertexMode.triangles, quad(w, h), textureCoordinates: quad(iw, ih), colors: List<Color>.filled(6, k));
c.drawVertices(v, BlendMode.modulate, Paint()..shader = ImageShader(i, TileMode.clamp, TileMode.clamp, Matrix4.identity().storage, filterQuality: FilterQuality.medium));
v.dispose();
```
- Use `BlendMode.plus` instead of `screen` for glows; pre-bake tints into the image.
- No live full-screen shader while the camera moves: bake the room/background to an image, warp the last bake during motion (section 4).
- `RepaintBoundary` around anything that animates at rest (a blinking cursor, a drifting dust layer) so it doesn't repaint its neighbours.

## 3. Idle = zero frames
- `Timer.periodic` (30 Hz), not `Ticker`, for low-rate effects.
- Finite repeat counts; stop animations while the layer is hidden.
- **Lazy-create tickers** (`late final`/null until first use) so `dispose` never creates one.
- Shared controllers: make `dispose` idempotent; add a `World.detach()` for the owner to call.
- Regression test: switch through every view twice, settle, assert `SchedulerBinding.instance.transientCallbackCount <= 3` (`softbound/test/leak_test.dart`).
- Bake finished? Repaint via a notifier bump, never a world tick, so the world can sleep.

## 4. Image lifetime and async bakes
- **Never `toImageSync` during motion** (GPU stall). Render bakes with `Picture.toImage` (async) and keep warping the last image until the new one lands:
```dart
final (room, shade) = await (picRoom.toImage(w, h), picShade.toImage(pw, ph)).wait; // async, off the UI thread
```
- **Never dispose an image that may still be on screen.** On Impeller a disposed image draws as nothing (visible flicker). Retire it ~250 ms later, and only if nothing references it any more:
```dart
void _retire(_Bake b) {
  late final Timer tm;
  tm = Timer(const Duration(milliseconds: 250), () {
    _retiring.remove(tm);
    if (!_full.contains(b) && _lo.values.every((x) => !identical(x, b)) && b != _fade) b.dispose();
  });
  _retiring.add(tm);   // cancel all in dispose
}
```
- A transition that should "move like the prototype" must animate the light model **live** (blended light direction in the shader, `_drawLive`) and pre-render the *end state* off-thread; cross-fading two bakes looks like a dissolve, not motion.
- Keep a low-res bake as an instant fallback, fade it to the sharp one.

## 5. Touch: IgnorePointer and queued switches
- Inactive views must be wrapped in `IgnorePointer` (and `Offstage` if cheap). A lingering full-screen `Listener` in a `Stack` swallows every other layer's touches.
- View switches **queue the latest request** instead of dropping taps made mid-transition.

## 6. Audio pitfalls (audioplayers 6.x on Android)
Full example: `softbound/lib/fx/sfx.dart`.
- Default MediaPlayer mode crashes on overlapping short SFX (`IllegalStateException` in `prepareAsync`) -> `PlayerMode.lowLatency` (SoundPool).
- Its `FramePositionUpdater` schedules a frame callback **every frame forever** per play; SoundPool never reports completion, so they pile up (240+) and the app freezes. Give each player a no-op updater and run your own round-robin pool (not `AudioPool`):
```dart
class _NoPosition extends PositionUpdater { _NoPosition() : super(getPosition: () async => null); @override void start() {} @override void stop() {} }
final p = AudioPlayer()..positionUpdater = _NoPosition();
await p.setPlayerMode(PlayerMode.lowLatency);
await p.setReleaseMode(ReleaseMode.stop);
```
- Audio focus none + sonification/ambient, so the user's music isn't paused:
`AudioContext(android: AudioContextAndroid(audioFocus: AndroidAudioFocus.none, usageType: AndroidUsageType.game, contentType: AndroidContentType.sonification), iOS: AudioContextIOS(category: AVAudioSessionCategory.ambient))`.

## Blurred text shadows inside cross-fades (night jank, 2026-11-07)
- Symptom: night-only jank while a finger moves the shelf (raster p90 ~25ms, ~10 dropped frames/s); morning/golden smooth.
- Cause: the night legibility halo was `Shadow(blurRadius: 10)` on the info text, and that text cross-fades (AnimatedSwitcher + FadeTransition) every time the front book changes. Each fading copy re-blurs every glyph each frame; Impeller has no raster cache to hide it.
- Fix: crisp `Shadow(offset: Offset(0, 1))` (no blur) on text that animates; keep the soft blurred halo only on static text.
- How it was found: bisect with `--dart-define` switches (hide layers, force books to day shading). Neither changed it, and the jank lined up with the seconds the finger was down, which pointed to what reacts to the gesture.
- Test-harness note: flutter_test draws BoxShadow as a hard box (`debugDisableShadows`), so judge soft scrims on the device, not in a render test. adb `input swipe` must match the gesture axis (the shelf spins horizontally); always log the state you expect to change (spin=) so a non-event cannot pass as "smooth".

## 7. Device session checklist (gaps found the hard way)
- **Build:** `flutter build apk --release --split-per-abi --dart-define=PERF_LOG=true` and install the arm64 APK. Keep version codes rising across diagnostic builds (Softbound used 3001–3021), or the install is refused as a downgrade.
- **USB keeps dropping** on large installs: run `adb kill-server && adb start-server`, or switch to wireless debugging (`adb pair` / `adb connect`).
- **Also read** `adb shell dumpsys gfxinfo <package>` (janky frames, percentiles) as a second opinion next to PERF lines.
- **Scripted input:** `adb shell input swipe` must match the gesture axis (the shelf spins horizontally, the catalogue scrolls vertically). Log the state that should change (`spin=`, `view=`) so a gesture that didn't register can't pass as smooth.
- **Only bake at rest:** `toImageSync`/bakes ≤2 per frame and none while scrolling, using an LRU cache (catalogue: 48 cards). Shared art (backs, proxies) is baked once per lighting key. Assert it in tests with a bake counter.
- **saveLayer / ColorFilter inside a one-time bake are fine** (book and spine art tints). The rule is about per-frame drawing. A `ShaderMask` on a small static strip (chip edge fade) is fine too, but never on anything full-screen or animating.
- **RepaintBoundary per item that animates on its own** (a living cover, each list row, the cord glow next to the cord). Without one, a 30Hz cover repainted the shadow layer.
- **Shared controllers** (one per World, used by two widgets) need an idempotent `dispose`, and the World needs a `detach()` that the owner calls.
- **Tests:** flutter_test fails on pending Timers, so low-rate effects must stop before the test ends. Skip once-ever invitations under `Platform.environment['FLUTTER_TEST']`. Don't `await` animating calls before pumping. While iterating, run only your own tests: the full Softbound suite took ~13 min, and concurrent runs slow everyone.
- **Parallel speed:** the orchestrator measures on the device while agents build, and sends them the numbers (SendMessage). Agents never touch the device.
