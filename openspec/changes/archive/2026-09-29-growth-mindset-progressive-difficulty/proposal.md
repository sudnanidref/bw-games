# Proposal

## Why

In Pola Tumbuh, every level shows its pattern at the same speed (350 ms per arrow), and the pattern lengths barely change (3, 4, 4, 5, 6). The five levels therefore feel alike. The owner wants a clear easy-to-hard curve: level 1 slow with a short pattern, and each later level faster with a longer pattern than the one before.

## What Changes

- Each level gets its own display speed and pattern length, ramping from easy to hard:

  | Level | Arrows | Display per arrow | Points (unchanged) |
  | --- | --- | --- | --- |
  | 1 | 3 | 550 ms | 15 |
  | 2 | 4 | 450 ms | 18 |
  | 3 | 5 | 380 ms | 20 |
  | 4 | 5 | 320 ms | 22 |
  | 5 | 6 | 260 ms | 25 |

- Displaying all patterns takes about 8.5 s in total, compared with about 7.7 s today. The rest of the round is left for input.
- The HUD's level label also shows a speed hint (for example "TAHAP 3 / 5 · CEPAT") so the player can see the difficulty rising. The hint is text, not color.
- These stay the same:
  - one 20-second round
  - points per level and the partial-credit formula
  - the 65 pass gate with retry and menu
  - controls, the mistake-as-lesson flow, and the shell contract
- "Faster" applies only to how quickly the pattern is displayed. There is no separate per-level input time limit; input still uses the remaining round time.
- "Stage" in the request means the 5 levels inside Pola Tumbuh, not the 5 BRILiaN Way journey stages.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `growth-mindset-game`: the "Pattern levels" requirement changes from a single 350 ms display speed with lengths 3/4/4/5/6 to a per-level speed and length curve (550→260 ms, 3/4/5/5/6 arrows) with a visible level difficulty hint.

## Impact

- **Code:**
  - `src/games/growth-mindset/scoring.ts`: `LEVELS` gains a per-level `stepMs`, and the global `STEP_MS` is removed.
  - `engine.ts`: uses the level's speed and renders the difficulty hint.
  - Tests: `engine.test.ts` and `GrowthMindsetGame.test.tsx`.
  - `README.md`: updated gameplay and rubric examples.
- **No shared files change:** shell, journey, contract, registry, and server are untouched.
- **Ordering:** the `growth-mindset-game` capability is still introduced by the unarchived change `growth-mindset-mini-game`. That change must be archived first so this delta has a main spec to modify.
- **Balance:** the pass mark stays reachable. Clearing levels 1-3 plus 3/5 on level 4 still gives 66. A perfect 100 needs a near-flawless run.
