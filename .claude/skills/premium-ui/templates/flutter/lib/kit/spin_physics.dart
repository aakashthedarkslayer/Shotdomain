// SPIN PHYSICS: weighty, pure-Dart motion primitives (no widgets, cheap to unit-test), ported from the Softbound web
// prototype so the Flutter feel matches it 1:1.
//  - Spr: a spring with stiffness k and damping ratio z (semi-implicit Euler; z<1 overshoots like stiff paper).
//  - DetentSpin: a turntable/carousel in slots: flick momentum, friction, and a magnetic detent potential that only
//    captures it as it slows (so a hard flick coasts past several items, a soft one clicks into the next).
//    onDetent fires each time the nearest slot changes → tick sound + selection haptic.
//  - coast / rubberBand: a scroll that glides with exponential friction and stretches past its ends.
// WHEN: carousels, turntables, card drawers, piles, anything you flick. Drive step(dt) from WorldClock.onTick and
//   unsubscribe when it returns false.
// Flick velocity from a drag (slots/s), smoothed: v = lerp(v, -dx / pxPerSlot / dt, .45) on every move event.
// DEVICE NOTE: physics is CPU-trivial; the cost of a spin is what it repaints (5+ baked books: raster p50 ~5ms on I2202).
import 'dart:math' as math;

double _ss(double a, double b, double x) {
  final t = ((x - a) / (b - a)).clamp(0.0, 1.0);
  return t * t * (3 - 2 * t);
}

/// Shortest signed slot distance on a ring of [n] slots.
double wrapSlots(double s, int n) => n == 0 ? 0 : (s + n / 2) % n - n / 2;

class Spr {
  Spr(this.x, this.k, this.z) : t = x;
  double x, v = 0, t;
  final double k, z;
  /// Returns true while moving; snaps to the target when settled.
  bool step(double dt) {
    final c = 2 * math.sqrt(k) * z;
    v += (k * (t - x) - c * v) * dt;
    x += v * dt;
    if ((t - x).abs() < 1e-4 && v.abs() < 1e-3) {
      x = t;
      v = 0;
      return false;
    }
    return true;
  }
}

enum SpinMode { rest, drag, free, target }

class DetentSpin {
  DetentSpin({this.detent = 150, this.captureFrom = 4.5, this.captureAt = 1.2, this.friction = 1.7, this.captureFriction = 10, this.targetK = 70, this.onDetent});
  /// Detent potential strength; captured below [captureAt] slots/s, free above [captureFrom].
  final double detent, captureFrom, captureAt;
  /// Friction (1/s) when free, plus [captureFriction] as the detent takes over.
  final double friction, captureFriction, targetK;
  final void Function(int slot)? onDetent;
  double pos = 0, vel = 0, target = 0;
  SpinMode mode = SpinMode.rest;
  int _slot = 0;

  void grab() { mode = SpinMode.drag; vel = 0; }
  void dragBy(double slots) { pos += slots; _detent(); }
  void release(double velocity) { vel = velocity; mode = SpinMode.free; }
  /// Glide to slot [i] the short way round a ring of [n].
  void to(int i, int n) {
    if (n == 0) return;
    target = (pos + wrapSlots(i - pos, n)).roundToDouble();
    mode = SpinMode.target;
  }

  /// Returns true while moving.
  bool step(double dt) {
    if (mode == SpinMode.drag) return true;
    if (mode == SpinMode.rest) return false;
    if (mode == SpinMode.target) {
      final c = 2 * math.sqrt(targetK) * .8;
      vel += (targetK * (target - pos) - c * vel) * dt;
      pos += vel * dt;
      _detent();
      if ((target - pos).abs() < 1e-4 && vel.abs() < 1e-3) _rest(target);
      return true;
    }
    final cap = 1 - _ss(captureAt, captureFrom, vel.abs());
    final near = pos.roundToDouble(), d = pos - near;
    final acc = -detent * math.sin(2 * math.pi * d) / (2 * math.pi) * (.25 + .75 * cap) - (friction + captureFriction * cap) * vel;
    vel += acc * dt;
    pos += vel * dt;
    _detent();
    if ((pos - near).abs() < 5e-4 && vel.abs() < 4e-3) _rest(near);
    return true;
  }

  void _rest(double p) { pos = p; vel = 0; mode = SpinMode.rest; }
  void _detent() {
    final s = pos.round();
    if (s != _slot) { _slot = s; onDetent?.call(s); }
  }
}

/// One frame of a friction glide (velocity decays by e^(−friction·dt)). Returns the new velocity.
double coast(double vel, double friction, double dt) => vel * math.exp(-friction * dt);

/// Position shown for a raw scroll [raw] limited to [lo]…[hi]: past an end it moves at [k] of the finger (0.35 feels right).
double rubberBand(double raw, double lo, double hi, {double k = .35}) => raw < lo ? lo - (lo - raw) * k : (raw > hi ? hi + (raw - hi) * k : raw);
