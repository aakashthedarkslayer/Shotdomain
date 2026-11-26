// LOW-RATE EFFECT: an ambient animation (living cover: petals, steam, a cat breathing, fireflies; dust; a glow) that
// repaints at ~30Hz from a Timer, only its own RepaintBoundary, only while it should run, then stops.
// WHEN: anything that animates while the user does nothing. Idle must cost (almost) nothing.
// DEVICE LESSONS (Softbound, 120Hz phone):
//  - A Ticker runs at the display rate (120Hz) and keeps the frame loop alive; a Timer at 30Hz bumping a ValueNotifier
//    repaints only the painter that listens to it. Measured idle in Softbound: 30fps from the living cover, nothing else.
//  - Put the painter in a RepaintBoundary: without one the cover's 30Hz repaint leaked into the shadows layer.
//  - Stop when hidden (another view, a modal, overview), under reduced motion, and after an idle window
//    (living cover sleeps 45s after the last touch; wake() it again from the next touch).
//  - Finite repeats: an AnimationController glow uses `repeat(reverse: true, count: 8)` after a touch, never forever,
//    and stop() it when its layer fades out.
//  - flutter_test fails on pending timers: make sure shouldRun() goes false (or call stop()) before the test ends.
// Usage:
//   late final fx = LowRateEffect(shouldRun: () => visible && !reducedMotion && DateTime.now().difference(lastInput) < idleSleep);
//   RepaintBoundary(child: CustomPaint(painter: AlivePainter(time: () => fx.t, repaint: fx.frame)))
//   onPointerDown / view shown: fx.wake();   dispose: fx.dispose();
import 'dart:async';

import 'package:flutter/foundation.dart';

class LowRateEffect {
  LowRateEffect({required this.shouldRun, this.hz = 30, this.maxSeconds});
  /// Checked every tick: false stops the effect (hidden, idle too long, reduced motion).
  final bool Function() shouldRun;
  final double hz;
  /// Optional hard cap per wake (finite repeats).
  final double? maxSeconds;
  final ValueNotifier<int> frame = ValueNotifier(0);
  /// The effect's own clock (seconds); advances only while running, so it resumes without a jump.
  double t = 0;
  Timer? _timer;
  int _lastTick = 0;
  double _ran = 0;

  bool get running => _timer?.isActive ?? false;

  void wake() {
    if (running || !shouldRun()) return;
    _ran = 0;
    _lastTick = 0;
    _timer = Timer.periodic(Duration(microseconds: (1e6 / hz).round()), _tick);
    frame.value++;
  }

  // Timer.tick counts elapsed periods (missed ones included): real time on device, deterministic under fake time in tests.
  void _tick(Timer timer) {
    final cap = maxSeconds;
    if (!shouldRun() || (cap != null && _ran >= cap)) {
      stop();
      return;
    }
    final dt = (timer.tick - _lastTick) / hz;
    _lastTick = timer.tick;
    t += dt;
    _ran += dt;
    frame.value++;
  }

  /// Stop and repaint once in the rest pose.
  void stop() {
    _timer?.cancel();
    _timer = null;
    frame.value++;
  }

  void dispose() {
    _timer?.cancel();
    frame.dispose();
  }
}
