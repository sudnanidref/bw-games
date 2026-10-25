# Design

## Context

See proposal.md for motivation and `specs/growth-mindset-game/spec.md` for externally visible behavior.

- `engine.ts` computes the round score and currently offers Retry or cancellation below 65; on passing it calls the adapter completion callback.
- The adapter adds `valueId: context.valueId` to the score before calling the shell.
- `completeStage` accepts any valid integer score from 0 to 100 for the current value and appends it. The journey already advances sequentially for all valid results.
- `App.tsx` lists each score on the route and final breakdown but does not show pass/fail status.
- The Growth Mindset pass threshold is 65 in `scoring.ts`. Other games have no shared pass threshold.

## Goals / Non-Goals

**Goals:**
- Let the player explicitly keep or retry a failed Growth Mindset attempt without changing how journey completion validates a score.
- Make the Growth Mindset outcome visible after leaving the game and in the final breakdown.

**Non-Goals:**
- Add backward navigation, stage replacement, a general pass threshold, a new result field, or server/leaderboard schema changes.

## Decisions

1. **Continue uses the existing completion contract.** The fail result's "Lanjut ke stage berikutnya" calls `onComplete(score)`. The adapter passes the Growth Mindset `valueId`; the shell validates and appends that actual score as usual. Retry starts a clean round and does not call any outcome callback. "Kembali ke menu" calls the existing non-scoring cancellation callback, returning to the current stage briefing. The shell remains responsible for opening the next stage.
   - *Why:* the journey already permits any valid 0-100 score and advances in order, so allowing a fail result needs no journey-rule bypass.
   - *Alternative:* add a separate skip/continue callback or an incomplete result was rejected; both would need contract, journey, and leaderboard changes.
2. **Derive status from the existing score only for Growth Mindset.** In `App.tsx`, compare the `growth-mindset` result score with `PASS_SCORE` (65). Show PASS/FAIL text beside its completed route score and in its final result row. All other games keep their current score-only presentation.
   - *Why:* score and threshold are already authoritative; a persisted boolean could drift from the score.
   - *Alternative:* add `passed` to `GameResult` or server data was rejected as duplicate state and a contract migration.
3. **Keep choices forward-only.** The failed result panel offers Retry, "Kembali ke menu", and "Lanjut ke stage berikutnya". It has no previous-stage control. When the panel opens, Retry receives focus; standard Tab navigation reaches the other actions, and Enter/Space activates the focused button.
4. **Test the full transition.** Engine tests verify the fail panel, retry without completion, continue reporting exactly the actual failed score, and single-outcome behavior. App tests verify the failed score appears in the route and the next value becomes current; final-result tests verify the PASS/FAIL row. No server test or schema migration is needed because results continue to use the existing score field.

## Risks / Trade-offs

- [A player may mistake FAIL for an invalid result] → Show FAIL alongside the saved numerical score, and explain that continuing records that score.
- [A fail result could be recorded twice by repeated activation] → Keep the engine's existing one-outcome guard and assert exactly one callback in tests.
- [Status can diverge if another UI uses a different threshold] → Import/use the existing `PASS_SCORE` constant and apply it only when `valueId === 'growth-mindset'`.

## Migration Plan

No data migration. Existing completed Growth Mindset scores can be labeled from their stored value using the 65-point threshold. Rollback removes the continue action and UI labels; scores already recorded remain valid journey results.
