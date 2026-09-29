# Proposal

## Why

The Customer Focus game now contributes a real fifth-stage score, but its three static, one-to-one options are quickly memorized. An arcade-style moving solution lane and plausible distractors can make players react and choose deliberately while retaining the existing five-stage handoff.

## What Changes

- Evolve **Match the Solution** into one desktop arcade round with three stationary customer situations on the left and a cycling lane of six shuffled solution cards on the right: three correct responses and three plausible distractors. Players catch and match cards quickly by dragging, with an equivalent keyboard interaction.
- Use the initial cases: an older customer confused about logging in -> assisted guidance; a merchant whose QRIS payment fails -> fallback/payment support; and a pending transfer -> check transaction status. Treat these as service-direction prompts, not detailed banking instructions or guarantees of resolution.
- Add looping, increasingly quick card motion, clear catch/return/lock feedback and a visible streak; pausing on hover/focus and a static reduced-motion mode preserve readability. Keep the visible 45-second limit and integer 0-100 scoring rubric.
- Preserve the already-enabled `customer-focus` slot and its single-result shell handoff. Ship the revised arcade content to that slot only after its new distractors have been reviewed and integration checks pass; keep the other four games and the leaderboard unchanged.
- Follow the existing visual tokens, desktop control/accessibility guidelines, and original/licensed asset policy. Do not copy material from the Vantis reference.

## Capabilities

### New Capabilities

- `customer-focus-match-the-solution`: The playable fifth-stage arcade matching round, six-card moving lane, accessible controls, feedback, timer, and score handoff.

### Modified Capabilities

None. The existing game-hub change already defines the shared score and journey contract; this change consumes it without altering its requirements.

## Impact

Primarily `src/games/customer-focus/`, with focused game and integration tests and the slot README. The registry is already enabled; the new unreviewed distractors MUST NOT replace its approved copy before content approval and regression checks. No new backend or authentication is required; production leaderboard submissions still require all five stage results.