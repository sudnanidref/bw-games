# Collaborative: Blind Builder

Owner boundary: `src/games/collaborative/`. The hub owns the journey, other values, and leaderboard. The implementation change is `integrate-collaborative-blind-builder` under `openspec/changes/`; the mechanic was ported from the neighboring `../collab-game` PoC, not imported at runtime.

- **Entry point:** `BlindBuilder.tsx` implements `PlayableGame`; the `collaborative` registry slot mounts it after a valid Integrity result.
- **Goal:** in a 180-second round, describe the visible target so the teammate can recreate 3-6 colored shapes on its empty 5x5 board. The target is never sent to the instruction service.
- **Controls:** type an instruction of at most 35 non-whitespace characters and press Enter or Send; Shift+Enter adds a line. Place, remove, or move one shape per instruction. For moves, select the source using row/column or A1-E5 (letter = row) and say left, right, up, or down; each move advances exactly one cell. Submit round ends early, Exit game cancels, Play again discards the unconfirmed result, and Continue journey submits the finished score once. The toolbar has a labelled mute button; the preference is shared with the other games. Buttons and textarea have visible keyboard focus.
- **Completion:** submitting or timing out shows target, final board, and score breakdown. Only Continue journey calls `onComplete({ valueId: 'collaborative', score })`; exit calls `onCancel` without points and an unrecoverable game failure calls `onError`. Recoverable instruction failures leave the board unchanged for retry.
- **Score rubric:** accuracy is `100 * exactMatches / max(target.length, finalBoard.length, 1)`; communication is `max(0, 100 - 10 * max(0, countedInstructions - target.length) - 10 * rejectedInstructions)`; speed is `100 * remainingSeconds / 180`, or zero on timeout. Components are clamped to 0-100; the final integer is `round(0.7 * accuracy + 0.2 * communication + 0.1 * speed)`. A valid zero is still a completed round.
- **Assets:** the board pieces and interface shapes are original CSS, adapted from the team's Blind Builder PoC. The looping CC0 track is `../integrity/assets/integrity-bgm.m4a` ("Level 1" from "5 Chiptunes (Action)" by Juhani Junkala/SubspaceAudio, https://opengameart.org/content/5-chiptunes-action), reused through `../integrity/audio.ts`; no attribution is required. It stops on results, exit, and unmount. Fonts and shared visual tokens come from the hub's baseline. Do not copy assets from the Vantis reference.
- **Verification:** with Node 22.22.2 or newer, run `npm run typecheck`, `npm test`, and `npm run build`; inspect 1280x720, 1440x900, keyboard focus, and a narrower viewport.
- **Checklist:** [x] OpenSpec change recorded; [x] assets documented; [x] controls and scoring documented; [ ] contract and journey tests pass; [ ] integration review complete.

## Instruction service

Blind Builder uses this hub's `POST /api/instruction` endpoint. The server receives the teammate board, latest instruction, transcript, and round ID, never the target board. Instructions have a 35 non-whitespace-character limit. Use Node 22.22.2 or newer for the hub's native SQLite and DOM test dependencies.

- `INSTRUCTION_MODE=auto` (default): use a configured model, otherwise interpret instructions locally without credentials.
- `INSTRUCTION_MODE=deterministic`: always use the local interpreter.
- `INSTRUCTION_MODE=llm`: require a configured model; missing configuration is an error.

For Azure AI Foundry, configure `AZURE_FOUNDRY_ENDPOINT` (HTTPS OpenAI-compatible v1 base URL), `AZURE_FOUNDRY_API_KEY`, and `AZURE_FOUNDRY_DEPLOYMENT` together on the API host. Foundry takes precedence over optional `OPENAI_API_KEY` and `OPENAI_MODEL` (default `gpt-4o-mini`). Never expose keys through Vite client variables or commit a local environment file. Provider output is schema-checked and retried once on failure; a second failure returns a recoverable response without altering the board. Without a provider, the game remains playable in deterministic mode.
