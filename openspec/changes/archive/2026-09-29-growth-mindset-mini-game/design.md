# Design

## Context

See proposal.md for motivation and the spec in `specs/growth-mindset-game/spec.md` for behavior. The shell (`src/App.tsx`) mounts the `component` of the current slot only after the player presses "Mulai game". It passes `onComplete`, `onCancel`, and `onError`. `onCancel` and `onError` return the player to the stage briefing screen, which is the "menu" in this design, without points. `completeStage` in `src/journey.ts` only accepts a validated result for the current value. Nothing replays earlier stages.

Relevant constraints:
- The app is React 19 + TypeScript (strict). `tsconfig.app.json` has no `allowJs`.
- Vitest runs in Node by default, and only `src/App.test.tsx` is mapped to jsdom.
- Design tokens (`--growth-mindset`, `--ink`, `--paper`, `--line`, and `--display-font`, which is Barlow Condensed) come from `src/styles.css`.

## Goals / Non-Goals

**Goals:**
- Write the gameplay as a framework-free DOM engine that can be tested in isolation.
- Keep scoring and the pass gate as pure functions with boundary tests.
- Touch only `src/games/growth-mindset/` plus the slot entry in `src/games/index.ts`.

**Non-Goals:**
- Any change to the shell UI, the journey, the leaderboard API behavior, or the server runtime. The one shared-code change is the behavior-neutral registry split in decision 10.
- Replaying earlier stages, a global pass mark for other values, audio, and mobile/touch tuning.

## Decisions

1. **Vanilla DOM engine plus a thin React adapter.** `engine.ts` builds its own DOM with `document.createElement` and native listeners. It exposes `mountGrowthGame(root, { onComplete, onCancel, onError, random? }) → { destroy() }`. `GrowthMindsetGame.tsx` only renders a `<div ref>`, mounts the engine in `useEffect`, and calls `destroy()` on cleanup.
   - *Why:* the user asked for pure HTML/JS, but the shell only accepts a `PlayableGame` React component.
   - *Alternative:* writing the whole game in React JSX was rejected because it does not match the request. Loading a standalone `.html` in an iframe was rejected because it adds postMessage plumbing and breaks shared styles and focus.

2. **TypeScript for the engine, not `.js`.** Engine code is plain DOM code written in `.ts` so that `npm run typecheck` covers it without enabling `allowJs` globally. It uses no framework or library, so the runtime output is plain JavaScript.

3. **Pure modules for rules.** `scoring.ts` exports:
   - `LEVELS`, holding the lengths `[3,4,4,5,6]` and the points `[15,18,20,22,25]`
   - `PASS_SCORE = 65`
   - `ROUND_MS = 20000`
   - `STEP_MS = 350`
   - `scoreRound(clearedLevels, bestCorrect)`, which returns an integer clamped to 0-100
   - `isPassing(score)`

   Tests exercise these boundaries directly (0, 61, 64/65, 100).

4. **One state machine per round.** The phases are `briefing → showing → input → (lesson → showing) → … → result(pass|fail)`. Each round owns a single `deadline = now + ROUND_MS`.
   - A 100 ms `setInterval` updates the timer and ends the round when `now >= deadline`.
   - Pattern display uses chained `setTimeout`.
   - All timers are tracked and cleared on phase change, retry, and `destroy()`.
   - Using `setTimeout`/`setInterval` and `Date.now()` rather than `requestAnimationFrame` keeps behavior deterministic under `vi.useFakeTimers()`.

5. **Single-outcome guard inside the engine.** A `reported` flag wraps the three callbacks. After any outcome, input is ignored and further calls are no-ops. The shell also validates results, but the game still must not double-report.

6. **The pass gate lives in the engine's result phase.**
   - Pass: the game renders "Lanjut" (Enter), which calls `onComplete({ valueId: 'growth-mindset', score })`.
   - Fail: the game renders "Coba lagi" (Enter), which restarts a round in place with no callback, and "Kembali ke menu" (Esc), which calls `onCancel()`.
   - This enforces the 65 mark without touching `journey.ts` or `contract.ts`.

7. **Injectable randomness.** `random` defaults to `Math.random`. Tests pass a seeded function so patterns are predictable.

8. **Styling.** `growth-mindset.css` is imported by the adapter. Every selector is scoped under `.gm-game`, and it uses only shell CSS variables and the 4/8/12/16/24/32px spacing. The sprout is built from CSS/SVG shapes created in the engine. `@media (prefers-reduced-motion: reduce)` disables transitions. Feedback pairs color with ✓/✗ glyphs and text labels.

9. **Tests.** Engine and adapter tests declare `// @vitest-environment jsdom` in the file. This avoids changing the shared `vitest.config.ts`.

10. **Component-free value order for the server.** The server imports `src/leaderboard.ts`, which read `games` from `src/games/index.ts`. Once that registry holds a React component, the server's tsconfig (no JSX/DOM) and tsup bundle pull in React, the engine, and CSS.
    - The ordered `valueIds` and the `ValueId` type move to `src/games/slots.ts`, a module with no dependencies.
    - `contract.ts`, `leaderboard.ts`, and `server/app.test.ts` read the order from `slots.ts`. The UI keeps using `games` from `index.ts`, which types each slot `id` as `ValueId`.
    - `registry.test.ts` asserts that `games` ids equal `valueIds`, and that a slot has a component and briefing if and only if it is available.
    - *Alternatives:* adding `jsx`/DOM to `tsconfig.server.json` was rejected because it bundles UI code into the server. Leaving the game unregistered was rejected because the owner wants it playable.

## Risks / Trade-offs

- [Scoring 65 in 20 seconds may be too hard or too easy for real players] → All tuning numbers are constants in `scoring.ts`. Check them during manual review at 1280×720 and adjust them before registering the slot. Tests reference the constants.
- [Timer drift from `setInterval` under a busy tab] → Remaining time is always computed from `deadline - Date.now()`, not by counting ticks.
- [Keyboard listener conflicts with the shell] → Listen on the game root rather than `window`, focus the root on mount, and call `preventDefault` only for handled keys while the game is mounted.
- [Failing players cannot finish the journey] → This is intended. "Coba lagi" gives unlimited retries, so the journey can always be completed.

## Migration Plan

This is an additive change. Rollback means setting the slot back to `available: false` and removing `component`/`briefing` in `src/games/index.ts`.
