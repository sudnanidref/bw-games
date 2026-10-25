# Spec Delta

## MODIFIED Requirements

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
