# Design

## Context

The shell (`src/App.tsx`) mounts a slot's `component` with `context`, `onComplete`, `onCancel`, and `onError` only after the player presses "Mulai game", and shows the slot's `briefing` before that. `validateCompletion` accepts one integer score from 0 to 100 per value, in order. The app is React 19 + Vite + TypeScript. Vitest defaults to the node environment and only `src/App.test.tsx` runs in jsdom. `tsconfig.app.json` typechecks all of `src` with only `vite/client` types. The `.env` and `data/` paths are gitignored. Shared tokens live in `src/styles.css` (`--integrity: #f0aa45`, `--ink`, `--paper`, display and body fonts), and a global reduced-motion rule shortens CSS animations and transitions. `src/games/registry.test.ts` asserts every slot is unavailable. See proposal.md for motivation and the two delta specs for required behavior.

## Goals / Non-Goals

**Goals:**

- Keep every game rule (timing, movement, hits, cooldown, scoring) in pure, deterministic code that can be tested without a DOM or real time.
- Keep all Integrity work inside `src/games/integrity/`, except for the registry entry and the unavoidable registry-test change.
- Make pointer and keyboard play produce the same engine inputs.

**Non-Goals:**

- Shell-level (cross-game) audio settings. The mute control lives inside the Integrity game only.
- Runtime LLM calls, server endpoints, or leaderboard changes.
- Anti-cheat beyond the shared contract's validation.
- Mobile or touch controls.

## Decisions

### 1. Module layout inside the slot

```
src/games/integrity/
  IntegrityGame.tsx      React component (PlayableGame): phases briefing -> playing -> result
  engine.ts              pure state + step(state, dtMs, input) -> state
  round.ts               createRound(words, rng) + seeded RNG (mulberry32)
  scoring.ts             finalScore(alignedHits, violationHits) -> 0..100 integer
  words.json             curated word bank { aligned: string[], violation: string[] }
  art.tsx                inline SVG components: EdcLauncher, CardProjectile
  integrity.css          styles scoped under .integrity-game, using shared tokens
  scripts/generate-words.mjs   offline generator (Node, not typechecked, not bundled)
  *.test.ts(x)           engine, round, scoring, words, component tests
```

We use inline SVG React components instead of image files. They need no asset pipeline, inherit shared CSS variables, and make provenance simple (original, authored in-repo). The rejected alternative, PNG sprites, would need licensing records and would scale poorly.

### 2. Pure fixed-step engine and a thin React renderer

`engine.ts` owns all game state in normalized coordinates: x from 0 to 1 across the play width, 3 row lanes, and a launcher at the bottom. `step()` advances by elapsed milliseconds (capped at 50 ms per call, so tab switches cannot teleport objects) and applies inputs: `moveTo(x)`, `moveBy(dir)`, and `fire`. The round clock lives in the engine, not in `setTimeout`, so tests can advance time exactly. The component runs one `requestAnimationFrame` loop that feeds real deltas into `step()` and renders targets as absolutely positioned elements with `transform: translateX()`. It cancels the loop on phase change and unmount.

We chose DOM elements over `<canvas>` because they give crisp text, give the play area real focus handling, and can be queried by Testing Library. About 35 moving elements is well within DOM limits. A canvas renderer would be faster but harder to test and to make accessible.

Target schedule: `createRound` assigns the 32 targets to rows and spawn offsets so all of them enter within about the first 19 seconds and each crosses the play area in about 6 seconds, leaving every target hittable before time-out. Target width is a fixed normalized size that fits 18 characters at 18px or larger at 1280x720. Target elements share one visual style; category is data only.

Projectiles move straight up at a speed that crosses the play height in about 350 ms. A hit is detected when the projectile's x lies within a target's span in a lane it is crossing; the lowest lane is checked first. On a hit, the target and projectile are removed and a feedback item is created. Cooldown is tracked in engine time.

### 3. Input mapping

Pointer movement over the play area maps `clientX` to normalized x and dispatches `moveTo`. A primary-button `pointerdown` dispatches `fire`. Keyboard handlers on the focusable play area (`tabIndex=0`, visible `:focus-visible` outline) map ArrowLeft/A and ArrowRight/D to a held direction that moves at a fixed normalized speed per second, Space to `fire` (with `preventDefault` to stop scrolling), and Escape to cancel. The start button moves focus to the play area so keyboard players need no extra Tab.

### 4. Reduced motion

`matchMedia('(prefers-reduced-motion: reduce)')` is read once when the round starts. In reduced mode the engine computes target positions from a quantized clock, `floor(t / 500) * 500`, so the rendered positions and hit detection agree. Only the display movement changes; timer, counts, and scoring do not. Hit feedback renders as static text. The global CSS rule already disables animation on feedback elements.

### 5. Scoring and completion

`finalScore = clamp(5 * alignedHits - 5 * violationHits, 0, 100)`. The running score shown in the HUD is unclamped, so players see the penalty. When the engine clock reaches 25 000 ms, the component moves to a result phase that shows aligned hits, violation hits, and the final score, with a single "Lanjut" button. The button calls `onComplete({ valueId: context.valueId, score })` once; a ref guard prevents double calls. Unmounting before that point reports nothing. Cancel is available in the briefing and playing phases. Any exception thrown by `step()` is caught in the loop and reported through `onError`.

We chose an explicit button over auto-reporting at time-out so the player can read the summary before the shell's stage transition replaces it.

### 6. Word bank generation and sampling

`scripts/generate-words.mjs` runs as `node --env-file=.env src/games/integrity/scripts/generate-words.mjs`. It reads `FOUNDRY_ENDPOINT` and `FOUNDRY_API_KEY`, calls the Azure AI Foundry resource (for this team, `bri-team-1-foundry`) on its OpenAI v1 route (`/openai/v1/responses`, bearer key auth) with the deployment name (default `gpt-5-mini`, overridable via `FOUNDRY_DEPLOYMENT`) and a structured JSON output schema `{ aligned: string[], violation: string[] }`, and asks for about 80 of each in Indonesian workplace/banking context, each 1-2 words and at most 18 characters. It then applies the same format filters as the validation test and writes `data/integrity-words.candidates.json` (gitignored). A human copies approved entries into `words.json`. The script never writes `words.json`.

Using `.mjs` keeps the script out of `tsconfig.app.json` (TypeScript files only) and out of the Vite bundle (never imported), with no shared config changes. The exact request shape for the API must be checked against current Azure AI Foundry docs at implementation time.

Review rules, recorded in the README: reject ambiguous or context-dependent words, reject slurs, names, and brand names, prefer concrete workplace behaviors, and keep categories balanced in difficulty.

`createRound(words, rng)` uses a Fisher–Yates shuffle with an injected `rng`. Production uses `Math.random`, and tests use seeded mulberry32. It picks 20 aligned and 12 violation entries, then shuffles them together into lanes.

### 7. Registry integration

Once the component passes its tests, `src/games/index.ts` gets `component: IntegrityGame`, `available: true`, and a short Indonesian `briefing` for the Integrity slot only. `registry.test.ts` must change from "all unavailable" to asserting the five ids and order, and that `available` implies a `component` is present. That shared-file edit is flagged for team review in the PR.

### 8. Audio

A small `audio.ts` module owns one lazily created `AudioContext`, created inside the start-button handler to satisfy browser autoplay rules. It has a master gain with separate music and effects gains; music is set to roughly half the effects volume.

- **Music:** "Level 1" from *5 Chiptunes (Action)* by Juhani Junkala (SubspaceAudio). The source is https://opengameart.org/content/5-chiptunes-action, and it is licensed CC0 (the author's INFO.txt confirms this). It was converted from WAV to AAC at 96 kbps, which gives a 74 s file of about 880 KB. The file is stored at `src/games/integrity/assets/integrity-bgm.m4a` and imported as a Vite asset URL, so it is fingerprinted and not inlined. It is loaded with `fetch` + `decodeAudioData` and played through an `AudioBufferSourceNode` with `loop = true`, which gives a tighter loop than `<audio loop>`.
- **Sound effects:** synthesized with oscillators and short gain envelopes, so no files are needed:
  - fire: a short noise/square "whoosh"
  - aligned hit: a rising two-note chime
  - violation hit: a low descending buzz
  - countdown: a tick at 5, 4, 3, 2 and 1 seconds
  - end: a short jingle
- **Mute:** the flag is stored in `localStorage` under `integrity-game:muted`, with every read and write wrapped in try/catch. Toggling it sets the master gain to 0 immediately.
- **Where events come from:** the engine stays pure. The component compares the previous and next engine state (projectile count grew, hit counters changed, whole second crossed within the last 5 s, finished) and calls audio functions. This keeps audio out of engine tests.
- **Failure handling:** every audio call is guarded, so a missing `AudioContext`, a failed fetch, or a failed decode silently disables sound. Audio errors are never passed to `onError`.
- **Cleanup:** on cancel, finish or unmount the music source is stopped and the context is closed.

We chose a code-synthesized, file-free approach for sound effects over CC0 sample packs because it avoids more provenance entries and bundle weight, and short retro blips fit the arcade style. We did not synthesize the music as well, because code-composed music sounds thin next to a produced chiptune loop.

## Risks / Trade-offs

- [Lower rows block upper rows, so a perfect 100 needs precise timing] → This is intended skill ceiling; 3 rows and 6 s crossing time keep it achievable. We will tune speed during manual playtesting without changing counts or scoring.
- [LLM candidates include wrong or ambiguous labels] → Human review is mandatory, the validation test checks format only, and the README records the reviewer.
- [Players memorize the word bank] → A pool of 40+/30+ with random sampling of 20/12 limits this. It is acceptable for a non-prize leaderboard.
- [Frame-rate differences affect play] → Engine uses delta time with a 50 ms cap; outcomes depend on elapsed time, not frame count.
- [Shared registry test edit conflicts with other teams] → Keep the new assertion generic (`available` implies `component`) so it works for every slot, and land it in a small, separate commit.
- [AAC encoder padding adds a tiny gap at the loop point] → The gap is barely audible for a chiptune loop. If needed, re-encode as a trimmed Ogg/Opus later, with no spec change.
- [Audio adds about 880 KB to the Integrity chunk] → The asset is fetched only when the round starts, not at page load.
- [Brand confusion from EDC/card look] → Use a generic silhouette with no BRI logo, wordmark, or official card design; swap only after documented brand approval.

## Migration Plan

This is a new slot with no data migration. Merge the slot code with `available: false` first, then flip the registry entry in a final commit after integration checks pass. Rollback sets `available: false` for Integrity.
