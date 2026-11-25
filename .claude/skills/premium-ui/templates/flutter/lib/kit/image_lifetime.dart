// IMAGE LIFETIME: bake pictures to images off the UI thread, swap them in when they land, and dispose the old ones
// only once no frame can still be drawing them.
// WHEN: any rasterize-and-cache art that changes at runtime (room/lighting bakes per time of day or camera, card
//   faces, covers): anything you'd be tempted to toImageSync while something moves.
// DEVICE LESSONS (Softbound, Impeller):
//  - toImageSync during motion stalls the frame on the GPU. Record the Picture, then Picture.toImage (async); keep
//    drawing (warping) the previous image until the new one lands, then bump a repaint notifier (never wake a ticker).
//  - On Impeller a disposed image draws as NOTHING (the plinth blinked out while the catalogue scrolled). Retire a
//    replaced image ~250ms later, and only if nothing references it any more.
//  - Image.dispose() twice asserts. Wrap bakes in Bake (idempotent dispose): an image can be retired AND hit by the
//    owner's dispose.
//  - toImageSync is fine ONCE at rest (first frame, nothing to warp yet), or for tiny images; budget it (≤2 per frame).
//  - Keep a ¼-res bake as an instant fallback and fade to the sharp one when it lands.
import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';

/// An image with an idempotent dispose.
class Bake {
  Bake(this.image, {this.key});
  final ui.Image image;
  final Object? key;
  bool _gone = false;
  bool get disposed => _gone;
  void dispose() {
    if (_gone) return;
    _gone = true;
    image.dispose();
  }
}

ui.Picture _record(Size logical, double scale, void Function(Canvas c) paint) {
  final rec = ui.PictureRecorder();
  paint(Canvas(rec)..scale(scale));
  return rec.endRecording();
}

/// Off the UI thread. [paint] draws in logical px; the image is [logical] × [scale] px.
Future<ui.Image> bakeAsync(Size logical, double scale, void Function(Canvas c) paint) async {
  final pic = _record(logical, scale, paint);
  try {
    return await pic.toImage(math.max(1, (logical.width * scale).ceil()), math.max(1, (logical.height * scale).ceil()));
  } finally {
    pic.dispose();
  }
}

/// Synchronous: only at rest or for tiny images.
ui.Image bakeSync(Size logical, double scale, void Function(Canvas c) paint) {
  final pic = _record(logical, scale, paint);
  final img = pic.toImageSync(math.max(1, (logical.width * scale).ceil()), math.max(1, (logical.height * scale).ceil()));
  pic.dispose();
  return img;
}

/// Disposes replaced bakes after [delay], unless [stillUsed] says something still draws them.
class ImageRetirer {
  ImageRetirer({this.delay = const Duration(milliseconds: 250)}); // lint-ok: default, measured on device
  final Duration delay;
  final Map<Timer, Bake> _pending = {};

  void retire(Bake b, {bool Function()? stillUsed}) {
    late final Timer t;
    t = Timer(delay, () {
      _pending.remove(t);
      if (stillUsed?.call() != true) b.dispose();
    });
    _pending[t] = b;
  }

  /// Owner disposing: cancel the timers and free everything still waiting (Bake.dispose is idempotent).
  void dispose() {
    for (final MapEntry(key: t, value: b) in _pending.entries) {
      t.cancel();
      b.dispose();
    }
    _pending.clear();
  }
}

/// One slot of baked art: shows [current] while a newer bake renders; one bake in flight, the latest request wins.
/// Painter: `final b = slot.current; if (b != null) canvas.drawImageRect(b.image, ...)` with `repaint: slot`.
class BakeSlot extends ChangeNotifier {
  BakeSlot({ImageRetirer? retirer}) : retirer = retirer ?? ImageRetirer();
  final ImageRetirer retirer;
  Bake? current;
  bool _busy = false, _disposed = false;
  (Object, Size, double, void Function(Canvas))? _queued;

  /// The current bake is for [key] (nothing to do).
  bool has(Object key) => current?.key == key;

  void request(Object key, Size logical, double scale, void Function(Canvas c) paint) {
    if (_disposed || has(key)) return;
    if (_busy) {
      _queued = (key, logical, scale, paint);
      return;
    }
    _busy = true;
    bakeAsync(logical, scale, paint).then((img) {
      _busy = false;
      if (_disposed) {
        img.dispose();
        return;
      }
      final old = current;
      current = Bake(img, key: key);
      if (old != null) retirer.retire(old, stillUsed: () => identical(current, old));
      notifyListeners(); // a repaint, never a ticker wake
      final q = _queued;
      _queued = null;
      if (q != null) request(q.$1, q.$2, q.$3, q.$4);
    }, onError: (Object _) => _busy = false);
  }

  @override
  void dispose() {
    _disposed = true;
    retirer.dispose();
    current?.dispose();
    super.dispose();
  }
}
