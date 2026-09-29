# Integrity

Owner boundary: `src/games/integrity/`. Do not edit another value's code, the shared journey, or leaderboard to award points.

- **OpenSpec:** change `integrity-mini-game` (`openspec/changes/integrity-mini-game/`: proposal, design, specs, tasks).
- **Entry point:** `IntegrityGame` in `IntegrityGame.tsx` (a `PlayableGame`), registered in `src/games/index.ts` as available. Rollback: set `available: false` for the `integrity` slot.
- **Controls:** pointer moves the launcher and the primary button fires; keyboard uses Left/Right arrows or A/D to move, Space to fire, M to mute or unmute, Escape to cancel. The play area is focusable with a visible focus outline and receives focus when the round starts. Fire has a 250 ms cooldown. A labelled mute button (also toggled with M) is available in the briefing and during play; the choice is stored in `localStorage` under `integrity-game:muted`. Audio starts only after the start button and never blocks play if it fails. Reduced motion moves targets in 500 ms steps.
- **Completion:** a 25 s round ends at time-out and shows a summary; the single "Lanjut" button calls `onComplete({ valueId: 'integrity', score })` exactly once. Escape or "Batal" calls `onCancel` (no score). An engine failure calls `onError` (no score). Unmounting mid-round reports nothing.
- **Score rubric:** +5 per aligned hit, -5 per violation hit, escaped targets change nothing; final score is the running total clamped to an integer 0-100. Each round has 20 aligned and 12 violation targets, so a perfect round is 100.
- **Assets:** original inline SVG components in `art.tsx` (no BRI logo, wordmark, or official card design), one CC0 music track, and sound effects synthesized in code.

  | Asset | Author / source | License / permission | Attribution | Usage |
  | --- | --- | --- | --- | --- |
  | `EdcLauncher` (SVG) | Original, in-repo | Original work, project-owned | None required | Player launcher at the bottom of the play area |
  | `CardProjectile` (SVG) | Original, in-repo | Original work, project-owned | None required | Card fired upward from the launcher |
  | `CheckIcon`, `CrossIcon`, `SpeakerIcon`, `SpeakerOffIcon` (SVG) | Original, in-repo | Original work, project-owned | None required | Hit feedback icons and the mute button |
  | `assets/integrity-bgm.m4a` | "Level 1" from "5 Chiptunes (Action)" by Juhani Junkala (SubspaceAudio), https://opengameart.org/content/5-chiptunes-action | CC0 (confirmed in the pack's INFO.txt) | None required | Looping background music during the round, played at about half the effects volume. Converted WAV to AAC 96 kbps (macOS `afconvert`), 74.25 s, about 880 KB |
  | Fire, aligned hit, violation hit, countdown, and end sound effects | Original, synthesized in `audio.ts` with oscillators | Original work, project-owned; no sample files | None required | Played from engine state changes during the round |

- **Verification:** run `npm run typecheck`, `npm test`, and `npm run build` locally. Component tests run in jsdom via a `// @vitest-environment jsdom` docblock.
- **Checklist:** [x] OpenSpec change written; [x] original assets documented; [x] controls and scoring documented; [x] contract and journey tests pass; [x] only this value is changed (plus the registry slot and its test); [ ] word bank human review; [ ] manual play at 1280x720 (pointer, keyboard, reduced motion).

## Word bank

`words.json` holds the `aligned` and `violation` Indonesian entries the round samples from. The game never calls an LLM or any API at runtime.

Provenance:

- **Generator command:** `node --env-file=.env src/games/integrity/scripts/generate-words.mjs` (needs `FOUNDRY_ENDPOINT` (either the project URL ending in `/api/projects/<project>` or the full Responses API URL ending in `/openai/v1/responses`) and `FOUNDRY_API_KEY`, optional `FOUNDRY_DEPLOYMENT` (default `gpt-5-mini`), in the gitignored `.env`; writes only `data/integrity-words.candidates.json`, never `words.json`).
- **Model:** `gpt-5-mini` via Azure AI Foundry (`FOUNDRY_ENDPOINT`) (Responses API, structured output).
- **Generation date:** 2026-09-29. Foundry produced 77 aligned and 72 violation candidates in the ignored `data/integrity-words.candidates.json`; human review PENDING. The committed `words.json` still contains the earlier manual draft, not these candidates.
- **Reviewer:** TBD; generated candidates must be reviewed before replacing any committed entries.

Review rules:

- Reject ambiguous or context-dependent words (for example "fleksibel", "loyal").
- Reject slurs, person names, and brand names.
- Prefer concrete workplace behaviors.
- Keep both categories balanced in difficulty.
- Format: 1-2 words, at most 18 characters, no duplicates across categories (enforced by `words.test.ts`).
