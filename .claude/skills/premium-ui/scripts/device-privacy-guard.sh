#!/bin/bash
# PreToolUse (Bash) hook: never capture a user's PHYSICAL phone screen without asking.
# Screenshots and recordings of a personal phone can expose private apps and messages.
# Emulators/simulators are allowed. To proceed on a real device after the user agreed,
# add the marker "# user-approved-capture" to the command.
command -v jq >/dev/null || exit 0
cmd=$(jq -r '.tool_input.command // empty')
[ -n "$cmd" ] || exit 0
echo "$cmd" | grep -qE 'screencap|screenrecord' || exit 0
echo "$cmd" | grep -q 'user-approved-capture' && exit 0
# Allowed: adb targets an emulator (-s emulator-NNNN).
if echo "$cmd" | grep -qE 'adb +(-s +emulator-[0-9]+)'; then exit 0; fi
cat >&2 <<'EOF'
device-privacy-guard: this command would capture a phone screen that may be the user's personal device
(it could be showing private apps or messages). Ask the user first. If they agree, re-run it with the
comment "# user-approved-capture" appended. Emulators (adb -s emulator-NNNN) are always allowed.
EOF
exit 2
