// KIT EXAMPLE: a tiny 2.5D scene built only from the kit templates (Cam25D, BakedSolid, ShadowMesh, DetentSpin,
// WorldClock + ViewSwitcher, InactiveView, LowRateEffect, image bakes), plus the three regression checks every app
// with custom rendering should keep:
//  1. LEAK: switch views back and forth, settle → transientCallbackCount back to ~0 and the clock asleep
//     (on the Softbound phone, 240+ leaked frame callbacks froze the app).
//  2. GPU COST: one frame of the scene painter has no advanced blends / colour filters / saveLayers / blurs.
//  3. RENDER: PNG stills + a motion strip in test/render/out/ that you actually look at.
// Copy, then replace the demo scene with your app's screen. `your_app` = your package name.
import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vector_math/vector_math_64.dart' show Matrix4, Vector3;
import 'package:your_app/kit/baked_face.dart';
import 'package:your_app/kit/cam25d.dart';
import 'package:your_app/kit/image_lifetime.dart';
import 'package:your_app/kit/inactive_view.dart';
import 'package:your_app/kit/low_rate_effect.dart';
import 'package:your_app/kit/shadow_mesh.dart';
import 'package:your_app/kit/spin_physics.dart';
import 'package:your_app/kit/vertex_tint.dart';
import 'package:your_app/kit/world_clock.dart';

import 'gpu_cost_canvas.dart';
import 'render_test_helper.dart';

enum V { ring, panel }

const _bg = Color(0xFFE9DCC6), _ink = Color(0xFF2A2233), _shade = Color(0xFF1E1830);
const _cloth = [Color(0xFF8C3B2E), Color(0xFF2F5D62), Color(0xFFB98A2E), Color(0xFF4B3B6B), Color(0xFF6F7D3A)];
const _bw = .7, _bh = 1.0, _bd = .2, _n = 5;
final _toLight = Vector3(-.6, 1, .5);

class Demo extends StatefulWidget {
  const Demo({super.key});
  @override
  State<Demo> createState() => DemoState();
}

class DemoState extends State<Demo> with SingleTickerProviderStateMixin {
  final clock = WorldClock();
  final views = ViewSwitcher<V>(V.ring);
  late final spin = DetentSpin(onDetent: (_) => ticks++);
  late final glow = LowRateEffect(shouldRun: () => views.view == V.ring && !_rm, maxSeconds: 1.5);
  final covers = <ui.Image>[];
  int ticks = 0;
  double panel = 0; // 0…1 panel slide
  VoidCallback? _unsub;
  bool get _rm => MediaQuery.of(context).disableAnimations;

  @override
  void initState() {
    super.initState();
    clock.attach(this);
    for (var i = 0; i < _n; i++) {
      covers.add(bakeSync(const Size(140, 200), 1, (c) {
        c.drawRect(const Rect.fromLTWH(0, 0, 140, 200), Paint()..color = _cloth[i]);
        c.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(22, 40, 96, 60), const Radius.circular(8)), Paint()..color = _bg);
        c.drawRect(Rect.fromLTWH(34, 62, 72.0 - i * 8, 6), Paint()..color = _ink);
      }));
    }
    views.hooks[V.panel] = (on) async {
      final done = Completer<void>();
      final from = panel, to = on ? 1.0 : 0.0;
      var t = 0.0;
      late final VoidCallback un;
      un = clock.onTick((dt) {
        t = math.min(1, t + dt / .35);
        setState(() => panel = from + (to - from) * Curves.easeOutCubic.transform(t));
        if (t >= 1) { un(); done.complete(); }
      });
      await done.future;
    };
    views.addListener(() { if (views.view == V.ring) glow.wake(); });
    WidgetsBinding.instance.addPostFrameCallback((_) => glow.wake());
  }

  void fling(double v) {
    spin.release(v);
    _unsub ??= clock.onTick((dt) {
      final moving = spin.step(dt);
      setState(() {}); // the books' poses changed
      if (!moving) { _unsub?.call(); _unsub = null; }
    });
  }

  @override
  void dispose() {
    _unsub?.call();
    glow.dispose();
    clock.detach();
    clock.dispose();
    views.dispose();
    for (final c in covers) { c.dispose(); }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (context, box) {
        final cam = Cam25D(size: box.biggest, eye: Vector3(0, 1.9, 5.2), target: Vector3(0, .45, 0), fovY: 34, authored: const Size(390, 844));
        return Stack(children: [
          Positioned.fill(child: ColoredBox(color: _bg, child: CustomPaint(painter: ScenePainter(cam, _models(), clock.frame)))),
          for (final (i, m) in _byDepth(cam))
            BakedSolid(cam: cam, light: FaceLight(toLight: _toLight, shade: _shade), semanticLabel: 'Book ${i + 1}', faces: _faces(m, i)),
          Positioned(right: 24, top: 64, width: 24, height: 24,
              child: RepaintBoundary(child: CustomPaint(painter: _Glow(glow)))),
          InactiveView(active: views.view == V.panel,
              child: Align(alignment: Alignment.bottomCenter,
                  child: FractionalTranslation(translation: Offset(0, 1 - panel),
                      child: Container(height: 220, color: _ink.withValues(alpha: .92))))),
        ]);
      });

  List<Matrix4> _models() => [
        for (var i = 0; i < _n; i++)
          () {
            final th = (i - spin.pos) * 2 * math.pi / _n;
            return Matrix4.translationValues(math.sin(th) * 1.5, 0, math.cos(th) * 1.1)
              ..rotateY(th * .5)
              ..translateByDouble(-_bw / 2, 0, 0, 1);
          }()
      ];

  List<(int, Matrix4)> _byDepth(Cam25D cam) {
    final l = [for (final (i, m) in _models().indexed) (i, m)];
    l.sort((a, b) => cam.depth(b.$2.transform3(Vector3(_bw / 2, _bh / 2, 0))).compareTo(cam.depth(a.$2.transform3(Vector3(_bw / 2, _bh / 2, 0)))));
    return l;
  }

  List<BakedFace> _faces(Matrix4 m, int i) {
    Matrix4 at(Matrix4 local) => m.multiplied(local);
    final edge = Color.lerp(_cloth[i], _shade, .25)!;
    return [
      BakedFace(model: at(Matrix4.translationValues(0, 0, _bd / 2)), w: _bw, h: _bh, image: covers[i]),
      BakedFace(model: at(Matrix4.translationValues(_bw, 0, -_bd / 2)..rotateY(math.pi)), w: _bw, h: _bh, color: edge),
      BakedFace(model: at(Matrix4.translationValues(_bw, 0, _bd / 2)..rotateY(math.pi / 2)), w: _bd, h: _bh, color: const Color(0xFFF3EBDD)),
      BakedFace(model: at(Matrix4.translationValues(0, 0, -_bd / 2)..rotateY(-math.pi / 2)), w: _bd, h: _bh, color: edge),
      BakedFace(model: at(Matrix4.translationValues(0, _bh, _bd / 2)..rotateX(-math.pi / 2)), w: _bw, h: _bd, color: const Color(0xFFF3EBDD)),
    ];
  }
}

class ScenePainter extends CustomPainter {
  ScenePainter(this.cam, this.models, Listenable repaint) : super(repaint: repaint);
  final Cam25D cam;
  final List<Matrix4> models;
  @override
  void paint(Canvas c, Size size) {
    final mesh = ShadowMesh(cam, const Color(0xFF9C8466));
    for (final m in models) { mesh.box(m, _bw, _bh, _bd, _toLight.normalized(), cast: .55, contact: .8); }
    mesh.draw(c);
    // a gobo bar across the floor: a modulate band laid by a fan (no clip, no multiply)
    final band = [cam.project(Vector3(-3, 0, .2)), cam.project(Vector3(3, 0, .2)), cam.project(Vector3(3, 0, -.1)), cam.project(Vector3(-3, 0, -.1))];
    drawFan(c, clipConvex(band, (q) => q.dy - size.height * .3), Paint()..color = const Color(0xFFE2D2B6)..blendMode = BlendMode.modulate);
  }
  @override
  bool shouldRepaint(ScenePainter old) => true;
}

class _Glow extends CustomPainter {
  _Glow(this.fx) : super(repaint: fx.frame);
  final LowRateEffect fx;
  @override
  void paint(Canvas c, Size s) => c.drawCircle(s.center(Offset.zero), 6 + 3 * math.sin(fx.t * 4), Paint()..color = const Color(0xFFFFC36B)..blendMode = BlendMode.plus);
  @override
  bool shouldRepaint(_Glow old) => false;
}

void main() {
  testWidgets('kit scene: render, leak and GPU-cost checks', (t) async {
    final r = await Render.boot(t, const Demo());
    final st = t.state<DemoState>(find.byType(Demo));
    await r.shot('kit_rest');
    await r.strip('kit_spin', 1.5, () async => st.fling(9));
    await r.run(3);
    expect(st.ticks, greaterThan(0), reason: 'detents fired while the ring coasted');
    expect(st.spin.mode, SpinMode.rest);

    final cc = CountCanvas();
    debugOnFan = cc.area;
    final cp = t.widgetList<CustomPaint>(find.byType(CustomPaint)).firstWhere((p) => p.painter is ScenePainter);
    cp.painter!.paint(cc, const Size(412, 915));
    debugOnFan = null;
    expect(cc.counts['advancedBlend'] ?? 0, 0, reason: '${cc.counts}');
    expect(cc.counts['colorFilter'] ?? 0, 0);
    expect(cc.counts['saveLayer'] ?? 0, 0);

    int live() => SchedulerBinding.instance.transientCallbackCount;
    for (var k = 0; k < 3; k++) {
      st.views.show(V.panel); // not awaited: hooks animate on the clock
      st.views.show(V.ring); // queued mid-switch (latest wins)
      await r.run(2);
    }
    st.views.show(V.panel);
    await r.run(1);
    await r.shot('kit_panel');
    st.views.show(V.ring);
    await r.run(3);
    expect(st.views.view, V.ring);
    expect(st.clock.awake, isFalse, reason: st.clock.debugTicks);
    expect(st.glow.running, isFalse, reason: 'finite low-rate effect');
    expect(live(), lessThanOrEqualTo(1));
  });

  test('image retirer disposes once, later', () async {
    final img = bakeSync(const Size(4, 4), 1, (c) {});
    final b = Bake(img), r = ImageRetirer(delay: Duration.zero);
    r.retire(b);
    expect(b.disposed, isFalse);
    await Future<void>.delayed(const Duration(milliseconds: 5));
    expect(b.disposed, isTrue);
    b.dispose(); // idempotent
    expect(rubberBand(-10, 0, 100), -3.5);
    expect(wrapSlots(4.6, 5), closeTo(-.4, 1e-9));
  });
}
