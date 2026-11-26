# <App> — CONTRACT (written by the orchestrator BEFORE any agent launches)

Every agent codes to this file. If the contract must change, the orchestrator changes it and SendMessages every agent. Agents never edit it.

## 1. World in one paragraph
<The metaphor/material, the camera or coordinate system, the light.>

## 2. Shared interface (lives in code: <path>, with throwing stubs)
```
<enums, shared state object, hook signatures with doc comments>
```
- Hooks the orchestrator owns (agents only call them, null-safely): <list>.
- Hooks each agent registers: <agent -> hook>.

## 3. Zones (one writer per file)
| Agent | Owns (new files) | May hook (small, marked) | Screen zone / gestures | Model |
|-|-|-|-|-|
| A | lib/a/** | screen.dart `// A hook` | <zone> | opus |
| B | lib/b/** | | <zone> | sonnet |
Orchestrator-only files: <screen.dart, world.dart, pubspec.yaml, tokens file merge, CONTRACT, PROGRESS>.

## 4. Tokens
Each agent appends ONE block at the END of the tokens file: `// <AGENT>-agent tokens`. Never edit another block. Merge = keep all blocks / swap whole blocks, never line-merge.

## 5. Quality gates (per agent) and budgets
- Own scoped tests only; analyze clean; release build once at the end.
- Render PNGs (both themes / every time of day), look, iterate.
- Perf budget (device, release): raster p50 <= <N> ms, p90 <= <N> ms, jank <= <N>%, idle = 0 frames.
- Reduced motion, semantics/ARIA, text scaling.

## 6. Parity checklist (evolve, never downgrade)
Parity is about features and flows, not layout: the visual base may change completely.
| Existing feature | Where it lives now | New home / replacement | Verified |
|-|-|-|-|

## 7. Merge order and tooling
base: <abs>/.wt/base (never edited). Agents: <abs>/.wt/<name>. Merge with absolute paths: `bash <skill>/scripts/merge_agent.sh <base> <main> <agent>`. Then analyze, full tests once, release build, device session (`scripts/device_perf.sh`), `ui-critic` on real captures.
