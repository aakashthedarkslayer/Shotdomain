// WORLD CLOCK + VIEW SWITCHER: the shared runtime of a scene made of many layers.
// WorldClock = ONE Ticker for the whole app that runs only while something moves (a subscriber or a wake window) and
//   sleeps otherwise. Layers subscribe with onTick while they animate and unsubscribe the frame they settle.
// ViewSwitcher = "show this view": awaits the current view's exit, then the next view's enter; a request made mid-switch
//   is QUEUED (latest wins) instead of dropped.
// WHEN: any app with several animated layers/views sharing state (a shelf + a drawer + a list over one scene).
// DEVICE LESSONS (Softbound):
//  - Idle must be zero frames. Several layers with their own Tickers kept each other awake; one clock that stops when
//    _ticks is empty and the wake window ran out fixed it. Painters use `repaint: clock.frame`.
//  - Lazy: attach() from the owning State's initState, detach() from its dispose (before super.dispose) so a disposed
//    TickerProvider never owns a live ticker (leak test: transientCallbackCount back to ~0 after every switch).
//  - Taps during a transition were silently dropped → the queue.
//  - Something that finished off-frame (an async bake landing) bumps a ValueNotifier, never wake(): the world can sleep.
// PERF_LOG: put clock.debugTicks in the perf state string; a subscriber that never leaves shows up there by name.
import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';

typedef TickFn = void Function(double dt);

class WorldClock {
  Ticker? _ticker;
  Duration _last = Duration.zero;
  double _awakeFor = 0;
  final List<TickFn> _ticks = [];
  /// Bumped every frame while awake: CustomPaint(painter: P(repaint: clock.frame)).
  final ValueNotifier<int> frame = ValueNotifier(0);

  void attach(TickerProvider vsync) {
    _ticker?.dispose();
    _ticker = vsync.createTicker(_onTick);
  }

  /// Release the ticker (owner's dispose, before super.dispose).
  void detach() {
    _ticker?.dispose();
    _ticker = null;
  }

  /// Run [fn] every frame until the returned function is called. dt is in seconds, clamped to [1/240, 1/20].
  VoidCallback onTick(TickFn fn) {
    _ticks.add(fn);
    _start();
    return () => _ticks.remove(fn);
  }

  /// Keep frames coming for [seconds] (e.g. a one-off fade elsewhere).
  void wake([double seconds = .1]) {
    if (seconds > _awakeFor) _awakeFor = seconds;
    _start();
  }

  bool get awake => _ticker?.isActive ?? false;
  String get debugTicks => 'ticks=${_ticks.length} awakeFor=${_awakeFor.toStringAsFixed(2)} on=$awake';

  void _start() {
    final t = _ticker;
    if (t != null && !t.isActive) {
      _last = Duration.zero;
      t.start();
    }
  }

  void _onTick(Duration now) {
    final dt = _last == Duration.zero ? 1 / 60 : ((now - _last).inMicroseconds / 1e6).clamp(1 / 240, 1 / 20);
    _last = now;
    for (final f in List<TickFn>.of(_ticks)) {
      f(dt);
    }
    _awakeFor -= dt;
    frame.value++;
    if (_ticks.isEmpty && _awakeFor <= 0) _ticker?.stop();
  }

  void dispose() {
    detach();
    frame.dispose();
  }
}

/// [home] is the base view (always present, no hook). Other views register `hooks[v] = (on) async {...}`; hooks must be
/// safe to call repeatedly (enter twice, exit when already out).
class ViewSwitcher<V> extends ChangeNotifier {
  ViewSwitcher(this.home) : view = home;
  final V home;
  V view;
  final Map<V, Future<void> Function(bool on)> hooks = {};
  bool _switching = false;
  V? _queued;
  bool get switching => _switching;

  /// Don't await this before pumping frames in tests (the hooks animate on the clock; awaiting first hangs the test).
  Future<void> show(V v) async {
    if (_switching) {
      _queued = v;
      return;
    }
    if (v == view) return;
    _switching = true;
    try {
      final cur = hooks[view];
      if (view != home && cur != null) await cur(false);
      view = v;
      notifyListeners();
      final next = hooks[v];
      if (v != home && next != null) await next(true);
    } finally {
      _switching = false;
    }
    final q = _queued;
    _queued = null;
    if (q != null && q != view) await show(q as V);
  }
}
