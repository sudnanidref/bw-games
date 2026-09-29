# Design

## Context

See proposal.md for motivation and specs/customer-focus-match-the-solution/spec.md for the observable contract. The shared `PlayableGame` interface receives a readonly context and completion, cancel, and error callbacks; the journey already validates stage order and integer scores in 0..100. The `customer-focus` slot is already enabled with a static three-pair game and a development-only direct preview. Keep that approved version playable until the arcade revision and new content pass review. The shell has its own stage briefing; the local Begin action starts the 45-second timer only after reading.

## Goals / Non-Goals

**Goals:** Keep matching logic and the clock owned by the fifth-game component, build kinetic card presentation around one shared pointer/keyboard match transition, and preserve an idempotent result handoff.

**Non-Goals:** Alter shell scoring, journey order, leaderboard persistence, another game's directory, or provide transaction-specific financial advice. No hosted generation API or new external media is needed for six reviewed static response texts.

## Decisions

### Curated scenarios and moving solution lane

Retain the three approved customer/correct-response IDs and add three distinct, plausible distractor IDs, none of which is a correct response. Keep all six texts curated locally; draft and test them, then record authorized approval of their exact wording before including them in the enabled game. A new round shuffles the six card IDs while tests control the shuffle, so replay does not reuse a memorized sequence. Keep customers stationary and solutions in a clipped cyclic rail with two or three readable cards visible at once. Cards loop back after passing without an automatic miss penalty; matching removes only the correct card. Start with a 12-second circuit, then use 10 and 8 seconds after the first and second correct matches. A visible streak increments for consecutive correct catches and resets on an incorrect drop, but does not award separate points. Use the shared tokens and unframed desktop play area, with stable timer/matched/streak HUD dimensions at 1280x720 and 1440x900. Alternative: move customer drop targets or force a miss penalty; rejected because moving targets make reading and pointer precision unfair and can disadvantage keyboard play.

### One matching path for all inputs

Use semantic focusable controls for all unmatched response cards and stationary customer targets. Hover/focus pauses rail movement; keyboard focus on a card outside the visible portion first brings that card into view and keeps it readable, without waiting for a cycle. Pointer-down on a card holds the lane during its drag; keyboard activation selects a card then a customer. Both submit the same card/target IDs to one transition. A correct card connects to the matching customer and is removed; a wrong correct card or distractor returns to circulation and increments incorrect attempts once. Show an outcome and streak with text/icons as well as color, using a polite live region. Ignore release outside a valid target. In reduced-motion mode, stop the rail and expose all six cards in a readable static arrangement while preserving the same controls, score, and timer. Alternative: native HTML drag-and-drop alone; rejected because its keyboard and pointer behavior differs, complicating parity and focus handling.

### Time, score and handoff

Keep phase (`ready`, `playing`, `finished`), correct pair IDs, incorrect-attempt and streak counts, selected response and feedback local to the game. Record a monotonic start time on Begin and derive remaining milliseconds from a 45,000 ms deadline; pausing card motion MUST NOT pause this deadline. At the final correct match, use the clamped remaining milliseconds; if the deadline has already passed, timeout wins. Retain the existing pure 0-100 scoring function (20 per correct pair, up to 40 speed bonus only after all three, minus 5 per wrong attempt). The streak is feedback, not an independent multiplier. A single terminal transition freezes the outcome and shows the result; Continue calls `onComplete({ valueId: context.valueId, score })` exactly once. Timer callbacks clean up on unmount. Cancel while ready or playing calls only `onCancel`; an unexpected gameplay failure calls only `onError(error)`. Alternative: award points for streak or missed cards; rejected to avoid changing the shared score rubric while increasing reflex challenge.

## Risks / Trade-offs

- [Domain wording could be interpreted as definitive banking advice] -> Keep responses at first-contact guidance level and require content-owner review before marking the slot available.
- [Race between final match, timeout and cancel] -> Resolve elapsed time within the matching transition, guard the terminal state, and test exactly-one callback behavior on Continue and at the deadline.
- [Pointer dragging can be hard for some users] -> Provide equivalent focusable select-and-assign controls with visible instructions and live feedback.
- [The same three situations remain learnable] -> Shuffle six cards and add plausible distractors for this reflex-focused revision; a larger scenario bank belongs in a separate change.
- [Animated text may be unreadable or inaccessible] -> Keep customer targets fixed, pause on hover/focus/drag, bring keyboard-focused cards into view, and use a static reduced-motion arrangement.
- [New distractors can imply unsafe banking advice] -> Keep all unapproved copy out of the enabled game; review exact text with the content owner and document approval before rollout.
- [Shuffling and changing lane speed can make tests flaky] -> Separate card identity and matching rules from presentation; inject deterministic order/timing in tests and test the real browser at the target viewports.

## Migration Plan

Implement the arcade revision inside `src/games/customer-focus/` and test it in the development-only preview without altering other games. Keep the currently approved static game active until new distractor text, interaction tests, browser checks, and documentation are complete; only then replace its presentation in the already-enabled slot and update the briefing if needed. Rollback restores the approved static presentation without changing journey results or other stages. No data migration is required.