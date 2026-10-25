# Tasks

## 1. Preserve the source brief and establish local documentation

- [x] 1.1 Copy the six numbered source specifications, source `README.md`, and source `docs/verification.md` into `src/games/accountability/docs/reference/` without editing their contents; verify each copy against its source with SHA-256 and confirm no source file was changed.
- [x] 1.2 Add a reference index distinguishing the copied source verification report from this target implementation, and create `src/games/accountability/docs/verification.md` with L01–L23 and U01–U16 initially marked `NOT RUN`; verify the target report contains no inherited PASS claims.

## 2. Build deterministic configuration and buyer data

- [x] 2.1 Define the single game configuration for 20,000 ms, +10, −5, minimum 0, 120 ms correct transition, 500 ms wrong lock, 3,000 ms urgent threshold, queue size 3, minimum six character variations, and 5,000 ms auto-start; verify UI and engine consume these shared values rather than duplicate constants.
- [x] 2.2 Implement only `cash`/TUNAI, `edc`/EDC, and `qris`/QRIS plus at least six original distinguishable anonymous characters and a buyer factory with independent character-then-payment RNG draws; verify deterministic tests L01, L15, L16, and L17.
- [x] 2.3 Document character/payment asset provenance and the AU Passata license prerequisite in the local asset manifest; verify every authored asset has source/author, permission or license, attribution, and usage fields, with no unofficial font source.

## 3. Implement and test the round engine

- [x] 3.1 Implement round initialization, FIFO queue, unique buyer/round identities, correct and wrong scoring, per-decision zero floor, counters, and non-buffering locks; verify L01–L08 and L21 with injected clock/RNG tests.
- [x] 3.2 Implement strict deadline checks before transitions, immutable final results, idempotent timeout, visibility recovery, and rejection of stale or invalid identities; verify L09–L14 and L18–L20, including accepted score retention when a lock crosses the deadline.
- [x] 3.3 Verify score sequences explicitly: wrong-at-zero then correct yields raw 10/served 1/wrong 1, and correct ×3, wrong ×1, correct ×2 yields raw 45/served 5/wrong 1; keep these assertions in the engine tests for L04 and L05.

## 4. Add the cancellable start countdown

- [x] 4.1 Implement an injectable 5-to-0 start countdown that can be cancelled once and starts only one round; verify L22 and L23 with a fake scheduler and confirm countdown time is excluded from the 20-second round.
- [x] 4.2 Add tests for repeated start requests and cleanup on unmount so an old scheduler cannot restart or reset an active/new round; verify L19 and L20 remain covered.

## 5. Build the game screens and local scene

- [x] 5.1 Implement the minimal Indonesian start screen, including only title, three configured score values, method preview, and Mulai with its changing countdown; verify U01 and U14 against the rendered accessible content.
- [x] 5.2 Draw the warung, cashier, payment tokens, and queue with original local SVG/CSS art, keeping exactly three anonymous buyers visible and showing only the active buyer's speech request plus persistent methods for waiting buyers; verify U13 and that at least six character variants are distinguishable.
- [x] 5.3 Implement the in-round HUD, request copy/labels, stable illustrated QRIS–cash–EDC controls, fixed feedback space, urgent-time emphasis, and frozen result with final score, raw points, statistics, and the accountability message; verify zero-score results and inactive payment controls on results.
- [x] 5.4 Add namespaced responsive styling for desktop 1280×720/1440×900 and narrow/landscape layouts. Verify complete objects, no overlap, and no horizontal clipping; shorter layouts may scroll vertically under the revised payment-object requirements. Do not change shared styles or other games.
- [x] 5.5 Update the Accountability operational README with game flow, controls, local run/test/build commands, source-document links, score rules, asset manifest, and AU Passata fallback/prerequisite; verify links and commands match the repository rather than the source project's standalone Vite commands.

## 6. Connect input, focus, motion, and success feedback

- [x] 6.1 Route pointer/touch and Enter/Space activations through one engine decision path carrying the displayed round/buyer identity; reject keyboard auto-repeat and stale gestures while allowing separate clicks after unlock; verify U03–U05.
- [x] 6.2 Preserve focus during locks, announce buyer/action changes without timer spam, focus the result heading, and keep Lanjut keyboard reachable; verify target names, `lang="id"`, 48×48 CSS px controls, and 4.5:1 text contrast.
- [x] 6.3 Add exactly three `$` floaters at the specified positions/duration and synthesize the 370 ms “cring” only for accepted correct choices; handle unavailable Web Audio without failing the decision and verify U15 plus no effect for wrong/rejected actions.
- [x] 6.4 Honor `prefers-reduced-motion` for visuals only and keep logical time/locks unchanged; verify U11 with reduced-motion enabled and test browser zoom remains available.

## 7. Complete handoff, documentation, and Accountability registration

- [x] 7.1 Keep the result mounted until Lanjut; use `clamp(round(rawScore), 0, 100)` for both the primary final score and `onComplete({ valueId: 'accountability', score })`. Retain raw points as a detail and use the shared PASS threshold of 65. Verify zero, intermediate, 60/65/70 threshold cases, the 100 cap, above-cap totals, and exactly-once completion.
- [x] 7.2 Implement early unmount cancellation and handled failure callbacks without awarding a score; verify contract tests reject wrong value IDs, duplicate completions, invalid scores, and mutations to prior results.
- [x] 7.3 Register Accountability in `src/games/index.ts` with its component and briefing after component tests pass; preserve all five IDs, their order, and the other owners' slot registrations. The subsequent visual/scoring updates require no registry change.
- [x] 7.4 Verify no in-game Main Lagi control exists and Lanjut calls `onComplete` once with one Accountability score. Full five-game browser replay remains a separate acceptance check; do not treat automated shell tests as manual replay evidence.

## 8. Run final integration acceptance and report actual results

- [x] 8.1 Run `npm run typecheck`, `npm test`, and `npm run build`; record actual commands, exit statuses, environment, and outcomes in `src/games/accountability/docs/verification.md` without marking unrun checks as PASS.
- [ ] 8.2 Complete remaining browser acceptance (full native keyboard sequence, real touch devices, full five-game replay, console/network checks). The payment-object update has recorded viewport and production-asset checks in `src/games/accountability/docs/payment-illustrations-verification.md`; do not mark all browser acceptance complete from those partial checks.
- [x] 8.3 Report U16 identical-font verification as `NOT RUN`/blocked until a licensed local AU Passata web font is supplied; report whole-application zero-CDN verification as blocked by the pre-existing Google Fonts import in `src/styles.css`, and distinguish that inherited request from game-owned assets.

## 9. Align scoring and synchronize the current implementation docs

- [x] 9.1 Replace theoretical-maximum normalization with direct earned points capped at 100, matching Integrity's final-score approach while keeping Accountability's +10/−5 rules and shared PASS ≥ 65.
- [x] 9.2 Display the same final score that Lanjut submits; retain raw points and statistics, and add real-engine component regressions for thresholds, penalties, over-cap totals, and one-time completion.
- [x] 9.3 Run the complete repository tests and production build, then record their actual outcomes in the target verification report: 235 tests in 30 files passed; the production build includes both TypeScript checks and passed.
- [x] 9.4 Update proposal, design, requirements, tasks, README, and target verification documentation for the current controls and scoring. Keep the eight archived source-package files unchanged.
