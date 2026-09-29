# Proposal

## Why

The Growth Mindset stage (stage 4 of the BRILiaN Way journey) has a slot but no playable game, so the journey cannot be finished. The approved pitch ([docs/pitch/growth-mindset-pitch.pptx](../../../docs/pitch/growth-mindset-pitch.pptx)) defines "Pola Tumbuh". It is a 20-second, medium-difficulty memory game where a mistake becomes a lesson, not a game over. The owner also wants a 65-point pass mark so the stage shows real mastery before the player moves on.

## What Changes

- Add "Pola Tumbuh", an original mini game in `src/games/growth-mindset/`:
  - An arrow pattern (← ↑ → ↓) lights up, then hides, and the player repeats it.
  - It has 5 levels with patterns of 3, 4, 4, 5, and 6 arrows, all within one 20-second timer.
  - A wrong input marks the mistake as a "lesson" and replays the same pattern. The only cost is time.
- Build the game engine from plain DOM/JavaScript with no framework or library. A thin React adapter satisfies the shell's `PlayableGame` contract.
- Score each round from play as an integer from 0 to 100. Each finished level earns 15, 18, 20, 22, or 25 points. The unfinished level earns partial credit for its correct inputs.
- Add a pass mark of 65, local to this game:
  - A score of 65 or more is reported once through `onComplete`, and the journey moves on.
  - A score below 65 is never reported. The game shows the score with **Coba lagi** (restart inside the game) and **Kembali ke menu** (`onCancel()`). The stage stays incomplete and awards no points, so the player cannot reach Customer Focus.
- Support keyboard (arrows/WASD, Enter/Space, Esc) and pointer controls, visible focus, status shown without relying on color alone, and reduced motion. The game has no audio.
- Register the slot in `src/games/index.ts` with `available: true`, the component, and a briefing. Update the slot README with controls, the scoring rubric, the pass mark, and the asset manifest.
- Replaying an earlier, completed stage is out of scope. It would require changes to the shell or journey, which are outside this slot's boundary.

## Capabilities

### New Capabilities
- `growth-mindset-game`: the Pola Tumbuh gameplay, timing, level progression, mistake-as-lesson feedback, the 0-100 scoring rubric, the 65-point pass gate with retry/menu, controls and accessibility, and how the game reports to the shell contract.

### Modified Capabilities
<!-- None: the shell contract, journey order, and leaderboard rules stay unchanged. The pass gate is enforced entirely inside the game. -->

## Impact

- **New code:** `src/games/growth-mindset/` (engine, scoring, React adapter, styles, tests).
- **Shared file (one entry only):** in `src/games/index.ts`, the `growth-mindset` slot gets `component`, `available: true`, and `briefing`.
- **Docs:** `src/games/growth-mindset/README.md`.
- **Registry split (shared, behavior-neutral):** the server imports `src/leaderboard.ts` → `src/games/index.ts`, so registering a React component pulled JSX/CSS into the server typecheck and bundle. The ordered value ids move to a component-free `src/games/slots.ts`, used by `contract.ts`, `leaderboard.ts`, and `server/app.test.ts`. `src/games/index.ts` re-exports `ValueId`, and `registry.test.ts` now checks that only real games are registered, instead of checking that every slot is unavailable. Value order, validation, and scoring do not change.
- **Nothing else changes:** no changes to `src/journey.ts`, `src/App.tsx`, the leaderboard API behavior, the server, or dependencies. Existing journey/contract tests must still pass.
- **Effect on the journey:** until a player scores 65 or more here, the journey stays on stage 4, so no final total or leaderboard entry is possible.
