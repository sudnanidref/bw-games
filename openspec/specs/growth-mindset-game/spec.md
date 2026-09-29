# growth-mindset-game Specification

## Purpose

Defines "Pola Tumbuh", the Growth Mindset stage mini game. The player repeats growing arrow patterns within 20 seconds, learns from mistakes without losing the game, and must reach a 65-point pass mark before the journey continues.

## Requirements

### Requirement: Pre-game briefing and start
The game SHALL show a short goal and its controls before play. It SHALL start the round only when the player explicitly chooses to start, by pointer or keyboard (Enter or Space). The 20-second timer SHALL NOT run before the round starts.

#### Scenario: Player starts the round
- **WHEN** the game is mounted and the player activates "Mulai" or presses Enter or Space
- **THEN** the first level begins and the 20-second countdown starts

#### Scenario: Timer idle before start
- **WHEN** the game is mounted and the player has not started
- **THEN** the remaining time shows 20 seconds and does not decrease

### Requirement: Pattern levels
A round SHALL contain 5 levels that ramp from easy to hard. Each later level SHALL display its pattern faster, and SHALL be at least as long as the one before. Level lengths and display speeds SHALL be:

| Level | Arrows | Display per arrow | Difficulty hint |
| --- | --- | --- | --- |
| 1 | 3 | 550 ms | PELAN |
| 2 | 4 | 450 ms | SEDANG |
| 3 | 5 | 380 ms | CEPAT |
| 4 | 5 | 320 ms | LEBIH CEPAT |
| 5 | 6 | 260 ms | TERCEPAT |

Every arrow SHALL be drawn at random from ←, ↑, →, ↓. Each level SHALL first display its pattern one arrow at a time at that level's speed, and then hide it before accepting input. Input given while a pattern is displaying SHALL be ignored. During play, the level label SHALL show the level number and its difficulty hint as text. When a mistake replays a pattern, the replay SHALL use the same level's speed.

#### Scenario: Pattern is shown then hidden
- **WHEN** a level begins
- **THEN** each arrow of the pattern is highlighted in order at that level's display speed, then the pattern is hidden and the arrow controls accept input

#### Scenario: Level 1 is the easiest
- **WHEN** the round starts
- **THEN** level 1 shows 3 arrows at 550 ms each, and the label reads "TAHAP 1 / 5 · PELAN"

#### Scenario: Difficulty increases each level
- **WHEN** the player clears a level before level 5
- **THEN** the next level's pattern is displayed faster than the previous level's, is at least as long, and its label shows the next difficulty hint

#### Scenario: Last level is the hardest
- **WHEN** level 5 begins
- **THEN** it shows 6 arrows at 260 ms each, and the label reads "TAHAP 5 / 5 · TERCEPAT"

#### Scenario: Input during display is ignored
- **WHEN** the player presses an arrow while the pattern is still displaying
- **THEN** the input is not counted as correct or wrong

#### Scenario: Level cleared
- **WHEN** the player enters every arrow of the current pattern in the correct order
- **THEN** the sprout grows one stage and the next level begins; after level 5, the round ends

### Requirement: Mistakes become lessons
A wrong input SHALL NOT end the round or subtract points. The game SHALL mark the wrong position with text and an icon, not color alone, and show a short lesson message. It SHALL then replay the same pattern and let the player try the level again from its first arrow. The only cost of a mistake SHALL be elapsed time.

#### Scenario: Wrong arrow entered
- **WHEN** the player enters an arrow that does not match the pattern position
- **THEN** the game marks that position as a lesson, replays the same pattern, and restarts input for that level from the first arrow, keeping the score already earned

### Requirement: 20-second round limit
Each round SHALL last at most 20 seconds from start, including pattern display time. The round SHALL end when all 5 levels are cleared or the time reaches zero, whichever comes first. The remaining time SHALL be visible during play.

#### Scenario: Time runs out
- **WHEN** 20 seconds have elapsed since the round started
- **THEN** input stops and the round result is calculated

#### Scenario: All levels cleared early
- **WHEN** the player clears level 5 before 20 seconds elapse
- **THEN** the round ends immediately and the round result is calculated

### Requirement: Score rubric
The round score SHALL be an integer from 0 to 100 derived only from play:
- Cleared levels 1-5 SHALL award 15, 18, 20, 22, and 25 points respectively.
- The first unfinished level SHALL award `floor(levelPoints × bestCorrect / patternLength)`, where `bestCorrect` is the highest number of consecutive correct inputs reached in any attempt at that level.
- The final score SHALL be clamped to the range 0 to 100.

#### Scenario: Perfect round
- **WHEN** the player clears all 5 levels
- **THEN** the score is 100

#### Scenario: Partial level credit
- **WHEN** time runs out after the player cleared levels 1-3 and reached at most 2 consecutive correct inputs on level 4
- **THEN** the score is 53 + floor(22 × 2 / 5) = 61

#### Scenario: No correct input
- **WHEN** time runs out before any correct input
- **THEN** the score is 0

### Requirement: 65-point pass gate
The game SHALL treat 65 as the pass mark. When a round scores 65 or more, the game SHALL show the score and a "Lanjut" action that reports exactly one completion to the shell, for `growth-mindset` with that score. When a round scores below 65, the game SHALL NOT report a completion. It SHALL show the score, the 65 target, and two actions: "Coba lagi" starts a fresh round with new patterns and a full 20 seconds, and "Kembali ke menu" leaves the game as a non-scoring cancellation. The stage SHALL therefore stay incomplete, and the next stage stays unreachable, until a round scores at least 65.

#### Scenario: Passing round
- **WHEN** a round ends with score 65 and the player activates "Lanjut"
- **THEN** the game reports one completion `{ valueId: "growth-mindset", score: 65 }` and reports nothing further

#### Scenario: Failing round offers retry
- **WHEN** a round ends with score 64
- **THEN** no completion is reported and the player sees the score, the 65 target, "Coba lagi", and "Kembali ke menu"

#### Scenario: Retry after failing
- **WHEN** the player activates "Coba lagi" after a failing round
- **THEN** a new round starts at level 1 with new patterns, 20 seconds, and no carried-over score

#### Scenario: Back to menu after failing
- **WHEN** the player activates "Kembali ke menu" after a failing round
- **THEN** the game reports a cancellation, no points are awarded, and the Growth Mindset stage remains current

### Requirement: Cancellation and failure reporting
The player SHALL be able to leave at any time with Esc or a visible "Keluar" control. Leaving SHALL report a non-scoring cancellation. An unexpected internal failure SHALL report an error and no score. The game SHALL report at most one outcome per mount (completion, cancellation, or error). It SHALL NOT alter other stages' results, stage status, or leaderboard entries.

#### Scenario: Player exits mid-round
- **WHEN** the player presses Esc during play
- **THEN** the game reports a cancellation and no completion

#### Scenario: Single outcome
- **WHEN** the game has already reported an outcome
- **THEN** further input, including pressing "Lanjut" again, reports nothing

### Requirement: Controls and accessibility
Every action SHALL be available by both keyboard and pointer: arrow keys or W/A/S/D and four on-screen arrow buttons for input; Enter or Space to start or confirm; Esc to leave. All interactive controls SHALL show visible focus. Correct and wrong feedback SHALL use text or icons in addition to color. When the user prefers reduced motion, growth and highlight animations SHALL be replaced by instant state changes. The game SHALL play no audio. It SHALL remain legible without horizontal clipping at 1280×720 and 1440×900.

#### Scenario: Pointer input equals keyboard input
- **WHEN** the player clicks the on-screen ↑ button while input is accepted
- **THEN** it is handled exactly like pressing the ↑ or W key

#### Scenario: Reduced motion
- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** the sprout and arrow highlights change state without animated transitions

### Requirement: Original assets only
All visuals SHALL be original shapes drawn in code, using the shell's colors and fonts. The game SHALL NOT include images, fonts, sounds, or code from the Vantis reference, or official BRI logos. The slot README SHALL record an asset manifest stating that no external assets are used.

#### Scenario: Asset review
- **WHEN** a reviewer checks the growth-mindset slot
- **THEN** its README lists every asset with source, license, attribution, and usage, and no third-party asset files are present
