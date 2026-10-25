# Accountability Game Verification

Status: **implementation available, browser verification incomplete**. This is the target-project verification record; it does not inherit results from `docs/reference/docs/verification.md`.

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