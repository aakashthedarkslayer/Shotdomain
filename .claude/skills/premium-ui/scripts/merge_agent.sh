#!/bin/bash
# 3-way merge of one parallel agent's work into the main project.
# Usage: merge_agent.sh <base-dir> <main-dir> <agent-dir>
#   base  = untouched snapshot taken when the agents were launched
#   main  = the real project (already holding earlier merges)
#   agent = the agent's isolated copy
# Prints TAKE / NEW / MERGED / CONFLICT per file; conflicts leave standard markers in main.
set -u
[ $# -eq 3 ] || { echo "usage: $0 <base> <main> <agent>"; exit 2; }
# resolve to absolute paths (the script cd's into the agent dir, so relative paths used to merge nothing)
BASE=$(cd "$1" && pwd) || exit 1; MAIN=$(cd "$2" && pwd) || exit 1; AG=$(cd "$3" && pwd) || exit 1
cd "$AG" || exit 1
conflicts=0
while IFS= read -r f; do
  f=${f#./}
  if [ ! -f "$BASE/$f" ]; then
    if [ -f "$MAIN/$f" ] && ! cmp -s "$MAIN/$f" "$AG/$f"; then
      echo "NEW-BOTH  $f"
      git merge-file -L main -L base -L agent "$MAIN/$f" /dev/null "$AG/$f" || conflicts=$((conflicts+1))
    else
      mkdir -p "$MAIN/$(dirname "$f")"; cp "$AG/$f" "$MAIN/$f"; echo "NEW       $f"
    fi
  elif ! cmp -s "$BASE/$f" "$AG/$f"; then
    if cmp -s "$BASE/$f" "$MAIN/$f"; then
      cp "$AG/$f" "$MAIN/$f"; echo "TAKE      $f"
    elif git merge-file -L main -L base -L agent "$MAIN/$f" "$BASE/$f" "$AG/$f"; then
      echo "MERGED    $f"
    else
      echo "CONFLICT  $f"; conflicts=$((conflicts+1))
    fi
  fi
done < <(find . -type f \
  \( -path './lib/*' -o -path './test/*' -o -path './shaders/*' -o -path './assets/*' \
     -o -path './integration_test/*' -o -path './test_driver/*' -o -path './src/*' -o -path './app/*' \
     -o -path './public/*' -o -path './components/*' -o -path './styles/*' \
     -o -name pubspec.yaml -o -name package.json -o -name AndroidManifest.xml \) \
  ! -path '*/build/*' ! -path '*/node_modules/*' ! -path '*/.next/*' ! -name '*.lock' ! -name 'package-lock.json')
echo "conflicts: $conflicts"
[ "$conflicts" -eq 0 ]
