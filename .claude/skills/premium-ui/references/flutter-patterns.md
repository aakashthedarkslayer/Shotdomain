# Flutter patterns (proven in Atelier)

Copy these and adapt them. Each one solved a real problem on a mid-range Android phone running Impeller on OpenGL ES.

## 1. Rasterize-and-cache an object (draw once, blit every frame)
```dart
class _Raster { ui.Image? image; String key = ''; void drop() { image?.dispose(); image = null; } }

ui.Image rasterOf(Thing t, double px) {          // px = devicePixelRatio * 1.25 (lift headroom)
  final key = '${t.contentKey}\u0000${t.size}\u0000$px\u0000$fontEpoch';
  if (t.raster.image != null && t.raster.key == key) return t.raster.image!;
  t.raster..drop()..key = key;
  final rec = ui.PictureRecorder();
  final c = Canvas(rec)..scale(px);
  t.paintStatic(c);                               // material fill/shader, texture, text: everything static
  final pic = rec.endRecording();
  t.raster.image = pic.toImageSync((t.size.width * px).ceil(), (t.size.height * px).ceil());
  pic.dispose();
  return t.raster.image!;
}
// Per frame: canvas.save(); translate/rotate/scale; canvas.drawImageRect(img, src, dst, paint); restore.
// dispose() the image when the object is removed.
```

## 2. Pre-blurred shadows (no MaskFilter.blur per frame)
Render the object's silhouette once per size into 2–3 images with increasing blur (contact / tight / soft). Per frame, draw them scaled and offset away from the light, crossfading by "height" through `Paint.color` alpha. Share them between objects of the same size.

## 3. Depth of field / focus pull: snapshot once, then fade
```dart
final shot = (key.currentContext!.findRenderObject() as RenderRepaintBoundary).toImageSync(pixelRatio: .5);
final rec = ui.PictureRecorder();
Canvas(rec).drawImage(shot, Offset.zero, Paint()..imageFilter = ui.ImageFilter.blur(sigmaX: 6, sigmaY: 6, tileMode: TileMode.clamp));
_blur = rec.endRecording().toImageSync(shot.width, shot.height);
shot.dispose();
// Per frame: draw _blur stretched to full size with alpha = focus, plus a scrim rect at .45*focus.
// Don't repaint the layer underneath while the overlay is up.
```

## 4. A frame loop that runs only while something moves
```dart
late final Ticker _ticker = createTicker(_tick);
Duration _last = Duration.zero;
void kick() { if (!_ticker.isActive) { _last = Duration.zero; _ticker.start(); } }
void _tick(Duration t) {
  final dt = ((t - _last).inMicroseconds / 1e6).clamp(0.0, 1 / 30); _last = t;
  for (final o in objects) o.step(dt);           // friction: v *= pow(0.04, dt); springs; timers on a scene clock
  frame.value++;                                  // CustomPaint(repaint: frame)
  if (objects.every((o) => o.settled)) { _ticker.stop(); persist(); }
}
// Call kick() from every gesture or event that starts motion.
```

## 5. A keyframe engine for choreographed motion (continuous, with per-segment easing)
```dart
double _pos(double t, List<double> ts, List<Curve> cs) {      // returns segment index + eased fraction
  t = t.clamp(0.0, 1.0); var i = 0;
  while (i < cs.length - 1 && t > ts[i + 1]) i++;
  return i + cs[i].transform(((t - ts[i]) / (ts[i + 1] - ts[i])).clamp(0.0, 1.0));
}
double _at(double p, List<double> v) { final i = p.floor().clamp(0, v.length - 2); return v[i] + (v[i + 1] - v[i]) * (p - i); }
// close: keys [0, .62, .85, 1], curves [emphasized decel, gravity Cubic(.6,0,.95,.45), decel]
// e.g. lift: _at(p, [0, .75, 0, 0]); fire the landing haptic at t == .85
```

## 6. 3D lift and tilt for one object
```dart
Matrix4 liftMatrix(Offset c, double lift, double tiltX, double rot, double s) => Matrix4.identity()
  ..translateByDouble(c.dx, c.dy, 0, 1)
  ..multiply(Matrix4.identity()..setEntry(3, 2, 0.0011))   // perspective
  ..translateByDouble(0, 0, -lift * 90, 1)                 // NEGATIVE z = toward the viewer (bigger)
  ..rotateX(tiltX)                                         // negative tips the top edge away
  ..rotateZ(rot)
  ..scaleByDouble(s, s, s, 1);
// canvas.save(); canvas.transform(m.storage); draw the cached image centred at the origin; canvas.restore();
```

## 7. Deforming an object (crumple, bend, cloth)
Draw the cached image (pattern 1) as an `ImageShader` on a grid of about 16×20 cells with `Canvas.drawVertices`. Move the vertices toward the target shape, using a deterministic crease field (Voronoi seeds from the object's id). Shade each vertex with Lambert lighting from the scene's light, passed as vertex colours with `BlendMode.modulate`. Clamp brightness to 0.6–1.0 so the material never goes grey. Let blue fall off fastest so shadows stay warm. Reuse the Float32List buffers. `Vertices.raw` copies its buffers when constructed, so fill them first.

## 8. Text with character, still a real TextField
Subclass `TextEditingController` and override `buildTextSpan` to style character ranges by age (for example, wet ink dries over 450ms). Track the inserted ranges in the `value` setter by diffing the common prefix and suffix. Drive repaints with a Ticker that stops once all ink has dried. Keep a composing underline. Skip the wet phase under reduced motion.

## 9. Lines locked to text (ruled paper, baseline grids)
```dart
final pitch = MediaQuery.textScalerOf(context).scale(strut.fontSize!) * strut.height!;   // follows the user's text size
// Paint the rules with CustomPaint(painter: Rules(pitch, scrollController)), with repaint: scrollController,
// and y = pitch - 1 - offset % pitch, so they scroll with the text.
```

## 10. Canvas objects made accessible
For every painted object, add a `Positioned.fromRect(rect: boundsOf(o), child: Semantics(button: true, label: ..., onTap: ..., customSemanticsActions: {...}, child: SizedBox.expand()))` in an overlay Stack. It doesn't block hit testing. Rebuild it when the scene settles.

## 11. Creative patterns that worked in Softbound (concept ideas to offer)
- **Concept world per app:** a shelf of books under a studio light; time of day (golden / night) is a light state.
- **Living covers:** covers with subtle motion (foil glint following tilt, parallax art) that sleeps when idle.
- **Clay bin:** delete = throw the item in; it squashes, is gulped, then fired in a kiln (physics + a ritual, undo = fish it out).
- **Pull-cord globe:** theme/time-of-day switch as a pull cord on a lamp globe; the light model blends live.
- **List modes with a view picker:** the same data as a spine shelf, a stack, a catalogue and scannable rows, switched by a picker that queues the latest tap. Always offer a plain scannable mode for scale.
- Perf rules for all of these: references/flutter-device-performance.md; port recipe: references/web-to-flutter-port.md.
- Full catalogue with files, templates, device numbers and pitfalls: section 12 below. Drop-in code: `templates/flutter/`.

## 12. Softbound v3 pattern catalogue (Flutter, Android, 2026-11)
Softbound (`softbound/`, read-only reference) is a notes app built as a 2.5D studio: a clay turntable of books under a window light, with four list views. Each entry below gives what it is, the feel to keep, which files to read, which template to start from (`templates/flutter/lib/kit/…`), the cost measured on the device, and the pitfalls hit.
**Device numbers** come from the PERF_LOG sessions on an I2202 (Android 14, arm64, 120Hz, Impeller) on 2026-11-07. Three were measured: catalogue scroll raster p50 **1.6ms** (it was 28–40ms), shelf spin raster p50 **~5ms** at morning, golden and night with 0 jank, and idle **30fps, all from the living cover Timer** (nothing else ticks). "n/m" means the area was never measured on its own: assume it falls inside those numbers, and measure it if you change it.
Shared foundation everywhere: one `World` with a sleeping ticker (`world_clock.dart`), one camera (`cam25d.dart`), books always drawn through one `BookView` (`baked_face.dart`), and no Material widgets.

### 12.1 2.5D shelf turntable with baked faces
- **What:** 5+ hardcover books stand on a clay turntable. Flick-spin with momentum, magnetic detents (a tick and a selection haptic on each one), centrifugal and trailing lean on springs, Verlet ribbon bookmarks, a first-launch drop-in with squash and dust puffs, drag down on the front book to press it into the clay (release → delete), and a helix overview.
- **Feel:** heavy, oiled bearings. A hard flick coasts past several books; a soft one clicks into the next.
- **Read:** `lib/shelf/shelf_layer.dart`, `physics.dart` (Spr, Spin, Item.place, Rope), `shadow_mesh.dart`, `lib/book/book_view.dart` + `book_art.dart`, `lib/world/shelf_math.dart`.
- **Start from:** `spin_physics.dart`, `baked_face.dart`, `vertex_tint.dart`, `shadow_mesh.dart`, `cam25d.dart`, `world_clock.dart`.
- **Device:** spin raster p50 ~5ms at all three times of day, 0 jank.
- **Pitfalls:** night spins janked at about 10 dropped frames/s. The cause was a blurred text-shadow halo on the HOME info, which cross-fades on every front-book change (fix: a crisp shadow). A per-face ColorFilter only at night doubled the GPU cost (fix: vertex modulate). Books looked like they floated until each got three shadows (cast, ambient pool, contact). Restored books jumped slots (animate into the slot). Overview proxies showed bars instead of titles. The ribbon jittered at rest (sleep after 15 calm frames).

### 12.2 Living covers
- **What:** only the front book's cover art lives: petals, steam, a cat breathing, birds with city windows, rain, fireflies, a lantern. Each is a pure function of `t`, painted inside the label recess.
- **Feel:** you notice it on the second look. It is never busy.
- **Read:** `lib/shelf/alive.dart` (AlivePainter, BleedPainter), plus the `_wakeAlive`/`_onAlive` code in `shelf_layer.dart`.
- **Start from:** `low_rate_effect.dart`.
- **Device:** idle = 30fps from this effect only. It sleeps 45s after the last input.
- **Pitfalls:** its 30Hz repaint leaked into the shadow layer until the book got its own `RepaintBoundary`. A Ticker would run at 120Hz, so use a Timer. Use `BlendMode.plus` for highlights, not `screen`. Stop it in overview, during a bleed, when the book is hidden, and under reduced motion. Create the controller lazily so `dispose` never creates one.

### 12.3 Studio light: gobo, bakes, warp, homography
- **What:** a sunlit studio cyc with window-gobo shadow bars across the wall, the plinth and every face. A light shaft with dust lit only inside the beam. Clay with wrap light, a rim, ripples and dents. Three times of day.
- **Feel:** a real room with one window. The shadows of the mullions slide over the books as they turn.
- **Read:** `lib/studio/studio_layer.dart` (bakes, `Warp`, `_drawLive`, `_retire`, `_prewarm`), `studio_light.dart` (blend, cookie, uniform packing), `shaders/shelf_bg.frag`, `shelf_plinth.frag`. The gobo is laid on faces in `book_view.dart` `_gobo` and `cat_paint.dart` `_gobo`.
- **Start from:** `image_lifetime.dart` (BakeSlot, ImageRetirer), `live_relight.dart`, `cam25d.dart` `planeHomography`, `vertex_tint.dart` (`drawFan` + `clipConvex` for the gobo bands).
- **Device:** n/m on its own. It sits inside the shelf's ~5ms and the catalogue's 1.6ms.
- **Pitfalls:** a live full-screen ray-cast shader during camera moves was a perf risk. At rest, draw one bake (room + clay per time of day and camera, overscanned 15%). While the camera moves, re-project that bake: the room by a fitted scale and offset, the clay top by its exact plane homography so the books stay planted. Only an uncovered or badly-off warp asks for a ¼-res bake, async and rate-limited. `toImageSync` stalled frames, so use `Picture.toImage`. A disposed image flickered (the plinth blinked out), so retire after 250ms. Prewarm all three times of day ~1.5s after launch. Gobo bands on a flat face are straight lines, so each band is one linear gradient (book) or one clipped fan with modulate (catalogue): no per-pixel CPU work. Look problems seen on device: a pale morning, a lost clay colour, an orange night floor. Compare against the web at phone size for each time of day.

### 12.4 Clay bin: throw, gulp, kiln
- **What:** delete throws a clay pot up out of the plinth (it anticipates during the press). The book crouches, leaps, somersaults in with its cover lights going out, and the pot gulps (a bulge runs down it) and burps dust. A small resting pot keeps spines peeking out with a count. The bin view fans books like a hand of cards. "Bring back" spits a book home. Hold-to-empty fires the pot like a kiln (embers, ash, truly red-hot). A toast offers View + Undo on a 5s ring that pauses on touch.
- **Feel:** a ritual with weight. Deletion is a little funny, and undo is generous.
- **Read:** `lib/bin/bin_ctl.dart` (the choreography: `tween`/`later` timelines, particles), `bin_pot.dart` (lathe profile revolved into a `drawVertices` mesh over a shader-baked clay texture, plus an additive kiln pass), `bin_layer.dart`, `shaders/bin_clay.frag`, `bin_kiln.frag`.
- **Start from:** `spin_physics.dart` `Spr`, `world_clock.dart`, `vertex_tint.dart`, `shadow_mesh.dart` (the pot's shadow goes into the same mesh as the books').
- **Device:** n/m.
- **Pitfalls:** a shared controller (BinLayer + BinOverlay) needs an idempotent `dispose`. Bake the clay and kiln textures once from shaders and light the mesh per vertex: no live shader per frame. The flames as drawn shapes were the weakest art, and the hand of cards first fanned only one way. Under reduced motion, no flight: crossfade. HOME tucks its dock away while the toast is up (`world.toastUp`).

### 12.5 Pull-cord globe (time-of-day switch)
- **What:** a brass rosette, a ball chain of lit beads and a glass globe showing the NEXT sky. Pull it against resistance; a detent clicks with a haptic; release past it cycles the time of day with a flare, recoil clinks and a swing. It sways when the shelf spins, a tap tugs it, and there is a one-time invitation swing.
- **Feel:** a real lamp pull: resistance, then a click you feel.
- **Read:** `lib/cord/cord_sim.dart` (Verlet `_sub`, `_rub` resistance, detent, auto-tug, wind), `cord_paint.dart` (bead sprites per time of day), `cord_layer.dart` (global pointer route, breath).
- **Start from:** `verlet_chain.dart` (`VerletChain`, `pullFeed`), `low_rate_effect.dart` / `AnimationController.repeat(count:)` for the glow breath.
- **Device:** n/m. It costs almost nothing at rest because it unsubscribes once settled.
- **Pitfalls:** the night glow breathed forever, so it now gets 8 cycles after a touch and none while faded out. Fade the cord away in non-shelf views, since it doesn't belong there. A pending invitation kept the world ticker alive at test teardown, so it is skipped under `FLUTTER_TEST`. A shelf flick elsewhere must not start a repaint loop. Bead gradients are cached sprites, never per-frame. Under reduced motion it snaps to rest and still cycles.

### 12.6 Open book: page curl and wet ink
- **What:** tap a book and it dips 3px, lifts in an arc while turning to face you, and the cover hinges open with ~4° overshoot. The leaves riffle as curling meshes and the camera dollies onto the page. The page is a real editable surface (title + body). Ink lands wet and dries word by word, with a scratch sound per word. A glint crosses the page. The top bar has back, a tag pill (opens a picker that recolours the cloth live) and delete. Close: the page settles, the cover claps shut (clap, puff, haptic) and the book glides home.
- **Feel:** opening a real notebook. The editor is the paper, not a sheet laid over it.
- **Read:** `lib/open/open_layer.dart`, `ink.dart` (wet-ink `TextEditingController`), `glyphs.dart`, `lib/book/book_view.dart` (`_leaf` curl mesh, `live` face between faces), `shaders/open_curl.frag`, `open_page.frag`. Regression: `test/caret_test.dart`.
- **Start from:** `baked_face.dart` (`BakedFace.live`), `cam25d.dart` (`plane`, `lerpTo` for the dolly), Atelier pattern 8 (wet ink).
- **Device:** n/m.
- **Pitfalls:** the caret always jumped to 0 because the projective Transform broke `globalToLocal` (fix: `Cam.plane` flattens z). The camera settle kept ticking 4–5s after opening (snap when it is close enough). A label BoxShadow dulled the covers by ~33%. The leaves riffled as flat slabs until they became bent meshes lit per vertex. The tag picker needs an edge fade. Keep the editor in one stable widget structure (GlobalKeys inside must never reparent when the shade fades). Clean, warm paper, never grey.

### 12.7 Stack view (spine pile)
- **What:** the books turn, lift off, topple onto their backs and pile up spines-out while the camera dollies in. The pile is a hydraulic lift: scrolling raises it out of the clay or lowers it back in, it coasts with friction and rubber-bands at the ends, and spines tip with scroll speed. Tap slides a book out and opens it. Swipe left sends it to the bin.
- **Feel:** a physical archive. Each spine lands with a clack.
- **Read:** `lib/stack/stack_layer.dart`, `stack_geo.dart` (PileCam, flights, mirrors of OPEN's read pose), `stack_art.dart`.
- **Start from:** `spin_physics.dart` (`coast`, `rubberBand`, `Spr`), `world_clock.dart` (`ViewSwitcher` hook), `inactive_view.dart`.
- **Device:** n/m.
- **Pitfalls:** chain the world hooks (`poseOf`, `search`, `createNote`, …) only while the view shows, and give them back on exit. Hand the camera override to OPEN/BIN while they own it. Hide the shelf books via `world.hidden`. Spine art tints are baked (a saveLayer + ColorFilter is fine inside a one-time bake, never per frame).

### 12.8 Card catalogue (drawVertices cards)
- **What:** a clay card drawer is thrown up out of the plinth. Each book spins edge-on, flattens into its index card and drops onto the brass rod. Flick through: the cards ahead fan back so their title strips read like a list, and the card you pass falls toward you. Momentum, a detent per card, a shiver through neighbours. Tap a card to open it as its book. Swipe sideways to bin it.
- **Feel:** a library card drawer: tactile, fast, satisfying ticks.
- **Read:** `lib/catalogue/catalogue_layer.dart`, `cat_paint.dart` (`_Faces`: fans, per-vertex light, fog, occlusion, gobo; `_keep` overdraw cull), `cat_art.dart` (cards baked per note × time of day, LRU of 48, shared backs and proxies, gain baked in), `cat_math.dart`. Tests: `catalogue_scroll_perf_test.dart`, `catalogue_flick_leak_test.dart`, `touch_after_catalogue_test.dart`, `catalogue_close_test.dart`.
- **Start from:** `vertex_tint.dart` (`drawFan`, `clipConvex`, `imageShaderOf`), `image_lifetime.dart` (budgeted bakes), `test/gpu_cost_canvas.dart`.
- **Device:** scroll raster p50 **1.6ms**, down from 28–40ms.
- **Pitfalls:** the 28–40ms came from multiply blends, a colour filter per card and clips. Now every card is 1–2 modulate fans, with no layers, filters, advanced blends or clip stencils. The hidden part of a card behind its neighbour isn't drawn (exact interval cull). Far cards use shared proxies. Bakes are capped at ≤2 per frame and none while scrolling (tested). Every flick leaked tickers (15→31→…, the app froze), so the leak test runs after flicks. A leftover full-screen Listener swallowed all touches after leaving, so use `IgnorePointer`. After open→close, the book must file back as a card and stay silent (`Sfx.requested` stays flat).

### 12.9 List rows (the scannable mode)
- **What:** a sheet of handmade paper slides up. Every book flies off the turntable and lands in its row as that row's thumbnail (the same BookView, shrinking onto a pose that projects exactly onto the thumbnail rect). Each row has a title, a 2-line excerpt, a tag pill, and date · words. Swipe left bins, swipe right pins (a ribbon drops), long-press peeks, tap opens. Search highlights live and filtered rows fold away.
- **Feel:** the premium world kept, now usable at 200 notes.
- **Read:** `lib/list/list_layer.dart` (flights, the crossfade from lit 3D book into flat thumbnail), `list_row.dart`, `list_art.dart`, `list_data.dart`.
- **Start from:** `cam25d.dart` (a pose that projects onto a rect), `inactive_view.dart`, `world_clock.dart`.
- **Device:** n/m.
- **Pitfalls:** use a `RepaintBoundary` per row, and rebuild a row only when its note, the query or the hour changes. Asking a just-deactivated element for its render object throws during paint (null-check that path). Crossfade the last stretch of a flight into the thumbnail, or the shading pops. Always offer a plain scannable mode next to the showpiece views.

### 12.10 View picker morph
- **What:** the header's view button unfolds into a pill panel of four stroke icons (turntable, spine pile, card drawer, rows). Picking one runs the current view's exit, then the next view's enter.
- **Feel:** quick and certain. A tap made mid-transition is honoured.
- **Read:** `lib/home/view_picker.dart`, `world.dart` `showView` / `viewHooks`. Tests: `test/leak_picker_test.dart`, `leak_rapid_test.dart`, `render/picker_render_test.dart`.
- **Start from:** `world_clock.dart` `ViewSwitcher`, `inactive_view.dart`.
- **Device:** n/m.
- **Pitfalls:** taps mid-switch were dropped (now queued, latest wins). Icon painters repaint only when the colour changes, and the panel animates as one cached layer. The picker render test hung because it awaited `showView` before pumping frames. Leak-test rapid switching through real taps, not only API calls.

### 12.11 Home: dock, chips, search
- **What:** a status-bar-safe header ("N notebooks", "Your shelf", a search that expands into a field). Front-note info: tag pill with an icon, date · words, title, 2-line excerpt, AA at all three times of day. Tag chips with glyphs (tap → spin to that tag; edge fade, never clipped). Dock: overview · + · time of day. A first-launch ghost-finger demo (spin, open, close; once, skippable, skipped under reduced motion).
- **Feel:** quiet chrome over a loud world.
- **Read:** `lib/home/home_layer.dart`, `home_icons.dart`, `svg_path.dart` (SVG path data → Path).
- **Start from:** `inactive_view.dart` (hidden chrome is excluded from semantics), `perf_log.dart`.
- **Device:** this layer caused the night jank (raster p90 ~25ms) until its cross-fading text lost its blur.
- **Pitfalls:** never put a blurred `Shadow` on text that animates: Impeller re-blurs every glyph every frame. Keep the soft halo only on static text. The chip edge fade is a small `ShaderMask` (fine on a static strip, never full-screen). Android back closes the search (`PopScope`). The dock tucks away under the undo toast. Hidden chrome is excluded from semantics while a note or the bin is up.

### 12.12 Day/night cycle
- **What:** the time of day (morning / golden / night) comes from the clock at launch and cycles with the cord. Everything relights in ~1.2s: the studio light model blends, shadows swing (`todToLight`/`todShadow`), books shade per face, the night lamp warms. Covers and cards are baked per time of day (18 cover images = 6 tags × 3 times).
- **Feel:** the sun moves. It is not a dissolve.
- **Read:** `lib/studio/studio_light.dart` (`StudioLight.blend`), `lib/theme/tokens.dart` (`TodLight`), `world.dart` (`setTod`, `todT`), `shelf/shadow_mesh.dart` helpers.
- **Start from:** `live_relight.dart`, `image_lifetime.dart` (prewarm + end-state bake), `shadow_mesh.dart`.
- **Device:** spin is equal across the three times of day (~5ms) once the night-only filter and blur were gone. Diagnose with `--dart-define=FORCE_TOD=night`.
- **Pitfalls:** night-only costs hide in conditional filters (`if night → ColorFilter`). Blend intensity in stops. Pre-render each time of day's end state off-thread before the sweep ends. Check AA contrast of all text at each time of day.
