# Proposal

## Why

The hub has a reserved but unavailable Collaborative stage, while Blind Builder already exists as a separately developed PoC. Porting it into the hub makes the second value playable through the shared journey without maintaining a second production app or inventing a placeholder score.

## What Changes

- Bring Blind Builder's target-and-teammate board challenge, text instructions, timed round, and 0-100 scoring into the Collaborative game slot.
- Connect a real round's completion, cancellation, and failure to the hub's game contract; make only Collaborative available in the registry once integrated and tested.
- Adapt the PoC's validated instruction endpoint to the hub's Fastify service, retaining deterministic interpretation and optional server-side Foundry/OpenAI-backed interpretation without exposing credentials or the target board.
- Preserve source-cell disambiguation (numeric row/column or A1-E5 for moves), one-cell cardinal movement, and no-mutation behavior for invalid instructions.
- Align the game presentation, instructions, tests, and slot documentation with the hub; use the implemented 180-second limit as the planning baseline and correct stale 60-second copy.
- Keep the five-value order intact. Collaborative remains locked until Integrity has a valid result; this change does not add a scored bypass or make other slots playable.

## Capabilities

### New Capabilities

- `collaborative-game`: Blind Builder gameplay, safe instruction handling, scoring, and completion through the hub's Collaborative slot.

### Modified Capabilities

None. The hub's game-integration and journey requirements currently live in the completed hub change rather than in durable `openspec/specs/`; this port conforms to those requirements without changing their rules.

## Impact

- Collaborative implementation and guidance under `src/games/collaborative/`, its entry in `src/games/index.ts`, and its registry/integration tests.
- A bounded `POST /api/instruction` route in `server/app.ts`, with shared validated request/response and optional provider integration; `zod` and `openai` are candidate dependencies from the PoC.
- Game-specific tests for instruction interpretation, action bounds, timing, scoring, and shell callback behavior; hub journey and leaderboard rules stay unchanged.
- No runtime dependency on the neighboring PoC or Next.js and no copying its deployment configuration or secrets.