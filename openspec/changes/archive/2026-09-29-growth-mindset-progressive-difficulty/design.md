# Design

## Context

See proposal.md for motivation and `specs/growth-mindset-game/spec.md` for the new level curve. Today these rules live in `src/games/growth-mindset/`:
- `scoring.ts` exports `LEVELS` (`{ length, points }`) and one global `STEP_MS = 350`.
- `engine.ts` uses `STEP_MS` in `showPattern` and writes `TAHAP n / 5` into `.gm-level`.
- `engine.test.ts` and `GrowthMindsetGame.test.tsx` advance fake timers by `length * STEP_MS`.

## Goals / Non-Goals

**Goals:**
- Keep all tuning in one table so balance can be changed without touching engine logic.

**Non-Goals:**
- No per-level input time limit, and no change to the 20 s round, points, partial credit, the pass gate, controls, or the shell contract.

## Decisions

1. **Per-level `stepMs` and `hint` in `LEVELS`, removing `STEP_MS`.** Each entry becomes `{ length, points, stepMs, hint }`.
   - `showPattern` reads `LEVELS[level].stepMs` for both the first display and lesson replays.
   - *Alternative:* a formula such as `550 - level * 72` was rejected. An explicit table is easier to read and to tune.
2. **Guard the curve with a test.** A `scoring.test.ts` case asserts that `stepMs` strictly decreases and `length` never decreases. It also asserts that the total display time (Σ length × stepMs ≈ 8.5 s) stays under half of `ROUND_MS`, so the round keeps enough input time.
3. **Hint in the existing label.** `.gm-level` shows `TAHAP n / 5 · HINT`. No new element or layout change is needed. The HUD column is already flexible (`1fr`).
4. **Tests use the table.** The test helpers change from `length * STEP_MS` to `length * stepMs` for the current level, so future tuning does not break them.

## Risks / Trade-offs

- [260 ms on level 5 may be too fast to read] → It is still above the ~250 ms threshold commonly used for a readable flash. It can be tuned in one line.
- [A slower level 1 uses more of the 20 s] → Level 1 display rises from 1.05 s to 1.65 s. Total display stays about 8.5 s, and the curve test enforces the half-round cap.
