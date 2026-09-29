# Tasks

## 1. Word Bank

- [x] 1.1 Add `src/games/integrity/scripts/generate-words.mjs` that reads `FOUNDRY_ENDPOINT` and `FOUNDRY_API_KEY`, calls the `gpt-5-mini` deployment on the Azure AI Foundry resource with a structured `{ aligned, violation }` schema, filters by format rules, and writes only `data/integrity-words.candidates.json`; verify that running without the key exits non-zero with a message naming each missing variable and writes no file, and that a run with the key produces the candidates file.
- [x] 1.2 Curate candidates into `src/games/integrity/words.json` (≥40 aligned, ≥30 violation, 1-2 words, ≤18 chars, no duplicates, no ambiguous entries) and add `words.test.ts` enforcing count, length, word-count, and cross-category duplicate rules; verify the test passes and fails when a duplicate or 19-character entry is added.
- [x] 1.3 Document in the Integrity README the generator command, model, generation date, reviewer, and review rules; verify the README states all four provenance fields.

## 2. Round and Scoring Logic

- [x] 2.1 Implement `scoring.ts` (`finalScore` = clamp(5·aligned − 5·violation, 0, 100)) with tests for 20/0 → 100, 1/4 → 0, 14/3 → 55, 0/0 → 0, and integer output; verify tests pass.
- [x] 2.2 Implement `round.ts` with seeded mulberry32 and `createRound(words, rng)` returning exactly 20 aligned + 12 violation distinct targets shuffled across 3 lanes with spawn offsets that let every target enter within about the first 19 s; verify tests for counts, no repeats, same-seed reproducibility, and pool-too-small error.

## 3. Engine

- [x] 3.1 Implement pure `engine.ts` (`createState`, `step(state, dtMs, input)`) covering the 25 s clock, the 50 ms delta cap, alternating lane directions, launcher movement (`moveTo`, held `moveBy`), clamped bounds, and the reduced-motion quantized clock; verify unit tests for time-out at exactly 25 000 ms, no input accepted after time-out, launcher clamped to 0..1, and reduced-mode positions changing only on 500 ms boundaries.
- [x] 3.2 Add projectiles, the 250 ms cooldown, lowest-lane-first hit detection, target removal, hit counters, running score, and feedback items to the engine; verify unit tests for two overlapping targets (only the lower one is hit), double fire within 250 ms (one card), aligned hit (+5), violation hit (−5), and escaped targets (no change).

## 4. Game Component and Art

- [ ] 4.1 Add `art.tsx` with original inline-SVG `EdcLauncher` and `CardProjectile` (no BRI logo, wordmark, or official card design) and `integrity.css` scoped under `.integrity-game` using shared tokens; verify with a visual check at 1280x720 and 1440x900 that target text is at least 18px and the HUD does not shift as the score changes.
- [x] 4.2 Implement `IntegrityGame.tsx` (`PlayableGame`) with briefing → playing → result phases, a rAF loop that is cancelled on phase change and unmount, pointer and keyboard mapping (Arrow/A/D, Space, Escape), a focusable play area with visible focus, non-color hit feedback, a fixed-width HUD, and a result summary with a single "Lanjut" button; add `IntegrityGame.test.tsx` (`// @vitest-environment jsdom`, fake timers, mocked rAF, seeded round) covering: no time elapses during briefing, keyboard-only play hits a target, Escape calls `onCancel` once with no completion, completion is called once with `{ valueId: 'integrity', score }` in range, unmount mid-round reports nothing, and an engine throw calls `onError`; verify tests pass.
- [x] 4.3 Update the Integrity README with the OpenSpec change name, entry point, controls, completion behavior, score rubric, and an asset manifest (EDC and card SVGs: author, "original, in-repo", no attribution required, usage); verify `registry.test.ts` still finds every required section.

## 5. Audio

- [x] 5.1 Add `src/games/integrity/assets/integrity-bgm.m4a` (provided, CC0) and `audio.ts` (lazy AudioContext created on start, master/music/effects gains, looping buffer music, synthesized fire/aligned/violation/countdown/end effects, localStorage mute under `integrity-game:muted` wrapped in try/catch, every call guarded so failures only disable sound, `stop()` that halts music and closes the context); add `audio.test.ts` with a stubbed AudioContext and localStorage verifying: nothing is created before start, mute persists and zeroes master gain, a missing AudioContext or a failed decode does not throw, and `stop()` stops music; verify tests pass.
- [x] 5.2 Wire audio into `IntegrityGame.tsx` (start music on round start; effects on fire, hit and countdown from state diffs; end jingle then stop on finish; stop on cancel and unmount) and add a mute button (icon + accessible label, visible in briefing and play, toggled by M key); extend `IntegrityGame.test.tsx` to verify M toggles the mute label, audio failure still completes the round with a valid score, and unmount stops audio; verify tests pass.
- [x] 5.3 Add the music track and the synthesized effects to the README asset manifest (title, author, source URL, CC0, no attribution required, usage, conversion notes); verify the manifest lists every audio asset.

## 6. Integration

- [x] 6.1 Register Integrity in `src/games/index.ts` (component, `available: true`, Indonesian briefing) and change `registry.test.ts` to assert the five ids in order and that `available` implies `component`; verify the full test suite passes and the shared-test change is called out for team review in the PR.
- [x] 6.2 Run `npm run typecheck`, `npm test`, and `npm run build`, then check that `dist/` contains no `api.openai.com` or `sk-` string; verify all commands succeed.
- [ ] 6.3 Manually play in the shell at 1280x720 with a pointer, keyboard-only, and with reduced motion enabled, confirming the stage completes, the next value is presented, and music, effects and mute work; record the outcomes in the PR description.
