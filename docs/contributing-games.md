# Contributing a BRILiaN Way game

The application shell and its five-value order are shared. Each developer owns only one directory under `src/games/`: `integrity`, `collaborative`, `accountability`, `growth-mindset`, or `customer-focus`. Start by reading that directory's README and `docs/design-system.md`.

## Plan before coding

Create one OpenSpec change per game, such as `integrity-mini-game` or `customer-focus-mini-game`. Its proposal, spec, design, and tasks must define the mechanic, desktop pointer and keyboard controls, the short goal shown before play, the completion/failure conditions, a verifiable integer 0-100 scoring rubric, asset provenance, and game-specific tests. Do not change another value's game or the shell's scoring rules to make one game work.

## Implement the contract

Export a React component of type `PlayableGame` from your assigned directory. Its `context` contains `valueId`, `playerName`, and readonly `priorResults` in route order. Use `onComplete({ valueId: context.valueId, score })` exactly once on a real completed game, with an integer score from 0 to 100. Use `onCancel()` if the player leaves before finishing, or `onError(error)` for failure; neither awards points. Never write another game's result, stage status, or a leaderboard entry directly.

When the component and its tests are ready, import it in `src/games/index.ts`, set only your slot's `component` and `available: true`, and provide its `briefing`. The shell then shows the shared introduction and mounts the component only on the current stage. Do not use demo or fixture components in the production registry.

## Acceptance

1. The assigned README has an OpenSpec change name, documented controls, scoring rubric, and an asset manifest with source, license/permission, attribution, and usage for every added asset.
2. The game handles completion, cancellation, and failure and cannot directly mutate previous results or skip values.
3. Run `npm run typecheck`, `npm test`, and `npm run build`. Add tests for your score boundaries and gameplay completion, and verify the shared journey tests still pass.
4. Review the shell at 1280x720 and 1440x900, including keyboard focus and reduced-motion behavior. The reference game is inspiration only; do not use its files, screenshots, logos, or exact layout.

RTK and graphifyy are not required for this change. Any future tooling requirement needs its own explicit decision.