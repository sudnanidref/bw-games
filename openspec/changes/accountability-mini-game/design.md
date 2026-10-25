# Design

## Context

See [proposal.md](proposal.md) for motivation and [spec.md](specs/accountability-mini-game/spec.md) for observable requirements. The target is an existing Vite application using React 19, TypeScript, and Vitest, not a greenfield site. The game slot is a `PlayableGame` component receiving `context`, `onComplete`, `onCancel`, and `onError`; the Accountability registry entry is currently unavailable. The shell provides a briefing before mounting the component and advances the journey as soon as `onComplete` is called.

The supplied source documents are read-only inputs. Their game rules own the domain, except where the latest user decisions explicitly supersede them: no in-game replay action and desktop-first acceptance using the repository's target viewports. Accountability remains value/stage 03; Integrity and Collaborative are owned by other contributors and MUST NOT be enabled or altered here. The existing shared stylesheet imports Google Fonts; changing that shared dependency is outside the approved Accountability boundary.

## Goals / Non-Goals

**Goals:**
- Implement the source-defined start, play, and result experience as an isolated Accountability React component.
- Keep game rules independently testable and make all clock/RNG behavior deterministic in tests.
- Preserve the raw Kasir Sat Set result while returning exactly one valid score to the existing journey.
- Keep new game artwork, audio behavior, and styles local to the Accountability directory.

**Non-Goals:**
- Rebuild the application shell, change the journey or leaderboard contract, or enable another game slot.
- Add backend state, network APIs, payments, analytics, user data, a runtime package, or a full-run replay control inside this game.
- Remove the existing global Google Fonts import or otherwise alter shared styling as part of this game-only change.
- Bundle or obtain an AU Passata font without verified web-embedding and redistribution permission.

## Decisions

### Reuse the existing React game contract

Implement the game as a React/TypeScript component in `src/games/accountability/`, using the repository's installed Vite/Vitest toolchain. The source brief's vanilla HTML/CSS/JavaScript choice is its fallback for a new project; replacing the established host stack would break the existing game contract and add a second runtime. Keep all game-specific styles namespaced and avoid changes to shared shell styles. Set the Accountability slot's `component`, `available`, and Indonesian `briefing` only after the game and integration checks are ready.

### Separate rule state from presentation

Keep configuration, payment IDs, character definitions, buyer creation, countdown scheduling, and round decisions in small game-local modules. A pure game engine owns phase, round ID, score, counters, queue, deadline, lock, feedback, and finalization. It receives a monotonic clock and RNG as dependencies; snapshots are copies/read-only values. React renders snapshots and sends choices with the round and displayed buyer IDs. The engine checks deadline first, then lock and identity, before scoring. It is the sole authority for score, FIFO movement, accepted input, and finalization.

Create exactly two random draws for each new buyer in the defined order (character, then payment). Initial queue creation occurs only after the round starts; successful decisions create a replacement only after their 120 ms lock and only if the deadline has not won. Rendering and wrong decisions never call the buyer factory.

### Use monotonic deadlines and one lifecycle owner

Use `performance.now()` through an injectable clock. Derive remaining time from the round deadline rather than decrementing a counter. One active animation/update loop advances the engine and paints the visible timer; `visibilitychange` advances the same engine before reopening input. The engine finalizes at `now >= deadline` before applying lock completion. Countdown scheduling is separate from round timing, injectable in tests, cancelled idempotently on manual Mulai, and cleaned up when the component unmounts.

Each accepted gesture carries the displayed `roundId` and `customerId` that existed when it began. Use one scoring event path for pointer/touch and keyboard, reject held-key repeats, and keep locked controls focusable with functional engine guards so a short lock does not destroy focus. A choice during a lock is discarded, never buffered.

### Preserve raw results and adapt only at handoff

The game shows its raw score, served count, and wrong count without reinterpretation. On the result screen, the player explicitly chooses Lanjut; only that event calls `onComplete`. Convert raw points with `clamp(round(raw * 100 / 1670), 0, 100)` at that boundary. The cap follows from 167 eligible decisions at 0, 120, …, 19,920 ms, each worth 10 points. `round` means nearest integer; use the host contract's `accountability` value ID. Never place the normalized value in the raw-score UI or alter the game engine's scoring.

The result screen stays mounted until Lanjut so the required raw result can be read. It has no Main Lagi button: that source requirement is superseded by the user's latest decision. The host's existing journey becomes responsible for continuing to the next value and for any full-run replay from Integrity.

### Draw the scene locally and scope visual constraints

Use original React SVG/CSS shapes for the warung, cashier, payment tokens, and at least six distinguishable anonymous characters; do not add licensed image dependencies or reuse the external reference. Define blue/white/yellow game tokens in the Accountability stylesheet, with contrast adjustments but no logo or affiliation claim. Validate no-scroll gameplay at the repository's desktop targets, 1280×720 and 1440×900. A namespaced selector in the Accountability stylesheet may compact the host stage heading and padding only while `.accountability-game` is mounted; it MUST NOT modify shared CSS files or affect another stage. Keep the three payment controls in a stable order and give the play area its own size constraints so game art cannot shift them; narrower layouts may scroll vertically but cannot clip controls horizontally.

Request `AU Passata` and `AU Passata Regular` before Arial/sans-serif. Include a local font file only after its web-embedding and redistribution license is supplied and recorded. Until then, the game uses the fallback and marks identical typography as blocked. Synthesize the 370 ms success sound with Web Audio after a user gesture; sound failure is non-fatal and cannot change scoring. Reduced-motion styling changes decorative durations only.

### Verify the game before exposing the registry slot

Use Vitest with injected clock, RNG, and countdown scheduler for L01–L23. Add focused React integration tests for contract validation, one-time Lanjut, focus, and rendered states. Keep U01–U16 as a browser acceptance checklist and record actual browser, viewport, font, network, test, and build outcomes in the Accountability README or a game-local verification note only after they are performed. Do not treat planned tests as passed. Enable the registry slot only after typecheck, tests, and build pass; the complete shared shell can still make an inherited Google Fonts request until a separate shared-style change removes it.

## Risks / Trade-offs

- **Raw score has a wider range than the host contract** → Preserve the raw result and use the explicit, bounded 1,670-point normalization only at `onComplete`; test boundaries and journey progression.
- **AU Passata binary and embedding permission are unavailable** → Continue with Arial/sans-serif, make no identity claim, and report the font as an external prerequisite. Do not download an unofficial copy.
- **Existing shared stylesheet requests Google Fonts** → Do not edit it within this game-only change; state that whole-application no-CDN verification remains blocked pending separate authorization.
- **The host stage heading/padding can make the desktop game overflow** → Compact the enclosing stage only through a selector in the Accountability stylesheet that is active with the Accountability component; do not edit shared shell files or other game slots.
- **The full journey cannot reach stage 03 while predecessor slots are unavailable** → Test the component with an Accountability (`valueId`) context and two prior results in a QA harness. Do not unlock Integrity/Collaborative as a test shortcut; report full-shell navigation and full-run replay checks as blocked until their owners provide those stages.
- **Browser audio policy or device lacks Web Audio** → Trigger audio only from the accepted user gesture and fail gracefully; visual feedback and scoring remain authoritative.
- **A timeout and a scheduled transition occur together** → Check the deadline first in every engine update and cancel any stale animation/callback by round identity.

## Migration Plan

There is no data migration or backend deployment. Implement and verify the component while the registry slot remains unavailable, then register only Accountability and provide its briefing. Rollback consists of restoring only that slot to `available: false` and removing its component/briefing mapping; preserve all other work in the repository. Do not modify the shared journey, leaderboard, global styles, or the external source repository.