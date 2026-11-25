// SFX POOL: short overlapping UI sounds (ticks, clacks, pops) with audioplayers 6.x that never crash, never leak frame
// callbacks and never pause the user's music.
// WHEN: any app with sound effects that can overlap (detent ticks during a spin, clinks on a swinging chain).
// DEVICE LESSONS (Softbound, Android 14):
//  - Default MediaPlayer mode crashed (IllegalStateException in prepareAsync) when ticks overlapped → PlayerMode.lowLatency
//    (Android SoundPool), built for short overlapping effects.
//  - audioplayers' default FramePositionUpdater schedules a frame callback EVERY frame while a player "plays"; SoundPool
//    never reports completion, so each play left a never-ending callback (240+ piled up, the app froze). Each player gets
//    a no-op PositionUpdater, and we run our own round-robin pool (AudioPool creates players we can't configure).
//  - Clicks must not take audio focus: focus none + usage game + sonification (iOS: ambient).
//  - Under PERF_LOG every play prints `SFX name …` so a sound firing every frame shows up next to the frame numbers.
// Assets: assets/<dir>/<name>.<ext>, declared in pubspec. Generate them in code (WebAudio → WAV export), no stock packs.
import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';

class _NoPosition extends PositionUpdater {
  _NoPosition() : super(getPosition: () async => null);
  @override
  void start() {}
  @override
  void stop() {}
}

class SfxPool {
  SfxPool._();
  static final Map<String, List<AudioPlayer>> _pools = {};
  static final Map<String, int> _next = {};
  static bool muted = false;
  static bool _ready = false;
  /// Plays requested (counted even when silent): tests assert it stays flat when nobody touches the screen.
  static int requested = 0;
  /// PERF_LOG: extra context for the SFX log line (view, mode, gesture state).
  static String Function()? debugWhere;

  /// [voices]: name → how many may overlap (5 for a tick fired per detent, 2 for the rest).
  static Future<void> init(Map<String, int> voices, {String dir = 'sounds', String ext = 'wav'}) async {
    try {
      await AudioPlayer.global.setAudioContext(AudioContext(
        android: const AudioContextAndroid(
            audioFocus: AndroidAudioFocus.none, usageType: AndroidUsageType.game, contentType: AndroidContentType.sonification),
        iOS: AudioContextIOS(category: AVAudioSessionCategory.ambient),
      ));
      for (final MapEntry(key: name, value: n) in voices.entries) {
        final players = <AudioPlayer>[];
        for (var i = 0; i < n; i++) {
          final p = AudioPlayer()..positionUpdater = _NoPosition();
          await p.setPlayerMode(PlayerMode.lowLatency);
          await p.setReleaseMode(ReleaseMode.stop);
          await p.setSource(AssetSource('$dir/$name.$ext'));
          players.add(p);
        }
        _pools[name] = players;
      }
      _ready = true;
    } catch (_) {} // no audio (flutter test, emulator without sound): stay silent
  }

  /// Fire-and-forget.
  static void play(String name, {double gain = 1}) {
    requested++;
    if (const bool.fromEnvironment('PERF_LOG')) {
      debugPrint('SFX $name t=${DateTime.now().millisecondsSinceEpoch % 100000} ${debugWhere?.call() ?? ''}');
    }
    final pool = _pools[name];
    if (muted || !_ready || pool == null || pool.isEmpty) return;
    final i = (_next[name] ?? 0) % pool.length;
    _next[name] = i + 1;
    final p = pool[i];
    unawaited(() async {
      try {
        await p.stop();
        await p.setVolume(gain.clamp(0.0, 1.0));
        await p.resume();
      } catch (_) {}
    }());
  }

  static Future<void> dispose() async {
    for (final ps in _pools.values) {
      for (final p in ps) {
        await p.dispose();
      }
    }
    _pools.clear();
    _ready = false;
  }
}
