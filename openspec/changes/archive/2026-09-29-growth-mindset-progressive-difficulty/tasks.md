# Tasks

## 1. Level curve

- [x] 1.1 In `src/games/growth-mindset/scoring.ts`, extend `LEVELS` to `{ length, points, stepMs, hint }` with values 3/15/550/PELAN, 4/18/450/SEDANG, 5/20/380/CEPAT, 5/22/320/LEBIH CEPAT, 6/25/260/TERCEPAT, and remove `STEP_MS`. Verify with `npm run typecheck`.
- [x] 1.2 In `scoring.test.ts`, add a curve test: `stepMs` strictly decreases, `length` never decreases, and Σ `length × stepMs` ≤ `ROUND_MS / 2`. Check that the existing rubric cases still hold, including 61 and 66 and the 65 boundary. Verify with `npm test`.

## 2. Engine

- [x] 2.1 In `engine.ts`, use `LEVELS[level].stepMs` for pattern display and lesson replays, and render `.gm-level` as `TAHAP n / 5 · HINT`. Verify with `npm run typecheck`.
- [x] 2.2 Update `engine.test.ts` and `GrowthMindsetGame.test.tsx` to advance by `length × stepMs` of the current level. Add tests that:
  - level 1 shows "TAHAP 1 / 5 · PELAN" and hides its pattern after 1650 ms, not before
  - level 5 shows "TAHAP 5 / 5 · TERCEPAT"
  - a lesson replay uses the same level's speed

  Verify with `npm test`.
- [x] 2.3 Update `src/games/growth-mindset/README.md` gameplay text with the level table (arrows, speed, hint) and confirm the rubric examples. Verify the README matches the spec.

## 3. Integration checks

- [x] 3.1 Run `npm run typecheck`, `npm test`, and `npm run build`, and verify all pass.
- [x] 3.2 Play the game in a temporary local harness, deleted afterwards, and check:
  - level 1 feels slow and level 5 fast
  - the hint label fits at 1280×720 and 1440×900 without clipping
  - a pass (≥ 65) is reachable within 20 s
- [x] 3.3 Verify `git diff --stat` shows code changes only under `src/games/growth-mindset/` and this OpenSpec change.
