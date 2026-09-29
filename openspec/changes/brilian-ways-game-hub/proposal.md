# Proposal

## Why

Five developers need a shared foundation for a connected BRILiaN Way game journey without having to agree on each mini-game's mechanics up front. A common visual direction, integration contract, and contribution guardrails will let their work fit together while preserving the fixed order of the five values and a meaningful final score.

## What Changes

- Establish a desktop-first arcade shell for a named player's five-stage journey: Integrity, Collaborative, Accountability, Growth Mindset, then Customer Focus.
- Reserve one isolated directory and documented integration boundary for each game; do not implement the five game mechanics in this change.
- Define a common score/result contract, stage progression, final score summary, and name-based leaderboard that accepts only completed five-stage runs.
- Set shared visual and asset-use guidance, plus per-game contribution guardrails requiring an OpenSpec change and integration checks. RTK and graphifyy are not requirements at this stage.
- Use the Kampung Bash reference for interaction and visual direction only; create or license original assets rather than copying its files, art, code, branding, or exact screens.

## Capabilities

### New Capabilities

- `game-journey`: Player entry, fixed BRILiaN Way sequence, stage completion, and accumulated results.
- `game-integration`: Isolated game slots, developer contract, visual guidelines, and contribution guardrails.
- `leaderboard`: Name-based final-run submission and ranking.

### Modified Capabilities

None.

## Impact

Greenfield web app: new desktop game shell, five game directories, shared contracts and tests, contribution documentation, and a persistent leaderboard service/storage boundary. No existing product code or specs are changed. Individual mini-game concepts and asset production remain separate developer-owned changes.