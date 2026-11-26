// PERF LOG: an opt-in, on-device frame logger. Zero cost unless built with --dart-define=PERF_LOG=true.
// WHEN: every app with custom rendering. Tests only see CPU; the GPU (raster) cost, leaked tickers and runaway sounds
//   only show up on the phone. Build a profile/release APK with the define, drive it (scripted adb input guarded by an
//   "app in front" check), read `adb logcat -s flutter | grep PERF`.
// OUTPUT (one line per second, only while frames are produced; silence = idle = good):
//   PERF n=118 jank=0 | build p50 1.2 p90 2.0 max 3.1 | raster p50 1.6 p90 2.4 max 4.0 | transient=1 <your state>
// DEVICE LESSONS (Softbound, I2202 120Hz Impeller): raster is the usual killer (blurred text shadows in a cross-fade,
//   ColorFilters, advanced blends); `transient` climbing over time = a leaked Ticker (240+ froze the app).
//   Always log the state you expect to change (spin=, view=, mode=) so a non-event can't pass as "smooth".
// Wire in main():  if (kPerfLog) startPerfLog(state: () => 'view=${world.view.name} ticks=${world.clock.debugTicks}');
// Bisect GPU cost with diagnostic defines: perfHide('studio') → leave that layer out; FORCE_* defines for state.
import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';

const bool kPerfLog = bool.fromEnvironment('PERF_LOG');

/// --dart-define=PERF_HIDE=studio,cord → perfHide('studio') is true (wrap that layer in `if (!perfHide(..))`).
bool perfHide(String layer) => const String.fromEnvironment('PERF_HIDE').split(',').contains(layer);

/// Starts the logger. [budgetMs] = the frame budget that counts as jank (16.7 for 60fps; 8.3 to hold 120Hz).
void startPerfLog({String Function()? state, double budgetMs = 16.7}) {
  final b = <double>[], r = <double>[];
  var last = DateTime.now();
  SchedulerBinding.instance.addTimingsCallback((List<FrameTiming> ts) {
    for (final t in ts) {
      b.add(t.buildDuration.inMicroseconds / 1000);
      r.add(t.rasterDuration.inMicroseconds / 1000);
    }
    if (DateTime.now().difference(last).inMilliseconds < 1000 || b.isEmpty) return;
    last = DateTime.now();
    final jank = [for (var i = 0; i < b.length; i++) if (b[i] > budgetMs || r[i] > budgetMs) 1].length;
    debugPrint('PERF n=${b.length} jank=$jank | build ${_q(b)} | raster ${_q(r)} | '
        'transient=${SchedulerBinding.instance.transientCallbackCount} ${state?.call() ?? ''}');
    b.clear();
    r.clear();
  });
}

String _q(List<double> v) {
  v.sort();
  String f(double x) => x.toStringAsFixed(1);
  return 'p50 ${f(v[v.length ~/ 2])} p90 ${f(v[(v.length * .9).floor().clamp(0, v.length - 1)])} max ${f(v.last)}';
}
