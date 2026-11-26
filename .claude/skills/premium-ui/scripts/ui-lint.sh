#!/bin/bash
# PostToolUse hook: flags generic or hard-coded UI in edited Flutter/web files.
# Opt-in per project: active only when "$CLAUDE_PROJECT_DIR/.premium-ui" exists.
# Exit 2 = feedback shown to Claude. Token/theme files and tests are exempt.
[ -n "${CLAUDE_PROJECT_DIR:-}" ] && [ -f "$CLAUDE_PROJECT_DIR/.premium-ui" ] || exit 0
command -v jq >/dev/null || exit 0
f=$(jq -r '.tool_input.file_path // empty')
[ -n "$f" ] && [ -f "$f" ] || exit 0
case "$f" in
  */test/*|*_test.dart|*.test.*|*.spec.*|*/__tests__/*|*/integration_test/*) exit 0 ;;
  */theme/*|*/tokens*|*tailwind.config*|*/styles/tokens*) exit 0 ;;
esac

hits=""
case "$f" in
  *.dart)
    hits=$(grep -nE \
      -e '\bColors\.[a-z]+(Accent)?\b' \
      -e '\bColor\(0x' \
      -e 'fontSize: *[0-9]' \
      -e 'Duration\(milliseconds' \
      -e 'Curves\.linear\b' \
      -e '\b(ListTile|Card|ElevatedButton|FloatingActionButton|CircularProgressIndicator)\(' \
      "$f" | grep -vE 'Colors\.transparent|// *lint-ok')
    advice="Use tokens (lib/theme/), custom components, skeletons instead of spinners." ;;
  *.css|*.scss)
    hits=$(grep -nE \
      -e ':[^;]*#[0-9a-fA-F]{3,8}\b' \
      -e ':[^;]*\brgba?\(' \
      -e 'font-size: *[0-9.]+(px|rem)' \
      "$f" | grep -vE '^\s*[0-9]+:\s*--|var\(--|/\* *lint-ok')
    advice="Use CSS custom properties from the tokens file (var(--...))." ;;
  *.tsx|*.jsx|*.vue|*.svelte)
    hits=$(grep -nE \
      -e "['\"]#[0-9a-fA-F]{3,8}['\"]" \
      -e "['\"]rgba?\(" \
      -e 'fontSize: *[0-9]' \
      -e 'duration: *[0-9]{2,}' \
      "$f" | grep -vE '// *lint-ok')
    advice="Use design tokens (CSS variables or tokens.ts), not literals." ;;
  *) exit 0 ;;
esac

[ -z "$hits" ] && exit 0
cat >&2 <<EOF
ui-lint (premium-ui): hard-coded or generic UI in $f
$hits
$advice Append "// lint-ok" to a line only if it is genuinely intentional.
EOF
exit 2
