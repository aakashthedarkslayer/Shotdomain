// RENDER TEST HELPER: render the real app to PNGs inside `flutter test` (no device, no emulator): stills, motion contact
// sheets, drags. Bundled fonts load for real; time is fake (frames advance with tester.pump), so motion is deterministic.
// WHEN: every UI change. Read the PNGs yourself, send them (with mid-animation strips) to ui-critic, iterate. Also the
//   base of regression tests (leak test, tap-position tests, GPU-cost counts via gpu_cost_canvas.dart).
//   final r = await Render.boot(tester, const MyScreen(), fonts: {'Fraunces': ['assets/fonts/Fraunces.ttf']});
//   await r.shot('home');                                      // test/render/out/home.png
//   await r.strip('spin', 2.0, () async => r.drag(a, b));      // contact sheet, 1 frame / 100ms, 6 per row
// LESSONS (Softbound):
//  - Pass the screen widget, not WidgetsApp/MaterialApp (they install their own MediaQuery from the view).
//  - Captures need real async: t.runAsync(() => boundary.toImage(...)). Fonts: FontLoader inside t.runAsync.
//  - Never `await` an app call that animates on the frame clock before pumping (the test hangs): fire it, then r.run().
//  - flutter_test draws BoxShadow as a hard box (debugDisableShadows): judge soft scrims on the device.
//  - Tests see CPU only. Follow with the on-device PERF_LOG session.
//  - Run only your own render tests while iterating (a full suite of these can take ~13 min).
import 'dart:io';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

class Render {
  Render._(this.t, this.dpr, this.outDir);
  final WidgetTester t;
  final double dpr;
  final String outDir;
  static final _key = GlobalKey();
  static final _loaded = <String>{};

  static Future<Render> boot(WidgetTester t, Widget screen,
      {Size size = const Size(412, 915), double dpr = 2, bool reducedMotion = false, Map<String, List<String>> fonts = const {},
      Future<void> Function()? preload, String outDir = 'test/render/out', double warmupSeconds = .25}) async {
    await t.runAsync(() async {
      for (final MapEntry(key: family, value: files) in fonts.entries) {
        if (!_loaded.add(family)) continue;
        final l = FontLoader(family);
        for (final f in files) {
          l.addFont(rootBundle.load(f));
        }
        await l.load();
      }
      await preload?.call(); // images, shaders, your art loader
    });
    t.view.physicalSize = size * dpr;
    t.view.devicePixelRatio = dpr;
    addTearDown(t.view.reset);
    await t.pumpWidget(MediaQuery(
      data: MediaQueryData(size: size, devicePixelRatio: dpr, disableAnimations: reducedMotion),
      child: Directionality(textDirection: TextDirection.ltr, child: RepaintBoundary(key: _key, child: screen)),
    ));
    await t.runAsync(() => Future<void>.delayed(Duration(microseconds: (warmupSeconds * 1e6).round()))); // async image/shader loads
    await t.pump(const Duration(milliseconds: 16)); // lint-ok: one frame
    return Render._(t, dpr, outDir);
  }

  Future<ui.Image> _grab([double scale = 1]) async {
    final b = _key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
    return (await t.runAsync(() => b.toImage(pixelRatio: dpr * scale)))!;
  }

  Future<void> _write(ui.Image img, String name) async {
    final bytes = await img.toByteData(format: ui.ImageByteFormat.png);
    File('$outDir/$name.png')
      ..createSync(recursive: true)
      ..writeAsBytesSync(bytes!.buffer.asUint8List());
  }

  /// One still of the whole screen.
  Future<void> shot(String name) async {
    final i = await _grab();
    await t.runAsync(() => _write(i, name));
  }

  /// Advance fake time by [seconds] in 16ms frames.
  Future<void> run(double seconds) async {
    for (var k = 0; k < (seconds * 60).round(); k++) {
      await t.pump(const Duration(milliseconds: 16)); // lint-ok: one frame
    }
  }

  /// A contact sheet of [seconds] of motion: one frame every 100ms, 6 per row, each at [frameScale] of full size.
  Future<void> strip(String name, double seconds, [Future<void> Function()? start, double frameScale = .3]) async {
    if (start != null) await start();
    final frames = <ui.Image>[];
    for (var k = 0; k <= (seconds * 10).round(); k++) {
      frames.add(await _grab(frameScale));
      for (var j = 0; j < 6; j++) {
        await t.pump(const Duration(microseconds: 16667));
      }
    }
    final fw = frames.first.width.toDouble(), fh = frames.first.height.toDouble(), rows = (frames.length / 6).ceil(), pad = 4.0;
    final rec = ui.PictureRecorder(), c = Canvas(rec);
    c.drawRect(Rect.fromLTWH(0, 0, 6 * (fw + pad), rows * (fh + pad)), Paint()..color = const Color(0xFFFFFFFF)); // lint-ok: sheet background
    for (var k = 0; k < frames.length; k++) {
      c.drawImage(frames[k], Offset((k % 6) * (fw + pad), (k ~/ 6) * (fh + pad)), Paint());
    }
    final sheet = await t.runAsync(() => rec.endRecording().toImage((6 * (fw + pad)).round(), (rows * (fh + pad)).round()));
    await t.runAsync(() => _write(sheet!, '$name-sheet'));
  }

  /// A finger drag in logical px over [seconds], one move per frame.
  Future<void> drag(Offset from, Offset to, {double seconds = .3}) async {
    final g = await t.startGesture(from);
    final n = math.max(1, (seconds * 60).round());
    for (var k = 1; k <= n; k++) {
      await g.moveTo(Offset.lerp(from, to, k / n)!);
      await t.pump(const Duration(milliseconds: 16)); // lint-ok: one frame
    }
    await g.up();
  }
}
