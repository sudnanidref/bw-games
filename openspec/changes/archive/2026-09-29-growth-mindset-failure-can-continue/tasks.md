# Tasks

## 1. Growth Mindset result flow

- [x] 1.1 Update `src/games/growth-mindset/engine.ts`: for score <65 show a FAIL result with actual score and target; provide "Coba lagi", "Kembali ke menu", and "Lanjut ke stage berikutnya". Retry starts a fresh round without a callback; menu calls the non-scoring cancellation callback; continue calls the existing completion callback once with the actual score. Keep the pass result and remove any previous-stage action. Verify with `npm run typecheck`.
- [x] 1.2 Update `engine.test.ts` and `GrowthMindsetGame.test.tsx` to cover a failing score, no result before an explicit choice, retry without saved completion, menu cancellation without completion, continue reporting the exact score once, and no duplicate outcome. Verify with `npm test`.
- [x] 1.3 Update the Growth Mindset README's completion rules to say that FAIL can retry, return to the current stage briefing without a score, or continue with its actual score; PASS/FAIL is only this game's 65-point threshold. Verify it agrees with the spec.

## 2. Journey result visibility

- [x] 2.1 Update `src/App.tsx` to derive PASS/FAIL only for a recorded `growth-mindset` result using the existing `PASS_SCORE`; display its actual score and status in the route and final per-game breakdown. Leave other games' result labels unchanged and do not add a persisted status field. Verify with `npm run typecheck`.
- [x] 2.2 Extend `src/App.test.tsx` to simulate continuing with a Growth Mindset score below 65, assert the failed score/status stays visible and the next stage becomes current, and assert PASS/FAIL appears in the completed journey breakdown. Also assert other stage rows keep their current completion display. Verify with `npm test`.
- [x] 2.3 Add or adjust scoped CSS for the status labels, ensuring text contrast, keyboard-visible focus remains clear, and result rows fit without clipping at desktop review sizes. Verify at 1280×720 and 1440×900.

## 3. Integration checks

- [x] 3.1 Run `npm run typecheck`, `npm test`, and `npm run build`; verify all pass.
- [x] 3.2 Play through a temporary local harness (delete it afterward): verify FAIL can retry or continue, continuing records the actual score and moves forward, and a score ≥65 still passes. Verify sequential progression and labels at 1280×720 and 1440×900.
- [x] 3.3 Verify `git diff --stat` contains only the Growth Mindset game files, `src/App.tsx`, `src/App.test.tsx`, scoped styles, and this change's OpenSpec artifacts.
