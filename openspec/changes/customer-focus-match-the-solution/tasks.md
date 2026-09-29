# Tasks

Groups 1-4 record the completed static matching game. Groups 5-8 track its arcade revision; previously completed tasks remain historical, not claims that the new behavior is implemented.

## 1. Cases and Scoring

- [x] 1.1 Define the three Indonesian customer/solution pairs with stable IDs and a fixed nonmatching display order under `src/games/customer-focus/`; verify a content test checks all three one-to-one mappings and excludes credential requests and guarantees.
- [x] 1.2 Implement the pure 45-second scoring and match transitions; verify unit tests cover correct and wrong pairs, abandoned drops, early full completion, partial/zero-point timeout, score bounds, and a match at the deadline.

## 2. Playable Round

- [x] 2.1 Implement the local goal view, Begin action, pointer dragging, keyboard select-and-assign, timer, feedback, frozen results view and Continue action; verify focused component tests cover pointer/keyboard parity, visible outcomes, timeout, cancel/error, and exactly-once completion.
- [x] 2.2 Style the responsive two-column play area with shared tokens, stable counters, visible focus, non-color status and reduced-motion support; verify keyboard-only play and legibility at 1280x720 and 1440x900 in a browser.
- [x] 2.3 Update `src/games/customer-focus/README.md` with this change name, controls, 0-100 formula, content-review status and per-asset provenance/permission/attribution/usage (or explicitly state no imported assets); verify its checklist reflects the delivered game and the spec's rules.

## 3. Slot Integration

- [x] 3.1 Obtain authorized review of the exact customer/solution wording and record approval in the Customer Focus README; verify no unreviewed operational banking instruction or credential request is shipped.
- [x] 3.2 Export the playable component and enable only the `customer-focus` slot with a concise briefing after tests and content approval; verify an integration test accepts its one 0-100 result in fifth position and rejects premature, duplicate, cancelled or errored handoffs without touching another value.

## 4. Cross-Game Verification

- [x] 4.1 Run `npm run typecheck`, `npm test`, and `npm run build`; verify all pass and the five-stage journey/leaderboard tests still use only real stage scores.
- [x] 4.2 Check the integrated shell and game at 1280x720 and 1440x900 with keyboard focus, reduced-motion preference, and a completed fifth stage; verify no clipped content, inaccessible controls, or placeholder score.

## 5. Reviewed Arcade Content

- [x] 5.1 Draft three distinct, plausible Indonesian distractor cards, each incorrect for all three customers, and retain the three approved correct responses; verify focused content tests reject duplicate mappings, credential requests, transaction guarantees, and unreviewed production copy.
- [x] 5.2 Obtain authorized review of the exact new distractor wording and record reviewer, date and approved text in the Customer Focus README before the enabled game uses it; verify the approved words match the shipped cards.

## 6. Moving Lane and Controls

- [x] 6.1 Add shuffled six-card round state, looping card availability, wrong-distractor handling and textual streak feedback without changing the 45-second score formula; verify deterministic tests cover replay order, return without penalty, accelerating correct catches, streak reset, timeout and score bounds.
- [x] 6.2 Animate the right-side lane with a 12/10/8-second circuit, pointer catch/return/lock feedback and no moving customer targets; verify browser pointer tests at 1280x720 and 1440x900 cover one full round and a passed card returning without a penalty.
- [x] 6.3 Pause lane movement on hover, focus, selection and drag, bring offscreen keyboard-focused cards into view, and offer a static six-card reduced-motion arrangement; verify keyboard-only, reduced-motion, readable focus, and timer-continuity tests, and document arcade controls and asset provenance in the Customer Focus README.

## 7. Approved Slot Rollout

- [x] 7.1 After content approval and focused interaction checks, use the arcade round in the already-enabled Customer Focus slot and development preview, updating only that slot's briefing if needed; verify integration tests accept exactly one fifth-stage 0-100 result and reject premature, duplicate, cancelled or errored handoffs while leaving the other four games unchanged.

## 8. Cross-Game Arcade Verification

- [x] 8.1 Run `npm run typecheck`, `npm test`, `npm run build`, and `openspec validate "customer-focus-match-the-solution" --strict`; verify all pass and shared journey/leaderboard results remain real, ordered and bounded.
- [x] 8.2 Check the integrated arcade game and direct preview at 1280x720 and 1440x900 with pointer, keyboard, reduced motion, timeout and finished stage; verify readable moving/stationary cards, no clipping and a real fifth-stage score.