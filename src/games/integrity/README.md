# Integrity

Owner boundary: `src/games/integrity/`. Do not edit another value's code, the shared journey, or leaderboard to award points.

- **OpenSpec:** create a value-specific change such as `integrity-mini-game` with proposal, spec, design, and tasks before implementation.
- **Entry point:** export the playable game from this directory and register it in `src/games/index.ts` only after it passes integration checks. Currently unavailable.
- **Controls:** specify pointer and keyboard actions, visible focus, and pre-game instructions in your OpenSpec change; mechanics are not chosen yet.
- **Completion:** use the shared game contract to report one completed result for `integrity`, or cancel/error without points.
- **Score rubric:** document how actual play earns an integer 0-100; no placeholder score may enter a run.
- **Assets:** record author/source, license or permission, required attribution, and where each asset is used; never copy from the Vantis reference.
- **Verification:** run `npm run typecheck`, `npm test`, and `npm run build` locally.
- **Checklist:** [ ] OpenSpec change approved; [ ] original/licensed assets documented; [ ] controls and scoring documented; [ ] contract and journey tests pass; [ ] only this value is changed.