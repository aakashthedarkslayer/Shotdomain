// SHADOW MESH: soft ground shadows for many objects as ONE vertex mesh: no images, no blur, no layers.
// Each shadow is a convex polygon on the ground (y = 0) with a soft rim: centre → core → half → outer ring, vertex
// colours going from the shadow tint to white (white × ground = unchanged). The rim widens with height above the
// ground (contact hardening): crisp where an object touches, soft at the tip of a long low-sun cast.
// WHEN: objects standing on a floor/plinth/desk that move (books on a turntable, a pot, cards), especially with a light
//   that changes direction. Rebuild only when something moved; drawing is one call.
// DEVICE LESSONS (Softbound): MaskFilter.blur shadows per object per frame are the classic jank; this mesh costs one
//   drawVertices. Draw with BlendMode.modulate (= multiply over an opaque ground, but a pipeline blend: multiply is an
//   advanced blend with a backdrop copy). Books looked like they floated until there were THREE shadows per object:
//   a cast shadow, a wide light ambient pool and a tight dark contact line.
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/painting.dart';
import 'package:vector_math/vector_math_64.dart' show Matrix4, Vector3;

import 'cam25d.dart';

/// A ground point with its darkness [a] (0…1) and rim width [r] (world units).
typedef GroundPt = ({double x, double z, double a, double r});

class ShadowMesh {
  ShadowMesh(this.cam, this.tint, {this.halfRim = .42, this.liftFade = 3, this.tipFade = .7, this.castRim0 = .03, this.castRim = .085, this.aoShare = .55, this.aoRim = .42, this.contactRim = .085});
  final Cam25D cam;
  final Color tint;
  /// Tunables (Softbound's values, world units of a ~1-unit-tall object).
  final double halfRim, liftFade, tipFade, castRim0, castRim, aoShare, aoRim, contactRim;
  final _pos = <double>[], _col = <int>[], _idx = <int>[];
  static const _white = Color(0xFFFFFFFF); // lint-ok: multiply identity

  bool get isEmpty => _idx.isEmpty;

  int _vert(double x, double z, double a) {
    final s = cam.vp.storage, w = s[3] * x + s[11] * z + s[15];
    _pos
      ..add((s[0] * x + s[8] * z + s[12]) / w)
      ..add((s[1] * x + s[9] * z + s[13]) / w);
    _col.add(Color.lerp(_white, tint, a.clamp(0.0, 1.0))!.toARGB32());
    return _col.length - 1;
  }

  /// A soft convex blob around [pts] (their convex hull).
  void blob(List<GroundPt> pts) {
    final h = _hull(pts), n = h.length;
    if (n < 3) return;
    var area = 0.0, cx = 0.0, cz = 0.0, ca = 0.0;
    for (var i = 0; i < n; i++) {
      final p = h[i], q = h[(i + 1) % n];
      area += p.x * q.z - q.x * p.z;
      cx += p.x;
      cz += p.z;
      ca += p.a;
    }
    final sgn = area >= 0 ? 1.0 : -1.0, c = _vert(cx / n, cz / n, ca / n);
    final core = <int>[], half = <int>[], out = <int>[];
    for (var i = 0; i < n; i++) {
      final p = h[i], a = h[(i + n - 1) % n], b = h[(i + 1) % n];
      var n1x = sgn * (p.z - a.z), n1z = -sgn * (p.x - a.x), n2x = sgn * (b.z - p.z), n2z = -sgn * (b.x - p.x);
      final l1 = math.max(1e-9, math.sqrt(n1x * n1x + n1z * n1z)), l2 = math.max(1e-9, math.sqrt(n2x * n2x + n2z * n2z));
      n1x /= l1;
      n1z /= l1;
      n2x /= l2;
      n2z /= l2;
      var mx = n1x + n2x, mz = n1z + n2z;
      final ml = math.max(1e-9, math.sqrt(mx * mx + mz * mz));
      mx /= ml;
      mz /= ml;
      final miter = math.min(2.0, 1 / math.max(.2, mx * n1x + mz * n1z));
      core.add(_vert(p.x, p.z, p.a));
      half.add(_vert(p.x + mx * p.r * miter * .42, p.z + mz * p.r * miter * .42, p.a * halfRim));
      out.add(_vert(p.x + mx * p.r * miter, p.z + mz * p.r * miter, 0));
    }
    for (var i = 0; i < n; i++) {
      final j = (i + 1) % n;
      _idx.addAll([c, core[i], core[j], core[i], half[i], half[j], core[i], half[j], core[j], half[i], out[i], out[j], half[i], out[j], half[j]]);
    }
  }

  /// Cast + ambient pool + contact line of an upright box ([m] maps x∈[0,w], y∈[0,h], z∈[−d/2,d/2] to the world), lit
  /// from [toLight]. [lift] = height above the ground (shadows fade and spread as it rises).
  void box(Matrix4 m, double w, double h, double d, Vector3 toLight, {required double cast, required double contact, double lift = 0}) {
    final s = m.storage, ly = math.max(.12, toLight.y), kx = toLight.x / ly, kz = toLight.z / ly;
    final foot = <GroundPt>[], cast0 = <GroundPt>[];
    var top = 0.0;
    for (final x in [0.0, w]) {
      for (final y in [0.0, h]) {
        for (final z in [-d / 2, d / 2]) {
          final wx = s[0] * x + s[4] * y + s[8] * z + s[12], wy = s[1] * x + s[5] * y + s[9] * z + s[13], wz = s[2] * x + s[6] * y + s[10] * z + s[14];
          final hy = math.max(0.0, wy);
          top = math.max(top, hy);
          cast0.add((x: wx - kx * hy, z: wz - kz * hy, a: hy, r: hy));
          if (y == 0) foot.add((x: wx, z: wz, a: 0, r: 0));
        }
      }
    }
    final fade = 1 / (1 + lift * liftFade), span = math.max(.05, top);
    if (cast > .004) {
      final len = span * math.sqrt(kx * kx + kz * kz);
      blob([for (final p in cast0) (x: p.x, z: p.z, a: cast * fade * (1 - tipFade * p.a / span), r: castRim0 + castRim * len * p.a / span + lift * .3)]);
    }
    if (contact > .004) {
      blob([for (final p in foot) (x: p.x, z: p.z, a: contact * aoShare * fade, r: aoRim + lift * .6)]);
      blob([for (final p in foot) (x: p.x, z: p.z, a: contact * fade * fade, r: contactRim + lift * .4)]);
    }
  }

  /// One draw call. Reset with a new ShadowMesh when anything moved.
  void draw(Canvas c, {BlendMode blend = BlendMode.modulate}) {
    if (_idx.isEmpty) return;
    final v = ui.Vertices.raw(ui.VertexMode.triangles, Float32List.fromList(_pos), colors: Int32List.fromList(_col), indices: Uint16List.fromList(_idx));
    c.drawVertices(v, BlendMode.dst, Paint()..blendMode = blend);
    v.dispose();
  }

  static List<GroundPt> _hull(List<GroundPt> pts) {
    final p = List<GroundPt>.of(pts)..sort((a, b) => a.x != b.x ? a.x.compareTo(b.x) : a.z.compareTo(b.z));
    if (p.length < 3) return p;
    double cr(GroundPt o, GroundPt a, GroundPt b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    final lo = <GroundPt>[], up = <GroundPt>[];
    for (final q in p) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo.last, q) <= 1e-12) {
        lo.removeLast();
      }
      lo.add(q);
    }
    for (final q in p.reversed) {
      while (up.length >= 2 && cr(up[up.length - 2], up.last, q) <= 1e-12) {
        up.removeLast();
      }
      up.add(q);
    }
    return [...lo..removeLast(), ...up..removeLast()];
  }
}
