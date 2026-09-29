# Tasks

## 1. Foundation and Visual Contract

- [ ] 1.1 Scaffold a desktop React/TypeScript/Vite app and small API service with runnable dev, build, test, and typecheck scripts; verify install, build, and typecheck succeed on a clean checkout.
- [ ] 1.2 Add shared arcade design tokens and a visual guidance document covering the original five-stop motif, five value accents, typography, desktop sizing, motion, control/HUD patterns, and licensed asset policy; verify the shell uses the tokens and the guide identifies the reference as style-only.

## 2. Game Slots and Journey

- [ ] 2.1 Add the five ordered registry slots under `src/games/` with per-slot README guardrails, OpenSpec workflow, asset provenance fields, score rubric placeholder, and integration checklist; verify an automated structural check finds all five identifiers and required documentation, with no production game marked playable.
- [ ] 2.2 Add typed game input/result/cancel/error contracts and score validation, plus unit tests for score bounds, value mismatch, and duplicate completion; verify the focused test suite and typecheck pass.
- [ ] 2.3 Implement the named-player start screen, fixed-order stage route, unavailable state, transitions, score HUD, and five-result total view; verify journey tests cover blank names, skipping, cancellation, zero score, incomplete slots, and aggregation with test-only fixtures.
- [ ] 2.4 Document the shell/slot boundary and local contribution process with example value-specific OpenSpec change names; verify a developer can locate entry point, contract, controls expectations, and local test commands from any slot README.

## 3. Persistent Leaderboard

- [ ] 3.1 Implement SQLite-backed leaderboard API with ordered five-score validation, server-side total and completion time, trimmed 1-24-character names, run idempotency, rate limiting, and deterministic ranking; verify API tests cover valid entries, invalid/incomplete payloads, duplicate submissions, persistence, and ties.
- [ ] 3.2 Add final-run submission and leaderboard view to the shell, rendering names as text and handling network failure without losing a completed result; verify UI tests cover submission gating, successful ranking, error state, and unsafe name text.
- [ ] 3.3 Document leaderboard setup, data storage, reset/retention considerations, and unauthenticated anti-cheat limitations; verify documented local startup and API tests succeed.

## 4. Cross-Module Integration

- [ ] 4.1 Add CI gates for app build, typecheck, journey/contract tests, API tests, and slot guardrails; verify the workflow succeeds on the scaffold without needing any of the five future games.
- [ ] 4.2 Run a desktop end-to-end check using test-only game fixtures for five sequential completions and leaderboard submission, and a production check showing unavailable games cannot create scores; verify both paths and document observed outcomes.