# Growth Mindset — Kebun Belajar

Owner boundary: `src/games/growth-mindset/`. Do not edit another value's code, the shared journey, or leaderboard to award points.

- **OpenSpec:** `growth-mindset-mini-game` (`openspec/changes/growth-mindset-mini-game/`).
- **Entry point:** `GrowthMindsetGame` (a `PlayableGame`) exported from `index.ts`. It is a thin React adapter around the framework-free DOM engine in `engine.ts`. Rules and tuning constants live in `scoring.ts`; styles live in `growth-mindset.css`, scoped to `.gm-game`. The visual refresh uses the same soft chibi 3D style and blue/cream/orange palette as Collaborative and Customer Focus. It remains contained in the shared game frame.
- **Gameplay:** an arrow pattern lights up one arrow at a time, then hides, and the player repeats it. Five levels share one 20-second timer, which includes display time. They ramp from easy to hard: each level shows its pattern faster than the previous one and is never shorter. The HUD label shows the level and its hint, for example `TAHAP 3 / 5 · CEPAT`.

  | Level | Arrows | Display per arrow | Hint | Points |
  | --- | --- | --- | --- | --- |
  | 1 | 3 | 550 ms | PELAN | 15 |
  | 2 | 4 | 450 ms | SEDANG | 18 |
  | 3 | 5 | 380 ms | CEPAT | 20 |
  | 4 | 5 | 320 ms | LEBIH CEPAT | 22 |
  | 5 | 6 | 260 ms | TERCEPAT | 25 |

  Total display time is about 8.5 s. Every correct arrow immediately grows the plant in size. Across 23 correct answers it changes from a seedling to a sprout, small sapling, young tree and large leafy tree. Wrong answers and pattern replays never shrink it; only a fresh round resets it. Growth counts correct inputs (including correct replay inputs), is capped at 23, and is cosmetic: scoring still uses cleared levels and best consecutive progress. A wrong arrow is marked ✗ with a lesson message. The same pattern then replays at the same level speed, and the player retries that level from arrow 1, losing only time.
- **Controls:**

  | Action | Keyboard | Pointer |
  | --- | --- | --- |
  | Start / confirm | Enter or Space | "Mulai" / "Lanjut" / "Coba lagi" / "Lanjut ke stage berikutnya" |
  | Arrow input | ← ↑ → ↓ or W A S D | Four on-screen arrow buttons |
  | Leave | Esc | "Keluar" / "Kembali ke menu" |

  - Input while a pattern is displaying is ignored.
  - All buttons have a visible focus ring.
  - Feedback uses ✓/✗ and text, not color alone.
  - `prefers-reduced-motion` removes transitions.
  - The shared background music starts with each round, stops on results or exit, and offers a mute button shared with other games.
- **Completion:** the round ends when level 5 is cleared or time runs out. The 65-point PASS/FAIL threshold is shared by all five games.
  - Score ≥ 65: the result shows PASS and "Lanjut", which calls `onComplete({ valueId: context.valueId, score })` exactly once.
  - Score < 65: the result shows FAIL, the actual score, and the 65 target. "Coba lagi" starts a fresh round without recording this attempt. "Kembali ke menu" calls `onCancel()` and returns to the current stage briefing without points. "Lanjut ke stage berikutnya" records the actual failed score through `onComplete` and advances the journey; FAIL does not block progress.
  - Stages remain sequential; there is no way to navigate to a previous game. The journey route and final breakdown show the Growth Mindset score with PASS or FAIL. Other games retain their existing completion display.
  - Esc or "Keluar" at any time calls `onCancel()`. An internal failure calls `onError(error)`. At most one outcome is reported per mount.
- **Score rubric:** an integer from 0 to 100, earned only from play.
  - Cleared levels 1-5 award 15, 18, 20, 22, and 25 points.
  - The first unfinished level adds `floor(points × bestCorrect / length)`, where `bestCorrect` is the most consecutive correct arrows reached in any attempt at that level.
  - Examples: all 5 levels = 100; levels 1-3 + 2/5 on level 4 = 61 (fail); levels 1-3 + 3/5 on level 4 = 66 (pass); levels 1-4 = 75.
- **Assets:**

  | Asset | Source / author | License / permission | Attribution | Usage |
  | --- | --- | --- | --- | --- |
  | Garden, seed, sprout, sapling, medium tree, large tree, arrow button, sparkle and retry effects | Original images made with the built-in image generator, saved in `public/assets/growth-mindset/`; prompts in `PROMPTS.md` and `TREE-PROMPTS.md` | Project-generated | None required | Scene, growth stages, arrow controls and feedback |
  | Learning partner portraits | Existing generated `public/assets/customer-focus/confused.png`, `confused-happy.png`, `worried.png` | Project-generated | None required | Shared visual character language with games 2 and 5 |
  | Arrow glyphs ← ↑ → ↓ ✓ ✗ | Unicode text characters | Standard text | None required | Pattern, controls, feedback |
  | Shared background music `../integrity/assets/integrity-bgm.m4a` | "Level 1" from "5 Chiptunes (Action)" by Juhani Junkala (SubspaceAudio), https://opengameart.org/content/5-chiptunes-action | CC0 | None required | Looping music during a round |
  | Fonts and colors | Shell `src/styles.css` (Barlow Condensed, DM Sans, CSS variables) | As documented by the shell | Per shell | Typography and palette |

  New scene, plant, arrow and effect artwork is raster image output from the built-in image generator. CSS only lays out and animates those images and ordinary interface panels; it does not draw the game assets. Existing shared music is retained. No external runtime image service is used.
- **Verification:** run `npm run typecheck`, `npm test`, and `npm run build` locally. The game tests are `scoring.test.ts`, `engine.test.ts`, and `GrowthMindsetGame.test.tsx`.
  - Visual refresh verified with all 226 tests passing (`npm test -- --reporter=dot --maxWorkers=2`) and a successful production build including TypeScript checks. Headless Playwright covered actual journey navigation, wrong-input replay, a size increase after each correct arrow, a 100-point run and progression to Customer Focus at 1440 px and 390 px widths. All nine active generated images decoded successfully, with no page errors or horizontal overflow. Briefing, gameplay and result screenshots were reviewed. Decorative animation respects reduced-motion preferences; background art and image-based controls remain visible.
- **Checklist:** [x] OpenSpec change approved; [x] original/licensed assets documented; [x] controls and scoring documented; [x] contract and journey tests pass; [x] only this value is changed.
