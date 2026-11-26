// CAM25D: one perspective camera shared by every layer of a 2.5D scene (Softbound: shelf, book, drawer, pile, bin).
// WHEN: real 3D placement and true perspective, but drawn with Flutter painters/widgets (no 3D engine, no GL view).
//  - project(p): world point → screen px.  depth(p): sort far → near.  pixelsPerUnit(p): size strokes/particles.
//  - plane(model, w, h, px): a matrix for Transform()/canvas.transform that maps a [px]-sized child placed at the screen's
//    top-left onto the plane x∈[0,w], y∈[0,h] (y up) of [model]. Works for baked images AND live widgets (a real
//    TextField on a 3D page).
//  - planeHomography(from, to): re-project an image of the ground plane y=0 rendered with one camera onto another
//    (warp a baked floor during a camera move instead of re-rendering it).
// DEVICE LESSON: a projective Transform breaks RenderBox.globalToLocal (every tap on the 3D page put the caret at 0).
//   plane() zeroes the z row and column: painting ignores output z and hit-testing then maps taps exactly.
// PORT TIP: same eye/target/fov/world units as the web prototype (three.js), so numbers carry over 1:1. [authored] keeps
//   the prototype's horizontal framing on taller phones (widens the vertical fov).
import 'dart:math' as math;
import 'dart:ui' show Offset, Size;

import 'package:vector_math/vector_math_64.dart';

class Cam25D {
  Cam25D({required this.size, required this.eye, required this.target, required this.fovY, this.authored, double near = .1, double far = 100}) {
    final aspect = size.width / size.height;
    var fov = fovY;
    final au = authored;
    if (au != null) {
      final a = au.width / au.height;
      if (aspect < a) fov = 2 * math.atan(math.tan(radians(fovY) / 2) * a / aspect) * 180 / math.pi;
    }
    view = makeViewMatrix(eye, target, Vector3(0, 1, 0));
    proj = makePerspectiveMatrix(radians(fov), aspect, near, far);
    final viewport = Matrix4.identity()
      ..translateByDouble(size.width / 2, size.height / 2, 0, 1)
      ..scaleByDouble(size.width / 2, -size.height / 2, 1, 1);
    vp = viewport.multiplied(proj).multiplied(view);
  }

  final Size size;
  final Vector3 eye, target;
  final double fovY;
  /// The prototype's framing (e.g. 390×844): taller screens keep its horizontal extent.
  final Size? authored;
  late final Matrix4 view, proj, vp;

  Offset project(Vector3 p) {
    final v = vp.transform(Vector4(p.x, p.y, p.z, 1));
    return Offset(v.x / v.w, v.y / v.w);
  }

  /// View-space distance in front of the camera. Bigger = farther; paint far → near.
  double depth(Vector3 p) => -view.transform3(p.clone()).z;

  double pixelsPerUnit(Vector3 p) => (project(p + Vector3(.5, 0, 0)) - project(p - Vector3(.5, 0, 0))).distance;

  /// Transform(transform: cam.plane(model, w, h, px), child: SizedBox.fromSize(size: px)) inside
  /// Positioned(left: 0, top: 0, width: px.width, height: px.height).
  Matrix4 plane(Matrix4 model, double w, double h, Size px) {
    final pixelToLocal = Matrix4.identity()
      ..translateByDouble(0, h, 0, 1)
      ..scaleByDouble(w / px.width, -h / px.height, 1, 1);
    return vp.multiplied(model).multiplied(pixelToLocal)
      ..setRow(2, Vector4(0, 0, 1, 0))
      ..setColumn(2, Vector4(0, 0, 1, 0));
  }

  /// A camera moved toward something (dolly onto a page, dip into a pot). t=0 → this camera, t=1 → the other.
  Cam25D lerpTo(Vector3 eye2, Vector3 target2, double t) =>
      Cam25D(size: size, eye: eye + (eye2 - eye) * t, target: target + (target2 - target) * t, fovY: fovY, authored: authored);
}

/// Canvas transform mapping [from]'s screen to [to]'s screen for points on the ground plane y = 0 (exact homography).
/// Draw a floor baked with [from] under `canvas.transform(planeHomography(from, to).storage)` while the camera moves.
Matrix4 planeHomography(Cam25D from, Cam25D to) {
  Matrix3 h(Cam25D c) {
    final m = c.vp; // (x, z, 1) on y = 0 → homogeneous screen point
    return Matrix3.zero()
      ..setEntry(0, 0, m.entry(0, 0))..setEntry(0, 1, m.entry(0, 2))..setEntry(0, 2, m.entry(0, 3))
      ..setEntry(1, 0, m.entry(1, 0))..setEntry(1, 1, m.entry(1, 2))..setEntry(1, 2, m.entry(1, 3))
      ..setEntry(2, 0, m.entry(3, 0))..setEntry(2, 1, m.entry(3, 2))..setEntry(2, 2, m.entry(3, 3));
  }

  final k = h(to).multiplied(h(from)..invert());
  return Matrix4.zero()
    ..setEntry(0, 0, k.entry(0, 0))..setEntry(0, 1, k.entry(0, 1))..setEntry(0, 3, k.entry(0, 2))
    ..setEntry(1, 0, k.entry(1, 0))..setEntry(1, 1, k.entry(1, 1))..setEntry(1, 3, k.entry(1, 2))
    ..setEntry(2, 2, 1)
    ..setEntry(3, 0, k.entry(2, 0))..setEntry(3, 1, k.entry(2, 1))..setEntry(3, 3, k.entry(2, 2));
}
