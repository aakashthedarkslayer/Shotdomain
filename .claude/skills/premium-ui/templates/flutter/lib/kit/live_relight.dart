// LIVE RELIGHT: a theme / time-of-day change that MOVES the light (direction swings, intensity dims in stops, colours
// blend) by drawing the light model live during the transition, instead of cross-fading two baked images.
// WHEN: the scene's look comes from a light model (shader uniforms, per-face Lambert, shadow direction) and the switch
//   should feel like the sun moving / a lamp coming on (Softbound: pull-cord morning → golden → night, 1.2s).
// DEVICE LESSONS (Softbound):
//  - Cross-fading two bakes looks like a dissolve, not motion. Blend the light model and render live for those 1.2s.
//  - Live = the expensive path, so ONLY while moving: at rest draw the bake. Pre-render the END state's bake off-thread
//    (image_lifetime.dart BakeSlot) the moment the change starts, so the frame after the sweep is a cheap image draw.
//  - Prewarm bakes for every state ~1.5s after launch, one at a time, so the first pull doesn't stall on a bake.
//  - Intensity blends geometrically (stops): sun → lamp dims smoothly instead of flaring mid-way.
//  - Never run a live full-screen shader during a CAMERA move: warp the last bake (cam25d.dart planeHomography).
// Usage:
//   final relight = Relight<MyLight>(MyLight.lerp, MyLight.of(state));
//   onChange: relight.go(MyLight.of(next)); slot.request(next, ...); unsub = clock.onTick((dt) { if (!relight.step(dt)) unsub(); });
//   paint: relight.drawLive(slot.has(next)) ? drawLive(canvas, relight.current) : drawImage(slot.current!.image);
import 'dart:math' as math;

import 'package:vector_math/vector_math_64.dart' show Vector3;

double easeInOutQuad(double t) => t < .5 ? 2 * t * t : 1 - math.pow(-2 * t + 2, 2) / 2;

/// Direction blend (normalized lerp; plenty for a key light swinging ≤ 90°).
Vector3 blendDir(Vector3 a, Vector3 b, double e) => (a.normalized() * (1 - e) + b.normalized() * e).normalized();

/// Intensity blend in stops (geometric), for exposure/brightness values > 0.
double blendStops(double a, double b, double e) => a * math.pow(b / a, e).toDouble();

class Relight<L> {
  Relight(this.lerp, L initial, {this.seconds = 1.2})
      : from = initial,
        to = initial;
  /// Blend two light states with eased progress e ∈ [0,1] (Color.lerp, blendDir, blendStops per field).
  final L Function(L a, L b, double e) lerp;
  final double seconds;
  L from, to;
  double t = 1;

  bool get moving => t < 1;
  L get current => t >= 1 ? to : lerp(from, to, easeInOutQuad(t));

  /// Start a change; a change mid-sweep starts from where the light is now (no jump).
  void go(L next, {bool reducedMotion = false}) {
    from = current;
    to = next;
    t = reducedMotion ? 1 : 0;
  }

  /// Advance; returns true while still moving.
  bool step(double dt) {
    t = math.min(1, t + dt / seconds);
    return moving;
  }

  /// Draw the live light model this frame (moving, or the end state's bake isn't ready yet).
  bool drawLive(bool endBakeReady) => moving || !endBakeReady;
}
