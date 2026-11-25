# Building in parallel with agents

Use this when there are 2+ independent pieces of work, or when the user asks for speed. It's how Atelier shipped five signature features at once.

## 1. Decompose by FILE OWNERSHIP, not by idea
- Each agent owns new files (`lib/desk/basket.dart`, `src/features/lamp/*`) plus SMALL, localized hooks in shared files.
- **Contract first.** When pieces must talk to each other (motion math ↔ renderer ↔ screen), write the shared interface yourself *before* launching: data classes, function signatures with doc comments, and stubs that throw. Every agent codes against the same contract.
- Give each agent's UI its own zone. For example: the lamp chain owns the top-right, the basket the bottom-right, gather owns pinch and long-press on empty desk.

## 2. Choose the model by difficulty (pass `model:` explicitly)
| Work | Model |
|-|-|
| Rendering architecture, shaders, mesh deformation, physics plus gestures, multi-system features, design critique | **opus** |
| Well-specified math with tests, wiring against a clear contract, contained widget features (wet ink, persisted state, editor tweaks) | **sonnet** |
| Mechanical work: test harnesses, config, boilerplate, renames, running checks | **haiku** |

## 3. Isolate every agent
```bash
S=<scratchpad>
for n in base wt-a wt-b wt-c; do rsync -a --exclude build --exclude .dart_tool --exclude ios/Pods \
  --exclude node_modules --exclude .next --exclude android/.gradle ./ $S/$n/; done
```
- `base` is the merge baseline: never edited.
- Each agent works ONLY in its own `wt-*` and is told never to touch the main project or its siblings.
- No agent uses the shared phone or the Playwright MCP browser; the orchestrator owns those.
- For HTML/web work, each agent screenshots in its own headless Chrome with `scripts/shot.js`: scripted clicks, drags and typing, mid-animation shots and element close-ups. It's parallel-safe and needs `npm i puppeteer-core`. Both tools kill their Chrome on timeout or signal. An orphaned headless Chrome once stopped the user's own Chrome from opening, because macOS sees the app as already running. If Chrome won't open, run `pkill -f puppeteer_dev_chrome_profile`.

## Parallel concept previews (the 4-direction page)
1. Work in a folder inside the project (e.g. `design/directions/`), never a temp folder: a reboot wiped a whole preview round once. Copy `templates/examples/directions-shell.html` and `scripts/build_directions.py` into one folder, then edit the tab names and the sample data.
2. Launch one agent per direction, choosing models by difficulty: art, 3D and generative work → opus; porting an existing concept → sonnet. Each agent writes only `dir-<x>.html`, which is a scoped `<style>`, a `<section id="dir-x" class="direction">` with 3 phones and a spec panel, and `Directions.x = {mount, show, hide}`.
3. Each agent self-checks: `python3 build_directions.py out.html --local --only x`, then `node shot.js out.html x steps.json outdir`, reads the PNGs and iterates.
4. Merge: `python3 build_directions.py page.html`, take one combined shot of all tabs, run one `ui-critic` pass across all 4, then publish.

Atelier's round took about 25 minutes wall-clock for 4 directions.
- Copies are about 900MB each for Flutter. Delete them as soon as they're merged (a full disk silently stalls builds and tests).

## 3b. Copies or disjoint files?
- Agents that build/test or touch shared files: isolated copies + baseline (above).
- Agents that each write only their own new files and run no builds (preview pages, docs, scripts): work in place on disjoint files, no copies, no merge. See fast-orchestration.md.
- Write the contract first: [../templates/orchestration/CONTRACT.template.md](../templates/orchestration/CONTRACT.template.md). Brief from [../templates/orchestration/agent-brief.template.md](../templates/orchestration/agent-brief.template.md); keep a pause/resume file from PROGRESS.template.md.

## 3c. Agents spawn sub-agents
Each feature agent runs a `ui-critic` on its own PNGs (read-only) and a verifier (`perf-verifier`: analyze + its own tests + release build) while it keeps building. One writer per file: sub-agents only report. Agents run ONLY their scoped tests; the orchestrator runs the full suite once after merging, and measures on the device (`scripts/device_perf.sh`) then SendMessages the numbers to the owning agent.

## 4. The brief (use the `ui-feature-agent` type; it carries the standing rules)
Include:
- the goal and why it matters (the bar)
- the exact folder
- the files it may edit or create
- the contract or APIs it can rely on
- what the other agents are building, so it can avoid their zones
- a token block name like `// <feature>-agent tokens`
- verification gates: analyze, tests (name the tests you want), a release build, and rendered PNGs of the feature that it must look at and iterate on
- the report format

### Brief skeleton (fill in every line; the brief is the agent's only context)
```
You are adding <FEATURE> to "<App>", a <platform> app where <one-line world>. The bar is Apple-Design-Award level.

FEATURE: <what the user sees and feels, step by step, with the haptics and the exact gestures>.
<Numbered behaviours, including reduced motion, semantics and persistence.>

WORK ONLY in: <scratchpad>/wt-<feature>. Never touch <main path> or sibling folders.
Files you own: <new files>. Small hooks allowed in: <shared files>. Tokens: append `// <feature>-agent tokens` at the END of <tokens file>.
Contract you can rely on: <file + signatures>. (In your copy it may be a stub: use fakes in tests.)
Other agents, in parallel: <A in zone X>, <B in zone Y>. Keep clear of their zones.
Read first: CLAUDE.md, the premium-ui skill, <specific files>.

VERIFY: analyze clean; tests (<the tests you want>); release build; render <states> to PNGs, look at them, iterate, then delete the temporary test. No devices or browsers.
REPORT: files and shared hunks, design choices, MERGE markers and hooks, PNG paths with an honest verdict, verification output, cut corners.
```

## 5. Merge with 3-way merges
```bash
bash <skill>/scripts/merge_agent.sh <base-dir> <main-dir> <agent-dir>
```
- Takes files that only the agent changed, copies in new files, and `git merge-file`s files both sides changed.
- Expected conflict: several agents appending token blocks at the end of the tokens file. Never line-merge tokens: keep all blocks (or swap a whole block), and check that each class still has its closing brace.
- ALWAYS pass absolute paths to merge_agent.sh.
- After every merge: run analyze and the full tests with a timeout, then fix.
- After all merges: one combined visual pass in the browser or on a device, then the critic.

## 6. While agents run
Give the user one-line statuses. Merge each agent as it finishes, rather than waiting for all of them. If an agent is stopped mid-way, don't merge its partial work; ask the user what to do.
