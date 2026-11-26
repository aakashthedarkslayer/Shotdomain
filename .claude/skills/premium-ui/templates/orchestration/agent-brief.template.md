# Agent brief template (spawn as `ui-feature-agent`, pass `model:` by difficulty)
The brief is the agent's ONLY context. Fill every line; use absolute paths.

---
## <NAME> (<opus|sonnet|haiku>)
You are the <NAME> agent building <FEATURE> for "<App>", a <platform> app where <one-line world>. The bar is Apple Design Award: someone watches it for ten seconds and falls in love. Ordinary is a failure.

WORK ONLY in: <abs>/.wt/<name> (isolated copy; baseline <abs>/.wt/base is never edited). Never touch <abs main> or sibling folders. First run the dependency install (`flutter pub get` / `npm ci`).
Read first: CONTRACT.md (all), CLAUDE.md, the premium-ui skill, <specific files>. Reference to match or beat: <web page / PNG paths>.

YOU OWN: <new files/folders>. Small marked hooks allowed in: <shared files, with the marker text>. Tokens: append ONE block `// <NAME>-agent tokens` at the END of <tokens file>; never line-edit others.
Others in parallel (stay out of their zones): <A: zone>, <B: zone>.

VISIBLE IN A STILL (required, before any behaviour work): <what a no-tap screenshot of the rest state will show that the previous round's did not: layout, composition, type scale, imagery, colour>. This must match the static mock the user approved. Never write "fork vN and go deeper" as the whole instruction: a fork keeps the old layout, and motion alone reads as "nothing changed". If this line can't be filled in, don't spawn the agent.

BUILD:
1. <Behaviour, step by step: gestures, haptics, springs, states.>
2. Performance: <budget>. Bake static art, no per-frame blur or saveLayer, loops only while something moves.
3. Reduced motion, semantics/ARIA, text scaling, every state designed.

SUB-AGENTS (you may spawn): a `ui-critic` on your PNGs (read-only; you apply fixes), and a haiku/sonnet verifier for analyze + your scoped tests + release build. Only you edit your files.

VERIFY: analyze clean; ONLY your tests (<names>); render <states / themes / mid-animation> to PNGs, Read them, iterate >= 3 rounds, delete the temporary test and superseded PNGs; release build once at the end. No phone, emulator or browser MCP: the orchestrator measures on the device and SendMessages you numbers (react to them).
TIME BOX: <N> min. If blocked or past budget, stop and report what works.
REPORT (<= 300 words): old vs new rest-state stills side by side (paths) and what visibly changed, files + shared hunks, hooks/MERGE markers/dispose wiring, token block name, PNG paths with an honest First glance/Wow /10, which perf claims are measured (device) vs unmeasured (tests only), verification output lines, corners cut.
