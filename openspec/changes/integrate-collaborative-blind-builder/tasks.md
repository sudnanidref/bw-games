# Tasks

## 1. Collaborative Rules

- [x] 1.1 Read the current `../collab-game/src/domain/game.ts` and `game.test.ts` against the design's source map and capability spec, then port target generation, board actions, score calculation, and instruction length helpers into `src/games/collaborative/`; verify focused tests cover unique 3-6-object targets, 180-second scoring, zero and 100 bounds, and non-mutating invalid actions. Reconcile any changed PoC rule with the spec before porting it.
- [x] 1.2 Port `../collab-game/src/domain/instructions.ts` and `instructions.test.ts` with numeric and case-insensitive A1-E5 move sources and one-cell cardinal moves; verify focused tests cover duplicate-object selection, missing/wrong sources, occupied cells, jumps, diagonals, and unsupported instructions.

## 2. Instruction Service

- [x] 2.1 Add the necessary validation and provider dependencies; adapt `../collab-game/src/domain/ai-contract.ts`, `../collab-game/src/server/instruction-provider.ts`, and their neighboring tests into hub client/server modules; verify typecheck and tests for configuration, malformed output, target omission, stale rounds, and explicit move-source agreement.
- [x] 2.2 Adapt `../collab-game/src/app/api/instruction/handler.ts`, `route.ts`, and `route.test.ts` into a bounded, rate-limited Fastify `POST /api/instruction`; verify API injection tests cover accepted instructions, invalid JSON/board/transcript, no target data, and recoverable service errors without board mutation.
- [x] 2.3 Use `../collab-game/.env.example`, `../collab-game/docs/runbook.md`, and `../collab-game/docs/poc.md` to document server-only provider modes and required environment variables in the Collaborative slot guide or existing integration docs; verify deterministic mode works without credentials and no secret values are committed.

## 3. Playable Stage

- [x] 3.1 Adapt `../collab-game/src/app/page.tsx` and `../collab-game/src/app/globals.css` as a scoped `PlayableGame` component within the hub stage, preserving boards, transcript, keyboard controls, visible focus, countdown, and result breakdown without importing the Next layout or global CSS; verify component interaction tests and visual checks at 1280x720, 1440x900, and a narrower viewport.
- [x] 3.2 Connect cancel, error, replay, timeout, and explicit result confirmation to the hub callbacks; verify fake-timer/component tests show no score before confirmation, exactly one completion including zero, and ignored responses after timeout, exit, or replay.
- [x] 3.3 Replace stale 60-second player copy with 180 seconds and complete `src/games/collaborative/README.md` with goal, controls, scoring formula, source OpenSpec change, asset provenance, and local verification; verify the guide matches the implemented behavior.

## 4. Registry And Journey Integration

- [x] 4.1 Register only Collaborative as available with its briefing and update the registry test's all-unavailable assumption; verify ordered IDs and that other four slots remain unavailable.
- [x] 4.2 Verify the shell mounts Collaborative only after a valid Integrity result in a fixture journey, accepts its actual score once, and keeps cancellation non-scoring without allowing a production bypass; run the focused shell/journey tests.
- [ ] 4.3 Run `npm run typecheck`, `npm test`, and `npm run build`, then check the Fastify-backed instruction flow and stage visuals with and without configured provider credentials; record any live-provider check that cannot run without credentials rather than claiming it passed.