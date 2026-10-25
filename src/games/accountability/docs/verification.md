# Accountability Game Verification

Status: **scoring update verified automatically; some browser acceptance remains incomplete**. This is the target-project verification record; it does not inherit results from `docs/reference/docs/verification.md`.

## Latest scoring verification — 2026-09-30

The final-score rule is now `clamp(round(rawScore), 0, 100)`, following Integrity's earned-points-and-cap approach. The shared PASS threshold remains 65. The former theoretical-speed divisor is no longer used. The result's primary score and the value sent on Lanjut are identical; the uncapped total remains visible as `Poin permainan`.

| Check | Actual result |
| --- | --- |
| `npm test -- src/games/accountability` | PASS: 7 files, 79 tests. |
| `npm test` | PASS: 30 files, 235 tests, including shared shell, journey, other games, and server checks. |
| `npm run build` | PASS: both app/server TypeScript checks, Vite client build, and tsup server build. |
| `git diff --check` | PASS. |
| Rules preserved | Existing engine tests pass for +10/−5, zero floor, 20-second deadline, 120/500 ms locks, FIFO buyers, RNG, stale inputs, and no duplicated scoring. |
| Result and handoff | Component tests use the real engine and confirm displayed score, raw detail, PASS/FAIL, buyer counts, and exactly-once Lanjut output. |
| Archived sources | Eight source-package documents remain unchanged; their local index links to the current target rules. |

Tested end-to-end component cases:

| Accepted choices (correct, then wrong) | Raw points | Displayed/submitted final score | Status |
| --- | --- | --- | --- |
| 1 correct | 10 | 10 | FAIL |
| 6 correct | 60 | 60 | FAIL |
| 7 correct, 1 wrong | 65 | 65 | PASS |
| 7 correct | 70 | 70 | PASS |
| 10 correct | 100 | 100 | PASS |
| 12 correct, 1 wrong | 115 | 100 | PASS |
| 1 wrong at zero | 0 | 0 | FAIL |

Unit coverage also checks negative, fractional, non-finite, and far-above-cap inputs. No changes were made to the shared PASS threshold, other games, database, or saved leaderboard entries.

The [payment illustration report](payment-illustrations-verification.md) records actual desktop/mobile viewport and production asset checks from the preceding visual update. Those measurements are not new browser runs for this scoring change. The scoring/result changes were checked by automated component tests; native browser keyboard completion, physical touch testing, and a complete manual five-game replay were not repeated. The existing Vitest `environmentMatchGlobs` deprecation notice remains; all tests and the build passed.

## Editor SVG import fix — 2026-09-30

The TypeScript language server reproduced `TS2307` for all three payment SVG imports in `AccountabilityGame.test.tsx`. The file belonged to an inferred project because the repository had no root `tsconfig.json`; the existing app configuration already included `vite/client`, but the editor did not discover it.

A root solution `tsconfig.json` now references the existing app and server configurations. A fresh TypeScript language-server check assigns the component, its test, and the shared audio module to `tsconfig.app.json`, and `server/index.ts` to `tsconfig.server.json`; all four files have zero semantic diagnostics. `npm run build`, including both TypeScript checks, passed again. This check used the installed language server directly; if an existing editor session retains stale diagnostics, restart its TypeScript server.

## Initial integration record — 2026-09-29

The sections below preserve the original implementation evidence. Their test counts, slot-availability blockers, and desktop no-scroll observations describe that earlier revision. Use the latest scoring section and payment illustration report above for current outcomes and limitations.

## Environment

- Date: 2026-09-29
- OS / Node.js / npm: macOS / `v22.23.3` / `10.9.9`
- Browser and version: VS Code integrated Chromium `150.0.7871.250`
- Desktop no-scroll targets: 1280×720 and 1440×900 (PASS; QA context mounted as Accountability stage 03)
- Narrower layouts: 390×844 and 844×390 had no horizontal clipping; vertical scrolling was present/allowed
- AU Passata: licensed local web-font file unavailable; identical typography check is blocked
- Runtime network: not run; the existing shared `src/styles.css` imports Google Fonts, so whole-application zero-CDN acceptance is blocked outside this game's current scope
- Dependency install: `npm ci` succeeded; npm reported 3 dependency advisories (1 low, 2 moderate). No audit fix was applied.

## Automated Checks

| Check | Status | Evidence / notes |
| --- | --- | --- |
| `npm run typecheck` | PASS | Exit 0; app and server TypeScript projects. |
| `npm test` | PASS | Exit 0; 12 files and 78 tests passed, including Accountability, registry, journey baseline, and server suites. |
| `npm run build` | PASS | Exit 0; Vite client and tsup server bundles built successfully. |

## Logic Scenarios

| ID | Status | Evidence / notes |
| --- | --- | --- |
| L01 | PASS | Deterministic Vitest engine/customer tests. |
| L02 | PASS | Table-driven correct choice tests for all methods. |
| L03 | PASS | Wrong answer preserves buyer and queue. |
| L04 | PASS | Per-decision minimum and subsequent correct score. |
| L05 | PASS | Documented mixed sequence yields 45/5/1. |
| L06 | PASS | Correct and wrong locks discard further choices. |
| L07 | PASS | Correct transition boundary at 119/120 ms. |
| L08 | PASS | Wrong lock boundary at 499/500 ms. |
| L09 | PASS | Choice at 19,999 ms accepted. |
| L10 | PASS | Choice at 20,000 ms rejected and round finalized. |
| L11 | PASS | Timeout wins during correct and wrong locks. |
| L12 | PASS | Accepted score/counters retained across timeout. |
| L13 | PASS | Repeated finalization returns frozen result. |
| L14 | PASS | Clock jump past deadline finalizes immediately. |
| L15 | PASS | RNG method boundaries map to all three methods. |
| L16 | PASS | Character and method draws remain independent. |
| L17 | PASS | Reads, timer updates, and wrong answers do not consume RNG. |
| L18 | PASS | Stale round/buyer and invalid payment actions are rejected. |
| L19 | PASS | Old round actions/callbacks cannot affect a new round. |
| L20 | PASS | Repeated start leaves current round unchanged. |
| L21 | PASS | Wrong then correct preserves FIFO movement. |
| L22 | PASS | Fake-scheduler countdown reaches zero and starts once. |
| L23 | PASS | Manual start cancels the countdown and stale callback. |

## Browser Acceptance

| ID | Status | Evidence / notes |
| --- | --- | --- |
| U01 | PASS | Browser accessibility snapshot showed title, configured score values, three methods, and five-second Mulai countdown. |
| U02 | NOT RUN | |
| U03 | NOT RUN | Pointer/keyboard controls have jsdom coverage; browser/touch check pending. |
| U04 | NOT RUN | Lock/transition behavior has jsdom coverage; browser gesture check pending. |
| U05 | NOT RUN | Enter/Space and focus have jsdom coverage; browser keyboard check pending. |
| U06 | PASS | Stage-03 host plus game measured at 1280×720 and 1440×900 with `document.scrollHeight` equal to viewport height; 390×844 and 844×390 had no horizontal clipping. |
| U07 | NOT RUN | Visibility event has jsdom coverage; real background-tab check pending. |
| U08 | NOT RUN | Full-run replay requires earlier game slots, which remain unavailable. |
| U09 | NOT RUN | Build passed, but Accountability cannot be reached in the shell until Integrity and Collaborative are available. |
| U10 | FAIL | Runtime origin inspection observed `https://fonts.googleapis.com` from the pre-existing shared `src/styles.css` import. Game-owned artwork/audio are local; removing the inherited host request is outside this change. |
| U11 | PASS | With reduced motion enabled, browser computed decorative animation as `1e-05s`; a 120 ms input lock remained active and timer logic was unchanged. |
| U12 | PASS | Browser result showed frozen score/statistics, message, and Lanjut; exactly-once callback/next-stage handoff covered by component and journey tests. |
| U13 | PASS | Stage-03 browser view showed exactly three anonymous buyers, active request, waiting method tokens, and ordered controls. |
| U14 | PASS | Browser start snapshot showed only specified content and 5-second countdown; an untouched countdown auto-started once. Manual cancel covered by deterministic component test. |
| U15 | PASS | Browser accepted correct choice showed positive feedback and three `$` glyphs; anonymous queue visible. Wrong/locked actions produce no success effects in component/audio tests. |
| U16 | NOT RUN | Licensed local AU Passata file is unavailable; identical typography remains blocked. Palette browser check pending. |
