#!/bin/bash
# Scripted adb perf session. Takes NO screen captures (the privacy guard stays happy).
# usage: device_perf.sh <package> <apk> <label> [options]
#   --swipe "x1 y1 x2 y2 ms"   gesture repeated (default "250 1400 900 1400 250"; use a vertical one for lists)
#   --tap "x y"                tap instead of swipe
#   --count N                  repetitions (default 6)      --gap S  seconds between gestures (default 1.5)
#   --boot S                   seconds to wait after launch (default 6)
#   --assert REGEX             a PERF line must match this (e.g. 'spin=[1-9]'), else exit 3:
#                              a gesture that changed nothing must not pass as "smooth"
#   --tag PERF                 logcat tag/prefix to condense (default PERF)
# App must be built with the opt-in frame logger (see references/flutter-device-performance.md).
# Bump the versionCode for every installed build, or install fails with VERSION_DOWNGRADE.
set -u
[ $# -ge 3 ] || { sed -n '2,13p' "$0"; exit 2; }
P=$1; APK=$2; LABEL=$3; shift 3
SW="250 1400 900 1400 250"; TAP=""; N=6; GAP=1.5; BOOT=6; ASSERT=""; TAG=PERF
while [ $# -gt 0 ]; do case $1 in
  --swipe) SW=$2; shift 2;; --tap) TAP=$2; shift 2;; --count) N=$2; shift 2;; --gap) GAP=$2; shift 2;;
  --boot) BOOT=$2; shift 2;; --assert) ASSERT=$2; shift 2;; --tag) TAG=$2; shift 2;;
  *) echo "unknown option $1"; exit 2;; esac; done

[ -f "$APK" ] || { echo "apk not found: $APK"; exit 2; }
adb get-state >/dev/null 2>&1 || { adb kill-server; adb start-server; sleep 2; }
adb get-state >/dev/null 2>&1 || { echo "no device (USB drops: try wireless debugging)"; exit 1; }
out=$(adb install -r "$APK" 2>&1) || {
  echo "$out" | grep -q VERSION_DOWNGRADE && { echo "install refused: versionCode lower than installed. Bump it (or uninstall, which wipes app data)."; exit 1; }
  adb kill-server; adb start-server; sleep 2
  adb install -r "$APK" >/dev/null 2>&1 || { echo "install failed twice: $out"; exit 1; }; }
adb shell am force-stop "$P"; adb logcat -c
adb shell monkey -p "$P" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep "$BOOT"
front(){ adb shell dumpsys activity activities | grep -m1 -E "topResumedActivity|mResumedActivity" | grep -q "$P"; }
done_n=0
for i in $(seq 1 "$N"); do
  front || { echo "app not in front: stop (never inject input into another app)"; break; }
  if [ -n "$TAP" ]; then adb shell input tap $TAP; else adb shell input swipe $SW; fi
  done_n=$i; sleep "$GAP"
done
sleep 2
echo "== $LABEL ($done_n/$N gestures)"
lines=$(adb logcat -d | grep -E "$TAG" | tail -10)
echo "$lines" | sed -E "s/.*($TAG n=[0-9]+ jank=[0-9]+).*(raster [^|]*)(.*)/\1 \2\3/"
if [ -n "$ASSERT" ]; then
  echo "$lines" | grep -Eq "$ASSERT" || { echo "ASSERT FAILED: no $TAG line matches /$ASSERT/ - the gesture changed nothing, numbers are meaningless"; exit 3; }
  echo "assert ok: /$ASSERT/"
fi
[ -n "$lines" ] || { echo "no $TAG lines: build without PERF_LOG?"; exit 4; }
