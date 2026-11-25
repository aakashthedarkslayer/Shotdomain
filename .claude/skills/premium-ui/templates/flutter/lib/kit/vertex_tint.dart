// VERTEX TINT: shade, tint, fog and cut images with drawVertices + pipeline blends instead of ColorFilter / saveLayer /
// clips / advanced blends.
// WHEN: anything drawn many times per frame that needs lighting or a tint (faces of a 2.5D object, index cards, rows of
//   thumbnails, a gobo shadow band laid over paper).
// DEVICE LESSONS (Softbound, Impeller on a 120Hz Android):
//  - A ColorFilter on an image draw is an offscreen pass. One per book face, only at night, made night 2x the GPU cost
//    of day. drawTinted() does tex × tint (BlendMode.modulate between vertex colour and the image shader) in one pass.
//  - multiply/screen/overlay/softLight are ADVANCED blends: a backdrop copy per draw. Use modulate (= multiply on opaque
//    ground: shadow bands, gobo bars) and plus (instead of screen: glows, foil flashes).
//  - Clips cost a stencil pass: cut convex polygons on the CPU (clipConvex) and draw the result as one fan.
//  - Catalogue scroll went from raster p50 28–40ms to 1.6ms with exactly these swaps (every card = 1–2 fans).
// Per-vertex colours also give you free gradients (lighting that varies across a face, occlusion toward an edge).
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/painting.dart';

const _white = Color(0xFFFFFFFF); // lint-ok: modulate identity (tex × white = tex)

/// Tests: called with every fan's polygon (local px) just before it is drawn (GPU-cost probes measure the fill area).
void Function(List<Offset> poly)? debugOnFan;

final _shaders = Expando<ImageShader>();
final _identity = Float64List.fromList([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/// One cached ImageShader per image (sampling 1:1 in image px). The shader keeps its image alive until GC: drop
/// your reference to both when you retire the image.
ImageShader imageShaderOf(ui.Image i, {FilterQuality quality = FilterQuality.medium}) =>
    _shaders[i] ??= ImageShader(i, TileMode.clamp, TileMode.clamp, _identity, filterQuality: quality);

/// The tint for "darken toward [shade] by [amount]" (0 = untouched).
Color shadeTint(Color shade, double amount) => Color.lerp(_white, shade, amount.clamp(0.0, 1.0))!;

/// [image] stretched over [dst], multiplied by [tint] (white = unchanged). One draw, pipeline blend, no offscreen pass.
void drawTinted(Canvas c, ui.Image image, Rect dst, Color tint, {double opacity = 1}) {
  if (tint == _white) {
    c.drawImageRect(image, Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble()), dst,
        Paint()..filterQuality = FilterQuality.medium..color = _white.withValues(alpha: opacity));
    return;
  }
  final iw = image.width.toDouble(), ih = image.height.toDouble();
  final v = ui.Vertices(ui.VertexMode.triangles, [dst.topLeft, dst.topRight, dst.bottomRight, dst.topLeft, dst.bottomRight, dst.bottomLeft],
      textureCoordinates: [Offset.zero, Offset(iw, 0), Offset(iw, ih), Offset.zero, Offset(iw, ih), Offset(0, ih)],
      colors: List<Color>.filled(6, tint));
  c.drawVertices(v, BlendMode.modulate, Paint()..shader = imageShaderOf(image)..color = _white.withValues(alpha: opacity));
  v.dispose();
}

/// A convex polygon as one triangle fan. [textured]: the paint's ImageShader is sampled at the polygon's own px
/// (so draw under the face's transform, in image px). [colorAt]: per-vertex colour, combined with the shader by [blend].
void drawFan(Canvas c, List<Offset> poly, Paint p, {bool textured = false, Color Function(Offset q)? colorAt, BlendMode blend = BlendMode.modulate}) {
  final n = poly.length;
  if (n < 3) return;
  final pos = Float32List(n * 2), idx = Uint16List((n - 2) * 3);
  for (var i = 0; i < n; i++) {
    pos[i * 2] = poly[i].dx;
    pos[i * 2 + 1] = poly[i].dy;
  }
  for (var i = 0; i < n - 2; i++) {
    idx[i * 3] = 0;
    idx[i * 3 + 1] = i + 1;
    idx[i * 3 + 2] = i + 2;
  }
  Int32List? cs;
  if (colorAt != null) {
    cs = Int32List(n);
    for (var i = 0; i < n; i++) {
      cs[i] = colorAt(poly[i]).toARGB32();
    }
  }
  debugOnFan?.call(poly);
  final v = ui.Vertices.raw(ui.VertexMode.triangles, pos, textureCoordinates: textured ? pos : null, colors: cs, indices: idx);
  c.drawVertices(v, blend, p);
  v.dispose();
}

/// The part of convex [pts] where the affine function [f] ≥ 0 (Sutherland–Hodgman, one plane). Chain calls to cut by
/// several lines (e.g. keep a face above the floor, then only the strip a shadow bar covers).
List<Offset> clipConvex(List<Offset> pts, double Function(Offset q) f) {
  final v = [for (final p in pts) f(p)], out = <Offset>[];
  for (var i = 0; i < pts.length; i++) {
    final j = (i + 1) % pts.length, a = v[i], b = v[j];
    if (a >= 0) out.add(pts[i]);
    if ((a >= 0) != (b >= 0)) out.add(Offset.lerp(pts[i], pts[j], a / (a - b))!);
  }
  return out;
}
