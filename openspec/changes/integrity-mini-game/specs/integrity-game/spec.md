# Spec Delta

## Purpose

Defines the Integrity stage mini-game: a timed shooting gallery where the player earns points for hitting integrity-aligned words and loses points for hitting violations, reported to the shell as one 0-100 score.

## ADDED Requirements

### Requirement: Pre-game briefing
The game SHALL show its goal, scoring rules (+5 aligned, -5 violation), duration, and both pointer and keyboard controls before play starts. The round timer SHALL NOT start until the player explicitly starts the round.

#### Scenario: Player opens the Integrity stage
- **WHEN** the Integrity game mounts
- **THEN** the briefing is visible, a start action is focusable, and no targets move and no time elapses

### Requirement: Timed round with moving mixed targets
A round SHALL last exactly 25 seconds. Word targets SHALL move horizontally across 3 rows, with adjacent rows moving in opposite directions. Aligned and violation words SHALL be mixed within each row, and a target's row, position, or appearance SHALL NOT reveal its category. Each round SHALL present exactly 20 aligned and 12 violation targets. Each target SHALL stay readable (at least 18px text) while moving.

#### Scenario: Round runs to time
- **WHEN** the player starts the round and 25 seconds pass
- **THEN** targets stop, no further shots are accepted, and the round ends

#### Scenario: Categories are not visually distinguishable
- **WHEN** targets are displayed before they are hit
- **THEN** aligned and violation targets share the same shape, color, and size and differ only in their word

### Requirement: Launcher and card projectiles
The player SHALL control an EDC-style launcher that moves horizontally along the bottom of the play area and fires a card projectile straight up. A projectile SHALL hit the first target it overlaps, remove that target, and stop there. Firing SHALL have a cooldown of 250 ms; fire input during cooldown SHALL be ignored.

#### Scenario: Projectile hits the nearest target in its path
- **WHEN** a card is fired and two targets overlap its column in different rows
- **THEN** only the lower target is hit and removed

#### Scenario: Rapid firing is limited
- **WHEN** the player triggers fire twice within 250 ms
- **THEN** only one card is launched

### Requirement: Equivalent pointer and keyboard controls
With a pointer, the launcher SHALL follow the pointer's horizontal position within the play area, and the primary button SHALL fire. With a keyboard, Left/Right arrow keys (and A/D) SHALL move the launcher and Space SHALL fire. Escape SHALL cancel the game. The play area SHALL show a visible focus indicator while it holds keyboard focus.

#### Scenario: Keyboard-only play
- **WHEN** a player uses only the arrow keys and Space
- **THEN** they can reach every horizontal position and fire, with the same outcomes as pointer play

#### Scenario: Player cancels
- **WHEN** the player presses Escape or activates the cancel control during the briefing or the round
- **THEN** the game calls cancel once, reports no score, and stops all timers

### Requirement: Scoring rubric
Each hit on an aligned target SHALL add 5 points, and each hit on a violation target SHALL subtract 5 points. Targets that leave the play area or remain at time-out SHALL NOT change the score. The running score MAY go below 0 during play, but the reported final score SHALL be the running score clamped to the integer range 0-100. A perfect round (all 20 aligned hit, no violations hit) SHALL score exactly 100.

#### Scenario: Perfect round
- **WHEN** the player hits all 20 aligned targets and no violation targets
- **THEN** the reported score is 100

#### Scenario: Negative running score
- **WHEN** the player hits 1 aligned and 4 violation targets
- **THEN** the reported score is 0

#### Scenario: Mixed round
- **WHEN** the player hits 14 aligned and 3 violation targets
- **THEN** the reported score is 55

### Requirement: Non-color hit feedback
Each hit SHALL show immediate feedback that states the point change and a category icon or label (for example "+5 [check icon] Jujur" or "−5 [cross icon] Suap"; no emoji glyphs), so the result is understandable without color. The running score and remaining time SHALL stay visible during play in fixed-width positions.

#### Scenario: Violation hit feedback
- **WHEN** a card hits a violation target
- **THEN** feedback shows "−5", a cross icon or text label, and the word, and the running score decreases by 5

### Requirement: Completion through the shared contract
When the round ends by time-out, the game SHALL show a result summary (aligned hits, violation hits, final score) and SHALL call the shell's completion callback exactly once with the Integrity value identifier and the clamped final score. On an unexpected runtime failure, the game SHALL call the error callback and report no score.

#### Scenario: Round completes
- **WHEN** the 25-second round ends
- **THEN** completion is reported once as `{ valueId: 'integrity', score }` with an integer score from 0 to 100

#### Scenario: Unmount during play
- **WHEN** the game unmounts before the round ends
- **THEN** no completion is reported and no timers or animation callbacks keep running

### Requirement: Reduced-motion mode
When the user prefers reduced motion, targets SHALL move in discrete steps no more than twice per second instead of smooth animation, and hit feedback SHALL appear without animated motion. Duration, target counts, and scoring SHALL be unchanged.

#### Scenario: Reduced-motion preference
- **WHEN** `prefers-reduced-motion: reduce` is active and the round is running
- **THEN** target positions update in steps at most every 500 ms and the maximum score is still 100

### Requirement: Background music and sound effects with mute
The game SHALL play a looping background music track during the round and short sound effects for firing a card, hitting an aligned target, hitting a violation target, each of the last 5 seconds, and the end of the round. Audio SHALL start only after the player's start action, SHALL stop when the round ends, the game is cancelled, or the game unmounts, and SHALL never block play if audio is unavailable or fails to load. The game SHALL provide a mute toggle reachable by pointer and keyboard (M key and a labelled button) in the briefing and during play; the toggle SHALL show its state with an icon and an accessible label, not color alone, and SHALL be remembered for the next game session on the same browser. Music SHALL be quieter than sound effects.

#### Scenario: Audio starts with the round
- **WHEN** the player starts the round with sound enabled
- **THEN** background music begins looping and firing or hitting a target plays its matching sound effect

#### Scenario: Player mutes
- **WHEN** the player presses M or activates the mute button
- **THEN** all music and sound effects are silenced immediately, the control shows the muted state, and the preference is kept when the game is played again

#### Scenario: Audio unavailable
- **WHEN** the browser cannot create or play audio
- **THEN** the round still runs, scores, and completes normally with no error reported to the shell

#### Scenario: Round ends or is cancelled
- **WHEN** the round ends, the player cancels, or the game unmounts
- **THEN** background music stops and no further sounds play

### Requirement: Original, brand-safe artwork
The launcher SHALL be drawn as an original EDC-style terminal and projectiles as an original payment-card shape, without BRI logos, wordmarks, or official card designs. Sound effects SHALL be synthesized in code or come from CC0 sources, and music SHALL come from a CC0 or explicitly licensed source. Every visual or audio asset SHALL be recorded in the Integrity README asset manifest with author/source, license or permission, attribution, and usage.

#### Scenario: Asset review
- **WHEN** the Integrity slot is prepared for integration
- **THEN** its README lists every asset with provenance, and no BRI logo or wordmark appears in its assets
