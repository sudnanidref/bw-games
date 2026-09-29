# Accountability: Kasir Sat Set

The Accountability stop is the Indonesian-language cashier game Kasir Sat Set. The game lives in this directory and is hosted by the existing BRILiaN Way journey; it is not a standalone Vite application.

## OpenSpec

Implementation change: `accountability-mini-game`. Its proposal, behavioral spec, design, and task checklist define the approved scope. The original source package remains read-only; byte-identical references are preserved in [`docs/reference/`](docs/reference/INDEX.md).

## Entry point

`AccountabilityGame` implements the shared `PlayableGame` contract. The registry entry in `src/games/index.ts` remains unavailable until the component, integration tests, typecheck, and build are ready. Do not edit another value, the shared journey, or leaderboard code to award points.

## Controls

- The game screen starts with Mulai and a five-second countdown; without activation, the round starts automatically once.
- Choose TUNAI, EDC, or QRIS by pointer/touch or by focusing the native button with Tab and activating with Enter/Space.
- A correct choice advances the buyer queue. A wrong choice retains the active buyer during its input lock.
- The in-game result has Lanjut, not Main Lagi. To replay the full journey, restart from its first mini-game.

The game provides visible focus, accessible labels, live announcements for the active request and feedback, and reduced-motion styling. The timer is not announced every second.

## Completion

Only activating Lanjut after a completed 20-second round reports one `accountability` result. Leaving before completion or a handled failure cancels/errors without a score. The game does not write prior results or leaderboard entries.

## Score rubric

The displayed game score starts at 0. A correct choice adds 10; a wrong choice subtracts 5 with a per-decision floor of 0. The theoretical maximum is 1,670 raw points. At Lanjut only, the host score is `clamp(round(rawScore * 100 / 1670), 0, 100)`; the game result continues to show the unmodified raw score and statistics.

## Assets

All scene and character art is original local SVG/CSS, payment symbols use the existing ISC-licensed `lucide-react` package, and the success sound is synthesized locally with Web Audio. No BRI logo or Vantis reference asset is used. See the [asset manifest](assets/ASSET-MANIFEST.md) for source, permission/license, attribution, and usage.

AU Passata is the requested primary font, but no official licensed web-font file is available. Do not fetch an unofficial copy. Until a locally supplied file with suitable web-embedding rights is available, the game uses Arial/sans-serif and does not claim identical typography.

## Run and verify

From the repository root:

```sh
npm ci
npm run dev:web
npm run typecheck
npm test
npm run build
```

Use `npm run dev` when the full web/API development environment is needed. The Accountability browser game runs inside the host journey. Record only checks actually performed in the [target verification report](docs/verification.md); the copied source verification report under `docs/reference/` describes another project and is not target evidence.

## Reference documents

- [Product requirements](docs/reference/01-product-requirements.md)
- [UX/UI specification](docs/reference/02-ux-ui-spec.md)
- [Technical design](docs/reference/03-technical-design.md)
- [Implementation plan](docs/reference/04-implementation-plan.md)
- [Test plan](docs/reference/05-test-plan.md)
- [Verification status](docs/verification.md)

## Checklist

- [x] OpenSpec change approved.
- [x] Original/local asset provenance documented; licensed AU Passata remains a prerequisite.
- [x] Controls and scoring documented.
- [x] Contract and journey tests, typecheck, and production build pass.
- [ ] Only the Accountability slot is enabled after all integration checks.