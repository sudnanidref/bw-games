# Proposal

## Why

The Accountability slot is reserved but unavailable, leaving the five-value journey incomplete. This change adds the source-defined Kasir Sat Set mini-game inside the Accountability game boundary and hands one real, bounded score back to the existing journey.

## What Changes

- Add a playable Indonesian cashier game with three payment methods, a persistent FIFO queue of three anonymous buyers, a 20-second round, the source-defined scoring, locks, deadline, feedback, and responsive accessible controls.
- Add a concise in-game start screen with the specified five-second auto-start, a playable scene, and a frozen results screen. **BREAKING:** omit the source PRD's “Main Lagi” action per the latest user decision; offer “Lanjut” to complete the Accountability stage. Replaying the full experience remains the journey's responsibility from its first mini-game.
- Integrate only the Accountability slot with the existing `PlayableGame` contract. Keep the game's raw score and statistics visible; convert the raw score deterministically to the hub's required integer range of 0–100 when the player continues.
- Follow the repository's desktop game targets of 1280×720 and 1440×900 for no-scroll acceptance. A namespaced rule in the Accountability stylesheet may compact the host stage only while this game is mounted; do not edit shared styles or affect other stages. Narrower layouts remain usable without horizontal clipping and may scroll vertically.
- Use original local SVG/CSS artwork and locally synthesized success audio. Treat a licensed, web-embeddable AU Passata font file as an external prerequisite; use the documented Arial fallback without claiming identical typography when unavailable.
- Keep the six read-only source specifications and a game-local verification report with the delivered game, alongside its operational README and asset manifest; never edit the external source files.
- Keep implementation changes within `src/games/accountability/` plus the Accountability entry in `src/games/index.ts`; preserve it as stage 03 and do not change the shared journey, leaderboard, Integrity/Collaborative slots, or the external source-document repository. QA may supply stage-03 prior-result context without enabling those predecessor slots.

## Capabilities

### New Capabilities
- `accountability-mini-game`: Defines the complete Kasir Sat Set game behavior, visual/accessibility requirements, and completion handoff to the BRILiaN Way journey.

### Modified Capabilities
- None. The repository has no existing OpenSpec capabilities; the shared game contract is integrated without changing its requirements.

## Impact

- Target code and docs: `src/games/accountability/` (including the preserved source-spec bundle, operational README, asset manifest, and actual verification report) and the minimal Accountability registry entry in `src/games/index.ts`; focused game/contract tests. Full-shell handoff and replay verification wait until the other owners' game 01–02 work is pulled into the workspace.
- Existing React 19, TypeScript, Vite, and Vitest stack is retained. The source brief's vanilla stack is only its default for a new project; this repository is an existing application with a `PlayableGame` component contract.
- Hub score handoff: `roundScore` is normalized as `roundScore / 1670 * 100`, rounded to the nearest integer and clamped to 0–100. 1,670 is the theoretical maximum from 167 correct decisions at the 120 ms correct lock within 20 seconds; the raw score remains on the game results screen.
- No new runtime package, backend, CDN, remote asset, payment integration, or source-repository edit. Licensed local AU Passata web-font files remain a release prerequisite for identical typography.
- The existing shared `src/styles.css` imports Google Fonts. It is outside the game-only boundary and will remain untouched; therefore the game itself adds no network dependency, but whole-application zero-CDN verification is blocked until that inherited import is removed in a separately authorized shared-shell change.