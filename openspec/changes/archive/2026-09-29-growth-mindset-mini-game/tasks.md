# Tasks

## 1. Scoring rules

- [x] 1.1 Create `src/games/growth-mindset/scoring.ts` with `LEVELS` (lengths 3,4,4,5,6; points 15,18,20,22,25), `ROUND_MS = 20000`, `STEP_MS = 350`, `PASS_SCORE = 65`, `scoreRound(clearedLevels, bestCorrect)` (integer, clamped 0-100), and `isPassing(score)`. Verify with `npm run typecheck`.
- [x] 1.2 Add `scoring.test.ts` covering scores 0, 15, 61 (levels 1-3 cleared + 2/5 on level 4), 100, and the clamp. Also cover `isPassing` at 64 (fail) and 65 (pass). Verify with `npm test`.

## 2. Vanilla DOM engine

- [x] 2.1 Implement `engine.ts`, which exports `mountGrowthGame(root, { onComplete, onCancel, onError, random? })` returning `{ destroy() }`. It covers:
  - the briefing screen with "Mulai" (Enter/Space) and "Keluar" (Esc)
  - pattern display that ignores input while showing
  - the input phase with arrow keys, WASD, and 4 on-screen buttons
  - the level-clear sprout growth
  - timing: one 20 s deadline, round end on time-out or after level 5, and tracked timers cleared by `destroy()`

  Verify with `npm run typecheck`.
- [x] 2.2 Add the mistake-as-lesson flow to `engine.ts`. A wrong input marks the position with ✗ and a lesson text, replays the same pattern, restarts input from arrow 1, and keeps `bestCorrect`. Verify with an engine test (2.5).
- [x] 2.3 Add the result phase with the 65 pass gate and a single-outcome guard:
  - Pass: "Lanjut" calls `onComplete({ valueId: 'growth-mindset', score })` once.
  - Fail: show the score and target 65, "Coba lagi" starts a fresh round, and "Kembali ke menu" calls `onCancel()`.
  - Esc: calls `onCancel()`.
  - Internal errors: call `onError`.

  Verify with an engine test (2.5).
- [x] 2.4 Create `growth-mindset.css` with all selectors scoped under `.gm-game`, using shell CSS variables, 4-32px spacing, visible `:focus-visible` rings, ✓/✗ plus text feedback, and a `prefers-reduced-motion` override that disables transitions. Verify it by manual review at 1280×720 and 1440×900.
- [x] 2.5 Add `engine.test.ts` (`// @vitest-environment jsdom`, fake timers, seeded `random`) covering:
  - the timer stays idle before start
  - input during display is ignored
  - keyboard and button input are equivalent
  - a wrong input replays the pattern and keeps the score
  - a perfect run reports 100 via "Lanjut"
  - a time-out with a score under 65 reports nothing and offers "Coba lagi" and "Kembali ke menu"
  - "Coba lagi" resets the round to level 1 with 20 s
  - "Kembali ke menu" and Esc call `onCancel`
  - only one outcome is ever reported
  - `destroy()` clears timers

  Verify with `npm test`.

## 3. Shell adapter and registration

- [x] 3.1 Create `GrowthMindsetGame.tsx` (a `PlayableGame`). It renders a `<div ref>`, imports the CSS, mounts the engine in `useEffect` with `context.valueId` callbacks, and calls `destroy()` on unmount. Export it from `src/games/growth-mindset/index.ts`. Verify with `npm run typecheck`.
- [x] 3.2 Add `GrowthMindsetGame.test.tsx` (jsdom). It checks that the component mounts, that a failing round does not call `onComplete`, and that unmounting clears timers. Verify with `npm test`.
- [x] 3.3 In `src/games/index.ts`, update only the `growth-mindset` slot: add `component: GrowthMindsetGame`, `available: true`, and briefing "Ingat pola panah dan ulangi urutannya. Salah? Pelajari dan coba lagi — raih minimal 65 poin dalam 20 detik." Verify that the existing `registry.test.ts`, `contract.test.ts`, `journey.test.ts`, and `App.test.tsx` still pass.
- [x] 3.4 Update `src/games/growth-mindset/README.md` with:
  - the OpenSpec change name
  - controls
  - the scoring rubric and the 65 pass gate, including retry and menu behavior
  - an asset manifest stating that all visuals are original code-drawn shapes with no external files, and that fonts come from the shell
  - a ticked checklist

  Verify the README matches the spec.
- [x] 3.5 Add a component-free `src/games/slots.ts` (ordered `valueIds`, `ValueId`). Point `contract.ts`, `leaderboard.ts`, and `server/app.test.ts` at it, have `src/games/index.ts` re-export `ValueId`, and update `registry.test.ts`: ids equal `valueIds`, and component/briefing are present if and only if the slot is available. Verify that `npm run typecheck` passes for both the app and server configs and that the existing tests still pass.

## 4. Integration checks

- [x] 4.1 Run `npm run typecheck`, `npm test`, and `npm run build`, and verify all three pass.
- [x] 4.2 Run `npm run dev` and play through Integrity → Growth Mindset (or directly, if earlier slots are unavailable). Check:
  - a score below 65 keeps the stage current and Customer Focus locked
  - a score of 65 or more advances the journey
  - keyboard focus is visible
  - reduced motion is respected
  - there is no horizontal clipping at 1280×720 and 1440×900
- [x] 4.3 Verify `git diff --stat` shows changes only under `src/games/growth-mindset/`, in the registry-split files from 3.5 (`src/games/index.ts`, `src/games/slots.ts`, `src/games/contract.ts`, `src/games/registry.test.ts`, `src/leaderboard.ts`, `server/app.test.ts`), and in this OpenSpec change.
