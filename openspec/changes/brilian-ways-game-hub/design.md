# Design

## Context

The repository contains OpenSpec and Copilot setup files but no application code, tests, or existing visual system. The target is desktop web. A brief hands-on pass through the Kampung Bash reference reached its title screen, mode selection, solo instructions, a brake/target round, and the next round's score feedback. Observable patterns worth adapting are a prominent arcade title, short pre-round instructions, explicit goals, immediate action feedback, and clear round-to-round transitions. Its mechanics, artwork, screen compositions, code, and assets are not source material for this product. See proposal.md for motivation and the three delta specs for required behavior.

## Goals / Non-Goals

**Goals:**

- Give five teams a small, typed, testable game contract and isolated ownership boundaries.
- Make stage state and ranking rules independent of any one game's renderer or mechanic.
- Establish an original arcade visual language before the five mini-games are built.

**Non-Goals:**

- Choosing or building the five game mechanics, replacing their authors' OpenSpec planning, or copying Vantis assets.
- Prize-grade anti-cheat, employee authentication, wallet integration, or mobile optimization.
- Requiring RTK or graphifyy until their roles are specified in a later change.

## Decisions

### 1. Shell and directory ownership

Build a desktop-first React/TypeScript shell with Vite and a small API service for ranking. Keep `src/games/integrity/`, `collaborative/`, `accountability/`, `growth-mindset/`, and `customer-focus/` as the five developer-owned slots. Each starts with a README guardrail and an unavailable registry entry, not a fake playable game. Place journey orchestration, shared UI, contract types, and API outside those directories. The registry has a single ordered list of five value identifiers; games cannot register themselves out of order. Prefer this to five separate apps or iframe integrations: it gives each owner isolation without multiplying deployment, accessibility, and score-transport problems.

### 2. Game contract and score lifecycle

Expose a typed game interface receiving `{ valueId, playerName, priorResults }` and completion/cancel/error callbacks. The game owns its mechanic and computes one integer score in `[0, 100]`; the shell owns value validation, deduplication, transitions, and total calculation. Freeze/copy previous results passed to a game so it can reference the journey's history without mutating it. After successful completion show a stage result and next value; an unavailable slot halts progression visibly. Use the same result validator in unit tests and at the API boundary. This is preferable to a shared mutable score store that would let one module modify another developer's results.

For the initial scaffold, no game reports a result and the leaderboard remains empty until the separately developed games are integrated. A developer-only contract fixture may exercise transitions in tests but must never be exposed as a scored production run.

### 3. Ranking and trust boundary

Use a small HTTP API with SQLite-backed persistent entries. The client sends display name, ordered per-value scores, total, completion time, and a per-run idempotency key only after the fifth result; the server trims and length-checks the name, validates all five identifiers and score bounds, recomputes the total, and uses server time for ordering rather than trusting the client timestamp. A unique run key prevents accidental double submission. Ranking sorts total descending, then recorded time ascending, then stable id. Render names as text, never HTML. A single server avoids browser-local leaderboards that cannot be shared across players.

Client-reported outcomes can still be forged by a motivated user. Because this is an unauthenticated, non-prize leaderboard, shape checks and rate limiting are the initial boundary; trustworthy competition would require server-verifiable game events and identity in a later change. Do not imply the initial leaderboard is cheat-proof.

### 4. Visual direction and asset policy

Use an original 'five stops on one arcade journey' motif. The desktop shell has a clearly visible progress route in the fixed value order, an unframed main play area, a compact score/status HUD, a short goal overlay before each game, and a result handoff to the next stop. Give each value a distinct accent and motif while sharing type scale, button/control geometry, contrast, sound settings, and transition timing. Choose expressive display typography for value titles with highly legible body text; use deliberate pixel/arcade-inspired edges and restrained motion for entry and results, not a replica of Kampung Bash. Treat the observed title -> mode -> short rules -> play -> feedback rhythm as inspiration, but do not replicate its menus or mini-game content.

Create a design guidance document with reusable tokens (ink, background, five accents, spacing, type, HUD scale, motion), desktop viewport constraints and keyboard/pointer expectations. Source visual and sound assets from original work or documented licenses. Do not hotlink, extract, or bundle files from the reference. Avoid official BRI logos unless rights/brand guidance is provided; text naming the values is sufficient for this scaffold.

### 5. Developer guardrails and checks

Each slot README names its owner boundary, expected OpenSpec workflow, exact contract, asset provenance fields, scoring rubric placeholder, and acceptance checklist. A shared contributor guide explains that each mini-game must have its own OpenSpec proposal/spec/design/tasks and contract tests; examples use value-specific change names. CI runs typecheck, unit tests for the five-stage state machine and score validator, integration tests for completed-run submission/ranking, and a guardrail check for required slot documentation and registry identifiers. Prefer this to a guideline with no executable enforcement; CI can check structure and contracts, while review verifies art provenance and design quality.

## Risks / Trade-offs

- [Five mechanics not yet known] -> Fixed score range and callbacks constrain interfaces without specifying games; each developer documents a 0-100 scoring rubric in their own OpenSpec change.
- [Only the first reference round was exercised] -> Design guidance cites only observed UI rhythms; no claim is made about the whole site's palette, assets, or later rounds.
- [Unavailable stages block a full run until all five are implemented] -> Show an honest unavailable state and test complete journeys with fixtures, never production placeholder scores.
- [Unauthenticated leaderboard is susceptible to forged runs and name collisions] -> Validate inputs, throttle writes, record distinct runs, disclose trust limit; defer verifiable competition.
- [Five separate developers can drift visually] -> Shared tokens and shell HUD, per-slot checklist, and integration review; unique gameplay remains encouraged.

## Migration Plan

No existing application to migrate. Land the shell and API with five unavailable slots, then integrate the separately planned games one at a time. Keep final-run submission disabled until five valid completions are possible. Rollback removes the new app deployment and its leaderboard data according to the environment's retention policy; no legacy clients depend on these contracts yet.