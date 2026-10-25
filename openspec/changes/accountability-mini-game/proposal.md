# Proposal

## Why

Accountability is implemented as Kasir Sat Set, stage 03 of the five-value journey. Its original conversion divided earned points by a theoretical input-speed maximum, making 100 earned points worth only 6 journey points. The updated scoring follows Integrity's direct-points-and-cap approach, while the payment controls use the requested QRIS stand, cash register, and EDC illustrations.

## What Changes

- Add a playable Indonesian cashier game with three payment methods, a persistent FIFO queue of three anonymous buyers, a 20-second round, the source-defined scoring, locks, deadline, feedback, and responsive accessible controls.
- Add a concise in-game start screen with the specified five-second auto-start, a playable scene, and a frozen results screen. **BREAKING:** omit the source PRD's “Main Lagi” action per the latest user decision; offer “Lanjut” to complete the Accountability stage. Replaying the full experience remains the journey's responsibility from its first mini-game.
- Keep the existing `PlayableGame` integration. Show a final score of `clamp(round(rawScore), 0, 100)`, retain the raw total and buyer statistics, and send the same final value once on Lanjut. Use the shared PASS threshold of 65.
- Render local transparent SVG payment objects in QRIS–cash–EDC order, with the cash register largest in the middle. Preserve semantic buttons, accessible payment names, focus, locks, and ID-based handlers; remove normal button boxes and visible captions.
- Check desktop targets 1280×720 and 1440×900 plus narrow and landscape viewports. Objects must remain complete, separated from each other and the buyer scene, and free of horizontal clipping. Shorter layouts may scroll vertically to preserve the other UI. Keep all styling namespaced to Accountability.
- Use original local SVG/CSS artwork and locally synthesized success audio. Treat a licensed, web-embeddable AU Passata font file as an external prerequisite; use the documented Arial fallback without claiming identical typography when unavailable.
- Keep the six read-only source specifications and a game-local verification report with the delivered game, alongside its operational README and asset manifest; never edit the external source files.
- Keep implementation changes within `src/games/accountability/` plus the Accountability entry in `src/games/index.ts`; preserve it as stage 03 and do not change the shared journey, leaderboard, Integrity/Collaborative slots, or the external source-document repository. QA may supply stage-03 prior-result context without enabling those predecessor slots.

## Capabilities

### New Capabilities
- `accountability-mini-game`: Defines the complete Kasir Sat Set game behavior, visual/accessibility requirements, and completion handoff to the BRILiaN Way journey.

### Modified Capabilities
- None. The repository has no existing OpenSpec capabilities; the shared game contract is integrated without changing its requirements.

## Impact

- Target code and docs: `src/games/accountability/` and this OpenSpec change; focused scoring, component, engine, and contract tests. The existing registry and other games need no implementation changes. Full-journey browser replay is recorded separately from automated shell tests.
- Existing React 19, TypeScript, Vite, and Vitest stack is retained. The source brief's vanilla stack is only its default for a new project; this repository is an existing application with a `PlayableGame` component contract.
- Hub score handoff: earned points map directly to an integer in 0–100. Seven correct payments yield 70/PASS; seven correct followed by one wrong yield 65/PASS; ten correct yield 100. Higher raw totals still map to 100. The old 1,670-point denominator is removed. The in-round +10/−5 rules and per-decision zero floor remain unchanged, and saved leaderboard entries are not rewritten.
- No new runtime package, backend, CDN, remote asset, payment integration, or source-repository edit. Licensed local AU Passata web-font files remain a release prerequisite for identical typography.
- The existing shared `src/styles.css` imports Google Fonts. It is outside the game-only boundary and will remain untouched; therefore the game itself adds no network dependency, but whole-application zero-CDN verification is blocked until that inherited import is removed in a separately authorized shared-shell change.
