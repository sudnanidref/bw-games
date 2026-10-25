# Accountability: Kasir Sat Set

The Accountability stop is the Indonesian-language cashier game Kasir Sat Set. The game lives in this directory and is hosted by the existing BRILiaN Way journey; it is not a standalone Vite application.

## OpenSpec

Implementation change: `accountability-mini-game`. Its proposal, behavioral spec, design, and task checklist define the approved scope. The original source package remains read-only; byte-identical references are preserved in [`docs/reference/`](docs/reference/INDEX.md).

## Entry point

`AccountabilityGame` implements the shared `PlayableGame` contract and is registered as the third playable stage in `src/games/index.ts`. Its implementation and scoring are contained in the Accountability directory; other values, the shared journey, and leaderboard rules are unchanged.

## Controls

- The game screen starts with Mulai and a five-second countdown; without activation, the round starts automatically once.
- Choose a payment object by pointer/touch or by focusing its native button with Tab and activating with Enter/Space. The visual and focus order is QRIS stand, cash register, then EDC terminal.
- Payment objects use local transparent SVGs, with no visible button boxes or captions. Accessible names are “Bayar dengan QRIS”, “Bayar tunai”, and “Bayar dengan EDC”. Buyer tokens and the start-screen method guide retain their existing labels.
- A correct choice advances the buyer queue. A wrong choice retains the active buyer during its input lock.
- The in-game result has Lanjut, not Main Lagi. To replay the full journey, restart from its first mini-game.

The game provides visible focus, accessible labels, live announcements for the active request and feedback, and reduced-motion styling. The timer is not announced every second.

## Completion

Only activating Lanjut after a completed 20-second round reports one `accountability` result. Leaving before completion or a handled failure cancels/errors without a score. The game does not write prior results or leaderboard entries.

## Score rubric

The in-round point counter starts at 0. Each correct payment adds **10 points**; each wrong payment subtracts **5 points**, with a minimum of 0 after every decision. The timer remains 20 seconds, with the existing 120 ms correct and 500 ms wrong input locks.

The final score is **`clamp(round(rawScore), 0, 100)`**: earned points count directly, following Integrity's direct-points-and-cap approach. It is no longer divided by a theoretical maximum. The result screen shows this value as **SKOR AKHIR / 100**, retains the uncapped total as **Poin permainan**, and uses the shared **PASS ≥ 65** threshold. Lanjut sends exactly that displayed final score to the journey, once.

| Decisions (correct first, then wrong) | Poin permainan | Final score | Status |
| --- | --- | --- | --- |
| No answers | 0 | 0 | FAIL |
| 6 correct | 60 | 60 | FAIL |
| 7 correct, 1 wrong | 65 | 65 | PASS |
| 7 correct | 70 | 70 | PASS |
| 10 correct | 100 | 100 | PASS |
| 12 correct, 1 wrong | 115 | 100 | PASS |

The per-decision zero floor means answer order can affect the raw total: a wrong answer at zero followed by a correct answer yields 10. All games still contribute at most 100 to the 500-point journey. This aligns the score scale, without claiming identical difficulty across different game mechanics. Existing saved leaderboard entries are not recalculated.

## Assets

All scene and character art is original local SVG/CSS, payment symbols use the existing ISC-licensed `lucide-react` package, and the success sound is synthesized locally with Web Audio. The round reuses the shared CC0 background track `../integrity/assets/integrity-bgm.m4a` ("Level 1" from "5 Chiptunes (Action)" by Juhani Junkala/SubspaceAudio, https://opengameart.org/content/5-chiptunes-action). Music starts with the round, stops at the result or on exit, and the mute button shares its saved preference with the other games. No BRI logo or Vantis reference asset is used. See the [asset manifest](assets/ASSET-MANIFEST.md) for source, permission/license, attribution, and usage.

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

The QRIS–cash–EDC illustration update has its own [verification record](docs/payment-illustrations-verification.md), including production asset loading, keyboard tests, viewport measurements, and checks not performed. The latest scoring checks are recorded at the top of [verification.md](docs/verification.md).

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
- [x] Accountability is registered as stage 03; changes to this game do not alter other slots.
