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
- [x] 5.3 Implement the in-round HUD, exact request copy/labels, stable TUNAI–EDC–QRIS controls, fixed feedback space, urgent-time emphasis, and frozen result view with raw score/statistics and the specified accountability message; verify zero-score results and that payment controls are inactive on results.
- [x] 5.4 Add namespaced responsive game styling for desktop acceptance at 1280×720 and 1440×900, including compacting the enclosing stage only while Accountability is mounted; use no shared CSS file changes and affect no other slot. Verify U06 has no scroll/overlap at desktop targets and no horizontal clipping on narrower layouts.
- [x] 5.5 Update the Accountability operational README with game flow, controls, local run/test/build commands, source-document links, score rules, asset manifest, and AU Passata fallback/prerequisite; verify links and commands match the repository rather than the source project's standalone Vite commands.

## 6. Connect input, focus, motion, and success feedback

- [x] 6.1 Route pointer/touch and Enter/Space activations through one engine decision path carrying the displayed round/buyer identity; reject keyboard auto-repeat and stale gestures while allowing separate clicks after unlock; verify U03–U05.
- [x] 6.2 Preserve focus during locks, announce buyer/action changes without timer spam, focus the result heading, and keep Lanjut keyboard reachable; verify target names, `lang="id"`, 48×48 CSS px controls, and 4.5:1 text contrast.
- [x] 6.3 Add exactly three `$` floaters at the specified positions/duration and synthesize the 370 ms “cring” only for accepted correct choices; handle unavailable Web Audio without failing the decision and verify U15 plus no effect for wrong/rejected actions.
- [x] 6.4 Honor `prefers-reduced-motion` for visuals only and keep logical time/locks unchanged; verify U11 with reduced-motion enabled and test browser zoom remains available.

## 7. Complete handoff, documentation, and Accountability registration

- [x] 7.1 Keep the final result mounted until Lanjut; map raw points with `clamp(round(rawScore * 100 / 1670), 0, 100)` only when calling `onComplete({ valueId: 'accountability', score })`; verify 0, intermediate, maximum, and over-maximum boundaries and exactly-once completion.
- [x] 7.2 Implement early unmount cancellation and handled failure callbacks without awarding a score; verify contract tests reject wrong value IDs, duplicate completions, invalid scores, and mutations to prior results.
- [x] 7.3 Update `src/games/index.ts` for only Accountability (component, `available`, and briefing) after component tests pass; verify all five IDs and their order remain unchanged and only Accountability becomes available.
- [x] 7.4 Verify no in-game Main Lagi control exists and Lanjut calls `onComplete` once with one Accountability score; defer full-shell navigation to Growth Mindset and U08 full-run replay until Integrity and Collaborative are available.

## 8. Run final integration acceptance and report actual results

- [x] 8.1 Run `npm run typecheck`, `npm test`, and `npm run build`; record actual commands, exit statuses, environment, and outcomes in `src/games/accountability/docs/verification.md` without marking unrun checks as PASS.
- [ ] 8.2 Verify the Accountability component as stage 03 in a browser QA mount with `valueId: accountability` and two prior results at 1280×720 and 1440×900; perform reachable component checks, inspect controls/console/network, check narrower layouts for horizontal clipping, and record actual results. Do not unlock or fake Integrity/Collaborative; defer U08 full-run replay and U09 shell-route production play until those slots are pulled into the workspace.
- [x] 8.3 Report U16 identical-font verification as `NOT RUN`/blocked until a licensed local AU Passata web font is supplied; report whole-application zero-CDN verification as blocked by the pre-existing Google Fonts import in `src/styles.css`, and distinguish that inherited request from game-owned assets.