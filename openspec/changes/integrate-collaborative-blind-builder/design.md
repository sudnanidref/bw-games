# Design

## Context

See proposal.md for motivation and `specs/collaborative-game/spec.md` for required behavior. The hub is a Vite/React client with a Fastify API, a fixed five-value registry, and a `PlayableGame` callback contract. The neighboring PoC is a Next.js app with pure board/scoring modules, a client-side round controller, a Next instruction route, Zod request/outcome validation, and a server-only optional LLM provider. Its current rule is 180 seconds despite stale 60-second prose in its intro and documentation. The hub's existing game-integration and journey delta specs require strict sequencing, score ownership by the shell, and an unavailable state for unimplemented games.

### PoC source map

Paths below are relative to the hub repository root. Read the current files in `../collab-game/` when applying this change; that neighboring directory is not a Git repository here, so this map does not pin a revision. If its mechanics have changed, compare them with the capability spec before porting rather than silently replacing the agreed behavior. Do not import source files from the neighboring directory at runtime or copy `.env.local`.

| PoC source | Behavior to preserve / hub destination |
| --- | --- |
| `../collab-game/src/domain/game.ts` and `game.test.ts` | Pure 5x5 board, 3-6 unique-cell target generation, one-cell cardinal action validation, 35 non-space-character limit, 180-second clock constant, and 70/20/10 scoring; port with tests under `src/games/collaborative/`. |
| `../collab-game/src/domain/instructions.ts` and `instructions.test.ts` | Deterministic place/move/remove interpreter, duplicate-shape clarification, numeric source cells, case-insensitive A1-E5 move sources (letter = row), and one-step directions; port with tests under the Collaborative slot. |
| `../collab-game/src/domain/ai-contract.ts` and `ai-contract.test.ts` | Strict request/outcome/response schemas, unique-cell board and transcript bounds, and stale-round response rejection; share the adapted contract between Collaborative client and Fastify API. |
| `../collab-game/src/server/instruction-provider.ts` and `instruction-provider.test.ts` | Server-only provider modes, Foundry/OpenAI configuration, model prompt, schema validation and retry; adapt for the hub API, preserving deterministic operation without credentials. |
| `../collab-game/src/app/api/instruction/handler.ts`, `route.ts`, and `route.test.ts` | Request validation, deterministic/provider selection, round-id echo, and recoverable error behavior; reimplement as a Fastify route in `server/app.ts` and cover with API injection tests. Do not port NextResponse or Next route exports. |
| `../collab-game/src/app/page.tsx` and `globals.css` | Round state, timer, async instruction flow, two boards, transcript, and result presentation; adapt as a `PlayableGame` in `src/games/collaborative/` with scoped styles and hub callbacks. Do not copy global `.shell`/`.topbar` styles or the standalone layout. |
| `../collab-game/.env.example`, `docs/runbook.md`, and `docs/poc.md` | Source for provider setup and gameplay notes; document hub API configuration and correct obsolete 60-second prose against the current 180-second rule. |

## Goals / Non-Goals

**Goals:**

- Reuse the PoC's mechanics and recent source-coordinate/one-step move rules without retaining a second application runtime.
- Adapt the PoC to the hub's lifecycle, API, visual boundaries, and tests while keeping provider secrets server-only.
- Keep Collaborative implementation ownership clear and limit shared changes to the registry, API, and affected tests.

**Non-Goals:**

- Changing stage order, adding a production direct-play route, enabling unfinished games, or changing leaderboard trust rules.
- Replatforming the hub to Next.js or adding multiplayer, authentication, or server-verified scoring.

## Decisions

### 1. Port a component, not the Next application

Move the PoC's pure board rules, deterministic interpreter, request/response schemas, and focused tests into `src/games/collaborative/`. Adapt its client page to a `PlayableGame` component receiving the hub's immutable context and callbacks. Use the shell's existing briefing and value identity, and render the boards, transcript, countdown, result breakdown, and controls within the stage; prefix/localize CSS selectors and tokens to avoid collisions with the hub's `.shell`, `.topbar`, and global color variables. Preserve board labels (letters denote rows), keyboard text entry, visible focus, and desktop layout with narrower viewport checks. Do not import the PoC's Next layout or global stylesheet wholesale. Alternative: iframe or deploy the PoC separately, which would duplicate routing, lifecycle, scoring transport, and deployment.

### 2. Commit only a real finished result

Keep target generation and scoring in the ported pure module. Start the deadline only when the round begins; finalize once on early submission or timeout, even when a request is in flight. Display the final boards and score before a single explicit continue action invokes `onComplete({ valueId: context.valueId, score: score.final })`. A replay starts a new local round without scoring the previous one; exit uses `onCancel`, including from the results view before confirmation. Recoverable instruction errors stay in the round; unrecoverable game failures call `onError` without awarding points. Ignore responses after cancellation, unmount, timeout, or round replacement. This avoids auto-advancing before the player sees feedback and avoids awarding a replayed result. The hub still validates value, order, and integer score; no direct writes to journey or leaderboard occur.

### 3. Run the instruction adapter on the existing API

Adapt the Next route's Zod boundary to a Fastify `POST /api/instruction` route, with a bounded body, request validation (round id, instruction length, legal unique-cell board, bounded transcript), and structured response validation. Keep the PoC's server-only provider modes: deterministic when requested or when `auto` lacks credentials, Foundry/OpenAI when configured, and a configuration error in required `llm` mode. A configured provider failure or invalid output returns a recoverable service error instead of silently changing mode during a round. The API never receives the target; credentials remain server-only and are documented as environment settings, not committed values. Consider rate limiting and response time bounds for the external model so the service cannot be used as an unbounded public proxy. Alternative: call the model in the browser, rejected because it would expose credentials and break the existing API ownership boundary.

### 4. Enforce move legality after interpretation

Keep both deterministic parsing and structured provider guidance for one-based numeric and A1-E5 move source cells, with exactly one cardinal step. The pure `applyAction` boundary rejects jumps, diagonals, occupied cells, and missing objects regardless of the interpreter. For a player instruction containing an explicit recognized source cell, check a proposed provider move against that source before applying it; otherwise a schema-valid model output could move the wrong duplicate. Keep stale-round checks on the client. Alternative: trust provider prompts or schemas alone, rejected because neither guarantees semantic agreement with the player's instruction.

### 5. Integration checks and source documentation

Update only the Collaborative registry entry to available after the component and API work; revise the registry test that currently expects all five entries unavailable. Keep shell fixture tests as five-stage contract tests and add Collaborative-specific tests for lifecycle, score bounds and zero, timeout/in-flight response, service failure, instruction semantics, and request validation. Update the slot README with controls, scoring, source change, and asset provenance (CSS-created shapes need no external assets); reconcile the PoC's 60-second prose with the 180-second implemented rule. Keep copied code self-contained so the neighboring PoC remains unchanged and is not required at runtime.

## Risks / Trade-offs

- [Integrity is still unavailable, so players cannot reach Collaborative in a normal production run] -> Keep truthful journey gating; exercise Collaborative directly in component tests or a non-production development harness without awarding a hub result.
- [Client-calculated score and client-supplied board can be forged] -> Preserve existing non-prize leaderboard trust model; do not claim server-verifiable competition.
- [Model latency or malformed actions can outlast the timer or contradict a coordinate] -> Bound/validate requests and responses, verify explicit source and board legality, and ignore stale outcomes without changing the board.
- [The PoC's global styles and standalone intro collide with hub layout] -> Scope styles and use the shell briefing rather than nesting an entire standalone app.

## Migration Plan

Port the game modules and instruction service, update the slot documentation and tests, then mark only Collaborative available. Configure optional provider variables on the existing API host; deterministic mode works without model credentials. No persistent game data migration is needed. Rolling back the registry entry and instruction route returns the stage to unavailable without modifying prior leaderboard records.