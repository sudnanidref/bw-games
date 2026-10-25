# Proposal

## Why

The Growth Mindset game currently refuses to report a result below 65 and offers only Retry, so one failed attempt can block the ordered journey indefinitely. The player wants failed scores retained and permission to continue, while keeping the distinction between passing and failing visible in the journey.

## What Changes

- Keep Retry and the existing non-scoring **Kembali ke menu** action on a Growth Mindset score below 65, and add **Lanjut ke stage berikutnya**. Continuing reports the actual 0–64 score once through the existing game contract, completing the current stage and unlocking the next one. Returning to the menu exits to the current stage briefing without recording the attempt.
- A score of 65 or more remains PASS and can continue as before. A score below 65 is FAIL, but does not block stage progression.
- Show Growth Mindset's PASS/FAIL status and actual score in the journey route and final per-game results. Derive the status from the saved score and the existing threshold of 65; do not add a new persisted status field.
- Keep stages strictly sequential. There is no navigation back to a previous game. Retry restarts only the current Growth Mindset round; choosing continue moves forward; returning to the menu leaves the current stage incomplete.
- Other games keep their existing completion behavior. This 65-point PASS/FAIL rule is specific to Growth Mindset.
- Keep the five-result leaderboard contract and aggregate total unchanged. A failed Growth Mindset score remains a real score in that total.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `growth-mindset-game`: change the below-65 result from non-scoring cancellation to a valid failed completion when the player chooses to continue; retain retry and specify PASS/FAIL feedback.

## Impact

- **Game:** `src/games/growth-mindset/engine.ts`, its tests, and its README.
- **Journey UI:** `src/App.tsx`, `src/styles.css`, and relevant tests will display Growth Mindset's result status in the route and final score breakdown.
- **Data and contracts:** no changes to `GameResult`, journey ordering, server validation, leaderboard storage shape, aggregate score, dependencies, or other games. The existing `score` field is sufficient to derive Growth Mindset PASS (≥65) or FAIL (<65).
- **Out of scope:** returning to, replaying, or replacing results for a previous stage; global PASS/FAIL thresholds for other games; skipping multiple stages.
