// VERLET CHAIN: a hanging chain / cord / ribbon in 2D screen px, pinned at the top, with a heavy end that a finger can
// hold. Inextensible but can go slack (a real chain), damped, with substeps; reports when it has settled so the frame
// loop can stop.
// WHEN: pull cords (Softbound's brass ball-chain + glass globe that switches the time of day), bookmarks, tassels,
//   hanging tags, anything that should swing when the scene moves.
// PATTERN (Softbound cord_sim.dart): pull resistance = soft limit feed = max·(1 − e^(−stretch/max)); crossing a pull
//   threshold = detent click (selection haptic + tick); release past it fires the action (+ flare, recoil, clinks at
//   swing reversals). Tap = a scripted tug. Sway with the scene: add a horizontal [wind] from the scroll/spin velocity.
//   Reduced motion: skip the sim, snap to rest, still perform the action.
// DEVICE NOTES: two substeps × 28 constraint iterations for ~10 links is CPU-trivial. Paint beads from cached
//   sprites (one per lighting state), never per-frame gradients per bead. Subscribe to the clock only while moving
//   (settled > 20 frames → unsubscribe). 3D variant with collision against a box: softbound/lib/shelf/physics.dart Rope.
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' show Offset;

class VerletChain {
  VerletChain({required this.links, required this.segment, this.anchor = Offset.zero, this.gravity = 2600, this.damping = .85, this.iterations = 28, this.tailWeight = .3})
      : x = Float64List(links + 1),
        y = Float64List(links + 1),
        px = Float64List(links + 1),
        py = Float64List(links + 1) {
    for (var i = 0; i <= links; i++) {
      x[i] = px[i] = anchor.dx;
      y[i] = py[i] = anchor.dy + i * segment;
    }
  }
  final int links, iterations;
  /// Rest length of one link (px); gravity in px/s²; damping per second (velocity × e^(−damping·dt)).
  final double segment, gravity, damping;
  /// Inverse-mass share of the end point (lower = heavier pendant).
  final double tailWeight;
  final Float64List x, y, px, py;
  /// The pinned top (move it to feed the chain into a fitting).
  Offset anchor;
  /// Where a finger holds the end (null = hanging free).
  Offset? hold;
  /// Horizontal acceleration (px/s²) along the chain, e.g. from the scene's spin velocity.
  double wind = 0;
  int _still = 0;

  Offset get tail => Offset(x[links], y[links]);
  bool get settled => _still > 20;

  /// Push every link (px per substep), more at the free end.
  void nudge(double vx, double vy) {
    for (var i = 1; i <= links; i++) {
      final k = i / links;
      px[i] -= vx * k;
      py[i] -= vy * k;
    }
    _still = 0;
  }

  /// Advance by [dt] seconds (two substeps). Returns true while moving.
  bool step(double dt) {
    dt = math.min(dt, 1 / 30);
    _sub(dt / 2);
    _sub(dt / 2);
    var e = 0.0;
    for (var i = 1; i <= links; i++) {
      e += math.pow(x[i] - px[i], 2) + math.pow(y[i] - py[i], 2);
    }
    _still = hold == null && e < .0004 && wind.abs() < .5 ? _still + 1 : 0;
    return !settled;
  }

  void _sub(double h) {
    final damp = math.exp(-h * damping), gy = gravity * h * h, h2 = hold;
    x[0] = px[0] = anchor.dx;
    y[0] = py[0] = anchor.dy;
    for (var i = 1; i <= links; i++) {
      if (h2 != null && i == links) continue;
      final vx = (x[i] - px[i]) * damp, vy = (y[i] - py[i]) * damp;
      px[i] = x[i];
      py[i] = y[i];
      x[i] += vx + wind * (i / links) * h * h;
      y[i] += vy + gy;
    }
    if (h2 != null) { // the end follows the finger, never past the chain's length
      final dx = h2.dx - anchor.dx, dy = h2.dy - anchor.dy, d = math.max(1e-6, math.sqrt(dx * dx + dy * dy)), l = math.min(d, links * segment);
      px[links] = x[links];
      py[links] = y[links];
      x[links] = anchor.dx + dx / d * l;
      y[links] = anchor.dy + dy / d * l;
    }
    for (var it = 0; it < iterations; it++) {
      for (var j = 0; j < links; j++) {
        final i = it.isOdd ? links - 1 - j : j, dx = x[i + 1] - x[i], dy = y[i + 1] - y[i], d = math.max(1e-6, math.sqrt(dx * dx + dy * dy));
        if (d <= segment && i < links - 1) continue; // slack is fine, stretch is not
        final wa = i == 0 ? 0.0 : 1.0, wb = i + 1 == links ? (h2 != null ? 0.0 : tailWeight) : 1.0, s = wa + wb;
        if (s == 0) continue;
        final f = (d - segment) / d / s;
        x[i] += dx * f * wa;
        y[i] += dy * f * wa;
        x[i + 1] -= dx * f * wb;
        y[i + 1] -= dy * f * wb;
      }
    }
  }
}

/// Soft resistance: how far the fitting yields for a pull that stretches the chain by [stretch] px (never more than [max]).
double pullFeed(double stretch, double max) => stretch <= 0 ? 0 : max * (1 - math.exp(-stretch / max));
