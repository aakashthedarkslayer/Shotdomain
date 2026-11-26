// BAKED FACES: a 3D object (book, box, card, drawer) built from flat faces, each a pre-baked image placed on its plane
// with the shared camera. Per frame only matrices change: ONE CustomPaint records ~1 drawImageRect/drawVertices per
// visible face under canvas.transform. A live widget (a real TextField on a page) can sit BETWEEN the faces behind it
// and the faces in front of it, and still hit-tests correctly (Cam25D.plane flattens z).
// WHEN: 2.5D objects that move, turn and open (Softbound BookView: covers, spine, page block, edges, hinged board).
// DEVICE LESSONS (Softbound, I2202 120Hz Impeller): a shelf spin of 5+ books = raster p50 ~5ms at every time of day.
//  - Bake every face ONCE per content × lighting key (rasterize-and-cache); perspective defeats Flutter's raster
//    cache, so the cheapest picture per frame wins. No widgets per face, no text layout per frame, no per-face layers.
//  - Shade with vertex-colour modulate (vertex_tint.dart), never a ColorFilter (night doubled the GPU cost).
//  - Cull faces turned away (unless twoSided) and sort far → near by view depth; nudge with [bias] where faces touch.
//  - RepaintBoundary around the whole object when something on it animates at rest (a living cover overlay).
// Bending faces (page curl, crumple): draw the image as an ImageShader on a vertex grid lit per vertex
//   (see softbound/lib/book/book_view.dart _leaf).
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';
import 'package:vector_math/vector_math_64.dart' show Matrix4, Vector3;

import 'cam25d.dart';
import 'vertex_tint.dart';

/// One flat face: [model] maps face-local x∈[0,w], y∈[0,h] (y up, normal +z) to the world.
class BakedFace {
  BakedFace({required this.model, required this.w, required this.h, this.image, Size? px, this.color, this.twoSided = false, this.bias = 0, this.live})
      : assert(image != null || color != null || live != null),
        px = px ?? (image != null ? Size(image.width.toDouble(), image.height.toDouble()) : const Size(100, 100));
  final Matrix4 model;
  final double w, h;
  final ui.Image? image;
  /// A plain face (thin board edges) instead of an image.
  final Color? color;
  /// The face's pixel space (the image size by default; the widget size for a [live] face).
  final Size px;
  final bool twoSided;
  /// Added to the depth (world units) to settle ties between touching faces (positive = drawn earlier).
  final double bias;
  /// A real widget drawn on this face instead of the image (sized [px]).
  final Widget? live;
}

/// Key light for per-face Lambert shading: lit = ambient + (1 − ambient)·max(0, n·l)·key; the rest darkens toward [shade].
class FaceLight {
  const FaceLight({required this.toLight, required this.shade, this.ambient = .62, this.key = 1, this.shadeMax = .6});
  final Vector3 toLight;
  final Color shade;
  final double ambient, key, shadeMax;
}

class BakedSolid extends StatelessWidget {
  const BakedSolid({super.key, required this.faces, required this.cam, required this.light, this.onTap, this.semanticLabel});
  final List<BakedFace> faces;
  final Cam25D cam;
  final FaceLight light;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final l = light.toLight.normalized(), ops = <_Op>[];
    for (final f in faces) {
      final o = f.model.transform3(Vector3.zero());
      final c = f.model.transform3(Vector3(f.w / 2, f.h / 2, 0));
      final n = (f.model.transform3(Vector3(0, 0, 1)) - o).normalized();
      final facing = n.dot(cam.eye - c) > 0;
      if (!facing && !f.twoSided) continue;
      final nf = facing ? n : -n;
      final lit = (light.ambient + (1 - light.ambient) * math.max(0, nf.dot(l)) * light.key).clamp(0.0, 1.0);
      ops.add(_Op(f, cam.depth(c) + f.bias, cam.plane(f.model, f.w, f.h, f.px), (1 - lit) * light.shadeMax));
    }
    ops.sort((a, b) => b.depth.compareTo(a.depth));
    final children = <Widget>[];
    var from = 0;
    for (var i = 0; i < ops.length; i++) {
      final live = ops[i].face.live;
      if (live == null) continue;
      if (i > from) children.add(_paint(ops.sublist(from, i)));
      final o = ops[i];
      children.add(Positioned(left: 0, top: 0, width: o.face.px.width, height: o.face.px.height,
          child: Transform(transform: o.m, child: RepaintBoundary(child: live))));
      from = i + 1;
    }
    if (from < ops.length) children.add(_paint(ops.sublist(from)));
    if (onTap != null) {
      for (final o in ops) {
        children.add(Positioned(left: 0, top: 0, width: o.face.px.width, height: o.face.px.height,
            child: Transform(transform: o.m, child: GestureDetector(onTap: onTap, behavior: HitTestBehavior.opaque, child: const SizedBox.expand()))));
      }
    }
    final stack = Stack(clipBehavior: Clip.none, children: children);
    return semanticLabel == null ? stack : Semantics(button: onTap != null, label: semanticLabel, onTap: onTap, child: stack);
  }

  Widget _paint(List<_Op> ops) => Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: _FacesPainter(ops, light.shade))));
}

class _Op {
  _Op(this.face, this.depth, this.m, this.shade);
  final BakedFace face;
  final double depth, shade;
  final Matrix4 m;
}

class _FacesPainter extends CustomPainter {
  _FacesPainter(this.ops, this.shade);
  final List<_Op> ops;
  final Color shade;

  @override
  void paint(Canvas c, Size size) {
    for (final o in ops) {
      final f = o.face, r = Offset.zero & f.px, img = f.image, col = f.color;
      c.save();
      c.transform(o.m.storage);
      if (img != null) {
        drawTinted(c, img, r, shadeTint(shade, o.shade));
      } else if (col != null) {
        c.drawRect(r, Paint()..color = Color.lerp(col, shade, o.shade)!);
      }
      c.restore();
    }
  }

  @override
  bool hitTest(Offset position) => false;

  @override
  bool shouldRepaint(_FacesPainter old) => true; // rebuilt only when the pose changes
}
