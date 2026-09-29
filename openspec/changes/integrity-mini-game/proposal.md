# Proposal

## Why

The Integrity stage is the first stop of the BRILiaN Way journey and currently has no playable game, so no complete five-stage run can exist. A short target-shooting game where players must pick integrity-aligned words over violations turns the value into a quick, readable decision under time pressure.

## What Changes

- Add a 25-second shooting-gallery game in `src/games/integrity/`: word targets that match or violate integrity move horizontally in mixed rows; the player moves an EDC-style launcher along the bottom and fires card projectiles upward.
- Scoring: +5 for each integrity-aligned target hit, -5 for each violation hit, no penalty for targets that pass; the final score is clamped to an integer 0-100 and reported once through the shared game contract.
- Equal pointer and keyboard controls (move + fire), a pre-game goal briefing, visible non-color hit feedback, pause-free cancel, and a reduced-motion mode.
- A curated, committed word bank: candidate words are generated offline by a developer-run script that calls GPT-5 mini, then reviewed by hand before being saved. Each round samples a fixed number of words from each category, so every round has the same maximum score.
- Looping CC0 chiptune background music and code-synthesized sound effects, with an in-game mute toggle that is remembered per browser.
- Original EDC and card artwork without BRI logos or wordmarks; official brand assets may replace them only after brand approval is documented.
- Register the Integrity slot as available once integration checks pass.

## Capabilities

### New Capabilities

- `integrity-game`: Integrity mini-game mechanic, controls, timing, scoring rubric, completion/cancel behavior, and accessibility behavior.
- `integrity-word-bank`: Curated word-bank format, category rules, offline generation and review workflow, and per-round sampling.

### Modified Capabilities

None. The shared journey, contract, and leaderboard specs are unchanged; this game consumes them as-is.

## Impact

- New code, tests, assets, and a generator script, all under `src/games/integrity/`.
- `src/games/index.ts`: only the Integrity slot's `component`, `available`, and `briefing` change.
- `src/games/registry.test.ts` currently asserts that every slot is unavailable; registering Integrity requires relaxing that assertion. This touches a shared file and needs team agreement.
- The GPT-5 mini API key is used only on a developer machine via the gitignored `.env`; it is never bundled, committed, or called at runtime. There are no new runtime dependencies.
