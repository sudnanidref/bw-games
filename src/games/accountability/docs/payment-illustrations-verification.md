# Payment illustration verification

Date: 2026-09-30. This record covers the payment-object update and supersedes the older layout observations in `verification.md` for these controls.

The later scoring update is recorded in [verification.md](verification.md). It changes final-score conversion and result labels; the viewport screenshots and test counts below remain evidence of the earlier illustration-only revision.

## Changes verified

- The playable controls are ordered QRIS, cash, EDC in both DOM and visual layout.
- Three original, separate SVGs replace the blue button boxes and visible captions. The cash register is the largest object in the middle.
- Each object remains inside a native button with its own payment ID and accessible name. The whole button area is interactive; image dragging is disabled.
- The buyer RNG order in `paymentMethods`, engine, timer, score, penalties, input locks, sound, and result/journey replay behavior were not modified.
- Other game UI, including the start-screen method guide and buyer payment tokens, is unchanged.

## Automated checks

| Check | Actual result |
| --- | --- |
| `npm test` | PASS: 30 files, 216 tests, including 60 Accountability tests. |
| Payment-to-handler mapping | PASS: separate QRIS, cash, and EDC cases each award +10 for the matching buyer; repeated clicks during the lock are ignored. |
| Keyboard and accessible names | PASS in jsdom with `userEvent`: Tab follows QRIS–cash–EDC, Enter/Space activate the native control, focus survives the lock, and locked activation does not score. |
| Captions and asset mapping | PASS: no text content beneath the three objects; each button uses the corresponding imported image and accessible name. |
| `npm run build` | PASS: both TypeScript projects, Vite client, and tsup server. |
| Production asset loading | PASS: fetched production JS and cash SVG over HTTP from Vite preview on port 4187. The cash SVG exactly matches its source; decoded inline QRIS/EDC SVGs have the same XML structure, attributes, and text as their sources. |
| `git diff --check` | PASS. |

## Browser checks

Used Safari with a temporary local QA mount of the existing stage-03 shell and real `AccountabilityGame`. Only the QA mount supplied prior results and a controlled clock/RNG for inspection; these changes were removed and are absent from the production bundle. No leaderboard result was submitted.

| CSS viewport | Horizontal overflow | Asset loading / order / separation | Smallest payment target | Page height |
| --- | --- | --- | --- | --- |
| 1280 × 720 | None | PASS | 180 × 136 px | 823 px |
| 1440 × 900 | None | PASS | 180 × 170 px | 900 px |
| 390 × 844 | None | PASS | 83 × 98 px | 1036 px |
| 320 × 740 | None | PASS | 66 × 90 px | 1027 px |
| 844 × 390 | None | PASS | 124 × 99 px | 687 px |

Measurements confirmed all three images loaded, their button backgrounds were transparent, their captions were absent, and all controls stayed inside the viewport without intersecting each other or the buyer scene. The full objects and their shadows were visually inspected on desktop and portrait mobile. Vertical scrolling is needed on shorter viewports; no `overflow-x: hidden` workaround is used.

A browser click on the cash-register object for a cash buyer awarded +10 and exposed the locked state. The focused control's visible outline was observed in Safari. Screenshots were shown during the inspection.

## Limits

- Mobile sizes were tested using browser viewports, not physical touch devices.
- Full Tab/Enter/Space sequences were verified by the automated component tests; a complete native Safari keyboard sequence was not confirmed.
- No end-to-end replay of all five games was performed for this visual-only update. Existing engine and journey tests passed.
- The existing Vitest `environmentMatchGlobs` deprecation notice remains; no new build or test failures remain.
