# Fast orchestration (playbook; lessons from Softbound's multi-view build)

The user's main complaint was slowness. Slowness came from: serial work, full test suites run by every agent at once, merge collisions, and device debugging done by guessing. This is the fix. Extends parallel-agents.md (decomposition, models, isolation). Templates: [../templates/orchestration/](../templates/orchestration/) (CONTRACT, agent brief, PROGRESS). Worked examples: `softbound/CONTRACT.md`, `softbound/agent-briefs.md`.

## The loop, with wall-clock targets
0. **Approved paradigm, then approved look (before any build agent).** First the cheap paradigm sweep (SKILL.md §1.0: 6 rough single-screen sketches of new mechanics, ~20 min each, sketch agents in parallel); the user picks one. Kora v3.2 lesson: 4 full directions at 70–90 min each were all themed skins on a store grid, 7/7, "worst final result". Then the look: Speed is wasted if the agents deepen the wrong look. Ship a static mock of the new rest-state screens and get the user's OK. Every brief then names what will look different in a still (`VISIBLE IN A STILL` in the brief template). After the round, put old and new rest stills side by side before showing the user. Kora store lesson: hours of parallel work on motion and plumbing over an inherited layout got "nothing changed, why did this take so long?"
1. **Contract first (10-15 min).** Fill `CONTRACT.template.md`: write the shared interface into the main code (enums, shared state, hook signatures with doc comments, throwing stubs, `// X hook` markers where each layer attaches). Agents never wait on each other because they code to the same signatures.
2. **Split by owned files: one writer per file.** Each agent owns NEW files/folders. Shared files (screen, world, pubspec) are orchestrator-owned; agents get small marked hooks only.
3. **Isolation choice**
   - *Isolated copies* (`.wt/<name>/` + never-edited `.wt/base/`, merged 3-way) when agents run builds/tests (they would trample each other's `build/`, `.dart_tool`) or touch a few shared files. Default for Flutter.
   - *Disjoint files in place* (no copies) when agents only write files nobody else writes and run no builds (HTML preview directions, docs, scripts). Zero merge cost, zero 900MB copies.
4. **Launch all agents in ONE message**, `model:` by difficulty (opus: rendering/shaders/physics/multi-system; sonnet: specified contained work; haiku: mechanical, test harnesses, running checks).
5. **Agents spawn sub-agents instead of doing everything serially:** a `ui-critic` reviewer on their PNGs (read-only) and a verifier (analyze + their own tests + release build; see `agents/perf-verifier.md`). Sub-agents report; only the owning agent edits.
6. **Agents run ONLY their own scoped tests.** The full suite (~13 min in Softbound) run concurrently by several agents slows everyone. The orchestrator runs it ONCE after the merge.
7. **The orchestrator uses the wait time:** measure the last merged build on the device (`scripts/device_perf.sh`, PERF_LOG) in parallel, then **SendMessage** the numbers (raster p50/p90, jank, which layer) to the agent owning the slow layer. Agents never share the phone.
8. **Merge each agent as it finishes**, not all at the end (`scripts/merge_agent.sh`), analyze after each.
9. **After the last merge:** analyze, full tests once, release build, device session per key interaction x theme/time-of-day, then `ui-critic` on real captures (with permission).

## Merging
- `bash <skill>/scripts/merge_agent.sh <base> <main> <agent>` with ABSOLUTE paths (it resolves them itself since v3; before, relative paths silently merged nothing). Read the TAKE/NEW/MERGED/CONFLICT list; hand-check shared hook files (screen.dart gets hooks from several agents).
- **Tokens are never line-merged.** Each agent appends one `// <feature>-agent tokens` block at the END; the orchestrator keeps all blocks or swaps a whole block. A line merge of the tokens file always collides.
- Delete `.wt/*` copies as soon as merged (full disk silently stalls builds).

## Time-boxing, stopping, asking
- Give every brief a time box (typical: 25-40 min for opus features, 10-15 for sonnet). At the box, ask the agent for its status (SendMessage) instead of waiting silently.
- Stop an agent (TaskStop) when: it loops on the same failure 3 times, it blocks on something the contract should have answered (fix the contract, relaunch), or the direction was dropped. Never merge partial work blindly; ask the user.
- Once a usable version is shipped, **ask the user before starting another critic/fix round.** Rounds cost 30+ minutes; the user decides if they're worth it.
- Between steps give the user one short status line. Keep PROGRESS.md current so a pause/resume costs nothing.

## Device measurement is part of "done"
Never call UI work done without device numbers (raster p50/p90, jank) for the key interactions in every theme/time-of-day. Tests only see CPU; raster (GPU) cost shows only on the phone. Use `device_perf.sh ... --assert 'spin=[1-9]'` so a gesture that changed nothing cannot pass as smooth. Bump versionCode each install. See flutter-device-performance.md.
