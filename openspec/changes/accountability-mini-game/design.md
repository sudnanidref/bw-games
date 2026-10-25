# Design

## Context

See [proposal.md](proposal.md) for motivation and [spec.md](specs/accountability-mini-game/spec.md) for observable requirements. The target is an existing Vite application using React 19, TypeScript, and Vitest. Accountability is registered as a `PlayableGame` receiving `context`, `onComplete`, `onCancel`, and `onError`. The shell provides a briefing before mounting the component and advances the journey as soon as `onComplete` is called.

The supplied source documents are preserved as read-only inputs. Later user decisions are reflected here: journey-level replay, illustrated payment controls, layouts without horizontal clipping, shared local music, and direct earned-point scoring capped at 100. Accountability remains value/stage 03; no other game's implementation or shared stylesheet is changed. The existing shared stylesheet imports Google Fonts, which remains outside this game's asset boundary.

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

Implement the game as a React/TypeScript component in `src/games/accountability/`, using the repository's installed Vite/Vitest toolchain. The source brief's vanilla HTML/CSS/JavaScript choice is its fallback for a new project; replacing the established host stack would break the existing game contract and add a second runtime. Keep all game-specific styles namespaced and avoid changes to shared shell styles. Preserve the registered Accountability slot's `component`, `available`, and Indonesian `briefing`; these presentation and scoring updates require no registry changes.

### Separate rule state from presentation

Keep configuration, payment IDs, character definitions, buyer creation, countdown scheduling, and round decisions in small game-local modules. A pure game engine owns phase, round ID, score, counters, queue, deadline, lock, feedback, and finalization. It receives a monotonic clock and RNG as dependencies; snapshots are copies/read-only values. React renders snapshots and sends choices with the round and displayed buyer IDs. The engine checks deadline first, then lock and identity, before scoring. It is the sole authority for score, FIFO movement, accepted input, and finalization.

Create exactly two random draws for each new buyer in the defined order (character, then payment). Initial queue creation occurs only after the round starts; successful decisions create a replacement only after their 120 ms lock and only if the deadline has not won. Rendering and wrong decisions never call the buyer factory.

### Use monotonic deadlines and one lifecycle owner

Use `performance.now()` through an injectable clock. Derive remaining time from the round deadline rather than decrementing a counter. One active animation/update loop advances the engine and paints the visible timer; `visibilitychange` advances the same engine before reopening input. The engine finalizes at `now >= deadline` before applying lock completion. Countdown scheduling is separate from round timing, injectable in tests, cancelled idempotently on manual Mulai, and cleaned up when the component unmounts.

Each accepted gesture carries the displayed `roundId` and `customerId` that existed when it began. Use one scoring event path for pointer/touch and keyboard, reject held-key repeats, and keep locked controls focusable with functional engine guards so a short lock does not destroy focus. A choice during a lock is discarded, never buffered.

### Align the final score with the other mini-games

The engine continues to award +10 for a correct payment and deduct 5 for a wrong payment, applying a zero floor after each decision. The in-round HUD shows these earned points. `normalizeAccountabilityScore` rounds finite input and clamps it directly to 0–100; non-finite input returns 0. There is no theoretical-speed denominator. This follows Integrity's final-score approach while preserving Accountability's own round rules.

The result screen prominently shows the capped **SKOR AKHIR / 100**, with the raw total retained as **Poin permainan**, plus served and wrong counts. The shared `scoreStatus` determines PASS at 65. Lanjut calls `onComplete` exactly once with the same final score shown to the player. Examples: 60 → 60/FAIL, 65 → 65/PASS, 70 → 70/PASS, and 115 → 100/PASS. Seven correct payments suffice for PASS without errors; ten yield 100. Raw points above 100 remain accumulated, so later penalties apply to earned points before the final cap, as in Integrity.

The former denominator of 1,670 turned 100 earned points into 6, tying success to near-machine input speed. The new rule aligns the final scale and shared PASS threshold; it does not establish equal empirical difficulty across the five different games.

The result screen stays mounted until Lanjut so the required raw result can be read. It has no Main Lagi button: that source requirement is superseded by the user's latest decision. The host's existing journey becomes responsible for continuing to the next value and for any full-run replay from Integrity.

### Draw the scene locally and scope visual constraints

Use original React SVG/CSS shapes for the warung, payment tokens, and anonymous characters. Separate local SVGs depict the acrylic QRIS stand, cash register, and EDC terminal, with navy outlines, depth, and soft shadows. Import them through Vite so production resolves either bundled asset URLs or embedded image data. The cash register is the largest object, in the middle. Buttons have transparent normal backgrounds, no captions, full-object hit areas, and visible keyboard focus. Accessible names are “Bayar dengan QRIS”, “Bayar tunai”, and “Bayar dengan EDC”.

Keep the visual order `qris`, `cash`, `edc` separate from the source `paymentMethods` order `cash`, `edc`, `qris`, because the latter also owns deterministic buyer RNG. Bind handlers by payment ID, never array position. Existing start-screen labels and buyer tokens remain intact.

Define blue/white/yellow tokens in the Accountability stylesheet. Check 1280×720, 1440×900, and mobile/landscape layouts for complete objects, no overlap with buyers or requests, and no horizontal overflow. Shorter viewports may scroll vertically. A namespaced selector may compact the host stage only while `.accountability-game` is mounted; do not edit shared CSS or other stages.

Request `AU Passata` and `AU Passata Regular` before Arial/sans-serif. Include a local font file only after its web-embedding and redistribution license is supplied and recorded. Until then, the game uses the fallback and marks identical typography as blocked. Synthesize the 370 ms success sound with Web Audio after a user gesture; sound failure is non-fatal and cannot change scoring. Reduced-motion styling changes decorative durations only.

### Verify the game and its existing journey integration

Use Vitest with injected clock, RNG, and countdown scheduler for L01–L23. Add focused React integration tests for contract validation, one-time Lanjut, focus, and rendered states. Keep U01–U16 as a browser acceptance checklist and record actual browser, viewport, font, network, test, and build outcomes in the Accountability README or a game-local verification note only after they are performed. Do not treat planned tests as passed. Run typecheck, tests, and the production build for changes to the existing stage; the complete shared shell can still make an inherited Google Fonts request until a separate shared-style change removes it.

## Risks / Trade-offs

- **Raw points can exceed the host's score cap** → Retain raw points as a secondary result detail; show and submit the same capped 0–100 score. Test 60/65/70 PASS boundaries, 100 and over-cap totals, and exactly-once completion.
- **AU Passata binary and embedding permission are unavailable** → Continue with Arial/sans-serif, make no identity claim, and report the font as an external prerequisite. Do not download an unofficial copy.
- **Existing shared stylesheet requests Google Fonts** → Do not edit it within this game-only change; state that whole-application no-CDN verification remains blocked pending separate authorization.
- **The host stage heading/padding can make the desktop game overflow** → Compact the enclosing stage only through a selector in the Accountability stylesheet that is active with the Accountability component; do not edit shared shell files or other game slots.
- **Automated checks do not replace full manual replay** → Test the component and its handoff, run shared shell tests, and record separately whether the full five-game browser journey was actually repeated.
- **Browser audio policy or device lacks Web Audio** → Trigger audio only from the accepted user gesture and fail gracefully; visual feedback and scoring remain authoritative.
- **A timeout and a scheduled transition occur together** → Check the deadline first in every engine update and cancel any stale animation/callback by round identity.

## Migration Plan

There is no data migration or backend deployment. The new conversion applies to newly completed Accountability rounds; existing saved leaderboard rows are not recalculated. Verify scoring and presentation locally before release. Reverting this update would restore the prior score mapping and result presentation within Accountability, without disabling other games or modifying the shared journey, leaderboard, global styles, or external source repository.
