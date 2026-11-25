// GPU COST CANVAS: tests can't time the GPU, but they can COUNT what makes an Impeller frame expensive. Paint one frame
// of your painter into this canvas and assert: no advanced blends (backdrop copy each), no colour filters (offscreen
// pass each), no saveLayers, no mask blurs, few clips, bounded fill area (screens of pixels covered).
// WHEN: any heavy custom painter (scrolling lists of baked cards, 2.5D scenes). Softbound's catalogue scroll test used
//   this to go from raster p50 28–40ms on the phone to 1.6ms, with these asserts guarding it since.
//   final cc = CountCanvas(); debugOnFan = cc.area;   // vertex_tint.dart hook: fans report their polygon
//   painter.paint(cc, size); debugOnFan = null;
//   expect(cc.counts['advancedBlend'] ?? 0, 0); expect(cc.counts['colorFilter'] ?? 0, 0); expect(cc.px / (w * h), lessThan(3));
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/painting.dart';
import 'package:vector_math/vector_math_64.dart' show Matrix4, Vector3;

class CountCanvas implements Canvas {
  final counts = <String, int>{};
  final _stack = <Matrix4>[Matrix4.identity()];
  /// Screen pixels covered so far (logical px², after the current transform).
  double px = 0;
  Matrix4 get m => _stack.last;
  void _n(String k) => counts[k] = (counts[k] ?? 0) + 1;

  /// Add a polygon's projected area (also the vertex_tint.dart `debugOnFan` hook).
  void area(List<Offset> poly) {
    final s = m.storage;
    final q = [
      for (final p in poly)
        () {
          final v = m.transform3(Vector3(p.dx, p.dy, 0)), w = s[3] * p.dx + s[7] * p.dy + s[15];
          return Offset(v.x / w, v.y / w);
        }()
    ];
    var a = 0.0;
    for (var i = 0; i < q.length; i++) {
      final p = q[i], r = q[(i + 1) % q.length];
      a += p.dx * r.dy - r.dx * p.dy;
    }
    px += a.abs() / 2;
  }

  void _rect(Rect r) => area([r.topLeft, r.topRight, r.bottomRight, r.bottomLeft]);
  void _paint(Paint p) {
    if (p.blendMode.index > BlendMode.modulate.index) _n('advancedBlend');
    if (p.colorFilter != null) _n('colorFilter');
    if (p.maskFilter != null) _n('maskBlur');
    if (p.imageFilter != null) _n('imageFilter');
  }

  @override
  void save() {
    _n('save');
    _stack.add(m.clone());
  }

  @override
  void restore() => _stack.removeLast();
  @override
  void translate(double dx, double dy) => _stack.last = m * Matrix4.translationValues(dx, dy, 0);
  @override
  void scale(double sx, [double? sy]) => _stack.last = m * Matrix4.diagonal3Values(sx, sy ?? sx, 1);
  @override
  void transform(Float64List t) => _stack.last = m * Matrix4.fromFloat64List(t);
  @override
  void saveLayer(Rect? b, Paint p) {
    _n('saveLayer');
    _paint(p);
    _stack.add(m.clone());
  }

  @override
  void clipPath(Path p, {bool doAntiAlias = true}) => _n('clip');
  @override
  void clipRect(Rect r, {ui.ClipOp clipOp = ui.ClipOp.intersect, bool doAntiAlias = true}) => _n('clip');
  @override
  void clipRRect(RRect r, {bool doAntiAlias = true}) => _n('clip');
  @override
  void drawRect(Rect r, Paint p) { _n('draw'); _paint(p); _rect(r); }
  @override
  void drawRRect(RRect r, Paint p) { _n('draw'); _paint(p); _rect(r.outerRect); }
  @override
  void drawImageRect(ui.Image img, Rect s, Rect d, Paint p) { _n('draw'); _n('image'); _paint(p); _rect(d); }
  @override
  void drawImage(ui.Image img, Offset o, Paint p) { _n('draw'); _n('image'); _paint(p); _rect(o & Size(img.width.toDouble(), img.height.toDouble())); }
  @override
  void drawVertices(ui.Vertices v, BlendMode b, Paint p) { _n('draw'); _n('vertices'); _paint(p); }
  @override
  void drawLine(Offset a, Offset b, Paint p) { _n('draw'); _paint(p); }
  @override
  void drawCircle(Offset c, double r, Paint p) { _n('draw'); _paint(p); _rect(Rect.fromCircle(center: c, radius: r)); }
  @override
  void drawPath(Path path, Paint p) { _n('draw'); _paint(p); _rect(path.getBounds()); }
  @override
  void drawParagraph(ui.Paragraph p, Offset o) { _n('draw'); _n('text'); }
  @override
  dynamic noSuchMethod(Invocation i) {
    _n('other:${i.memberName}');
    return null;
  }
}
