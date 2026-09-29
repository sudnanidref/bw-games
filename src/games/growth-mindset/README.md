# Growth Mindset — Pola Tumbuh

Owner boundary: `src/games/growth-mindset/`. Do not edit another value's code, the shared journey, or leaderboard to award points.

- **OpenSpec:** `growth-mindset-mini-game` (`openspec/changes/growth-mindset-mini-game/`).
- **Entry point:** `GrowthMindsetGame` (a `PlayableGame`) exported from `index.ts`. It is a thin React adapter around the framework-free DOM engine in `engine.ts`. Rules and tuning constants live in `scoring.ts`; styles live in `growth-mindset.css`, scoped to `.gm-game`.
- **Gameplay:** an arrow pattern lights up one arrow at a time, then hides, and the player repeats it. Five levels share one 20-second timer, which includes display time. They ramp from easy to hard: each level shows its pattern faster than the previous one and is never shorter. The HUD label shows the level and its hint, for example `TAHAP 3 / 5 · CEPAT`.

  | Level | Arrows | Display per arrow | Hint | Points |
  | --- | --- | --- | --- | --- |
  | 1 | 3 | 550 ms | PELAN | 15 |
  | 2 | 4 | 450 ms | SEDANG | 18 |
  | 3 | 5 | 380 ms | CEPAT | 20 |
  | 4 | 5 | 320 ms | LEBIH CEPAT | 22 |
  | 5 | 6 | 260 ms | TERCEPAT | 25 |

  Total display time is about 8.5 s. A wrong arrow is marked ✗ with a lesson message. The same pattern then replays at the same level speed, and the player retries that level from arrow 1, losing only time.
- **Controls:**

  | Action | Keyboard | Pointer |
  | --- | --- | --- |
  | Start / confirm | Enter or Space | "Mulai" / "Lanjut" / "Coba lagi" |
  | Arrow input | ← ↑ → ↓ or W A S D | Four on-screen arrow buttons |
  | Leave | Esc | "Keluar" / "Kembali ke menu" |

  - Input while a pattern is displaying is ignored.
  - All buttons have a visible focus ring.
  - Feedback uses ✓/✗ and text, not color alone.
  - `prefers-reduced-motion` removes transitions.
  - There is no audio.
- **Completion:** the round ends when level 5 is cleared or time runs out.
  - Score ≥ 65: a result screen shows "Lanjut", which calls `onComplete({ valueId: context.valueId, score })` exactly once.
  - Score < 65: nothing is reported. The player sees the score and the 65 target, then chooses "Coba lagi" (a fresh round with new patterns and the full 20 s) or "Kembali ke menu" (`onCancel()`, no points). The stage stays current and Customer Focus stays locked until a round reaches 65.
  - Esc or "Keluar" at any time calls `onCancel()`. An internal failure calls `onError(error)`. At most one outcome is reported per mount.
- **Score rubric:** an integer from 0 to 100, earned only from play.
  - Cleared levels 1-5 award 15, 18, 20, 22, and 25 points.
  - The first unfinished level adds `floor(points × bestCorrect / length)`, where `bestCorrect` is the most consecutive correct arrows reached in any attempt at that level.
  - Examples: all 5 levels = 100; levels 1-3 + 2/5 on level 4 = 61 (fail); levels 1-3 + 3/5 on level 4 = 66 (pass); levels 1-4 = 75.
- **Assets:**

  | Asset | Source / author | License / permission | Attribution | Usage |
  | --- | --- | --- | --- | --- |
  | Sprout, soil, pattern slots, arrow pad, timer bar | Original, drawn in code (DOM + CSS) in this directory | Project-owned | None required | Play area visuals |
  | Arrow glyphs ← ↑ → ↓ ✓ ✗ | Unicode text characters | Standard text | None required | Pattern, controls, feedback |
  | Fonts and colors | Shell `src/styles.css` (Barlow Condensed, DM Sans, CSS variables) | As documented by the shell | Per shell | Typography and palette |

  No image, audio, font, or other third-party asset files are added. Nothing is taken from the Vantis reference, and no BRI logo is used.
- **Verification:** run `npm run typecheck`, `npm test`, and `npm run build` locally. The game tests are `scoring.test.ts`, `engine.test.ts`, and `GrowthMindsetGame.test.tsx`.
- **Checklist:** [x] OpenSpec change approved; [x] original/licensed assets documented; [x] controls and scoring documented; [x] contract and journey tests pass; [x] only this value is changed.