# Spec Delta

## Purpose

This capability lets players quickly recognize and catch appropriate first responses to three customer needs in an accessible arcade matching round at the fifth BRILiaN Way stage.

## ADDED Requirements

### Requirement: Briefed three-pair round
The Customer Focus stage SHALL present the goal and controls before starting a single 45-second round. The round SHALL show exactly three stationary customer situations on the left and a cycling lane of six solution cards on the right: one correct response per situation and three plausible distractors that are correct for none of them. Cards SHALL appear in a different shuffled order between plays. The initial correct pairs SHALL represent assisted login guidance for an older customer, fallback/payment support for a merchant with a failed QRIS payment, and transaction-status checking for a pending transfer. All response text MUST describe initial service directions or clearly incorrect alternatives without soliciting credentials or promising a transaction outcome. Newly added distractor wording MUST receive authorized content review before it appears in the enabled game.

#### Scenario: Player starts the round
- **WHEN** the player begins from the goal and controls view
- **THEN** the game displays all three situations and a moving lane containing three correct and three distractor cards, and starts the 45-second countdown

#### Scenario: Cases preserve the intended responses
- **WHEN** the three situations and six cards are presented
- **THEN** each situation has exactly the corresponding initial response listed above, three distractors match none of the situations, and replay changes the cards' starting order

### Requirement: Readable reflex lane
The six remaining solution cards SHALL move cyclically through the right-side lane, with a visible subset readable at any instant and missed cards returning without an automatic error or score penalty. Motion SHALL accelerate after each correct match but remain catchable; while a card is hovered, focused, selected or dragged, the player SHALL be able to read and act on it without it moving away. The 45-second countdown SHALL continue while card motion is paused. A successful catch SHALL visibly move or connect the card to its customer and a wrong attempt SHALL visibly return the card to the lane. A non-color streak indicator SHALL increase on consecutive correct matches and reset after a wrong match without changing the specified score formula.

#### Scenario: Missed card returns
- **WHEN** an unmatched card passes out of the visible lane without being selected
- **THEN** it returns on a subsequent cycle without consuming an attempt or locking a pair

#### Scenario: Catch and streak
- **WHEN** the player correctly matches two cards in succession
- **THEN** both pairs lock, the second match shows a streak of two, and the remaining cards move faster

#### Scenario: Readable pause
- **WHEN** the player hovers over, focuses, selects or drags a moving card
- **THEN** the card remains available and legible long enough to act on while the round timer continues

### Requirement: Pointer and keyboard matching
The game SHALL let a player drag a response onto a situation with a pointer, or select a response and then a situation with the keyboard, with equivalent matching outcomes. Every unmatched card, including one currently outside the visible lane, SHALL remain reachable by keyboard without waiting for its next cycle; focusing it SHALL bring it into view. It SHALL indicate selection, focus, matched pairs, streak, and incorrect attempts using readable text or symbols in addition to color. Correct matches SHALL stay paired and leave the lane; an incorrect match, including a distractor dropped on a customer, SHALL show immediate feedback, leave both available, reset the streak, and count as one incorrect attempt. Releasing a drag outside a valid situation or changing selection without attempting a pair SHALL NOT count as an incorrect attempt.

#### Scenario: Correct pointer match
- **WHEN** the player drops the correct response on an unmatched situation before time expires
- **THEN** the game confirms and locks that pair and increments the correct-pair count once

#### Scenario: Incorrect keyboard match
- **WHEN** the player selects a response and an unmatched situation that do not belong together
- **THEN** the game announces the incorrect attempt, increments the wrong-attempt count once, and keeps both available

#### Scenario: Abandoned drag
- **WHEN** the player releases a dragged response outside an unmatched situation
- **THEN** no pair is changed and no wrong-attempt penalty is applied

#### Scenario: Distractor dropped on a customer
- **WHEN** the player drops a distractor on an unmatched customer
- **THEN** the card returns to circulation, one incorrect attempt is recorded, and that customer remains available

#### Scenario: Keyboard reaches an offscreen card
- **WHEN** a keyboard-only player focuses a solution currently outside the visible lane
- **THEN** that card becomes visible, stays readable, and can be matched by the same select-and-assign controls

### Requirement: Timed score and completion
The round SHALL end when all three pairs are correct or 45 seconds have elapsed, whichever occurs first. At round end, the game SHALL compute one integer score as `max(0, 20 * correctPairs + (allThreeMatched ? floor(40 * remainingMilliseconds / 45000) : 0) - 5 * incorrectAttempts)`, capped at 100, where remainingMilliseconds is clamped to 0..45000 at the final correct match; timeout yields no speed bonus. It SHALL show the frozen score and matching outcome before the player proceeds, then submit exactly one completion result for the current Customer Focus value to the shell when the player continues. An incomplete timeout SHALL still count as a completed round, including a possible score of 0.

#### Scenario: Perfect fast completion
- **WHEN** the player matches all three pairs without a mistake while time remains
- **THEN** the round ends immediately and shows 60 base points plus an integer speed bonus from 0 to 40; continuing submits that score once

#### Scenario: Timeout with partial progress
- **WHEN** time expires after one correct match and no incorrect attempts
- **THEN** the round ends and displays one of three matched and 20 points without a speed bonus; continuing submits 20 points once

#### Scenario: Wrong attempts cannot produce a negative score
- **WHEN** accumulated penalties exceed earned points at round end
- **THEN** the displayed and submitted score is 0

### Requirement: Safe exit and accessible presentation
The game SHALL offer a cancel action while ready or playing; cancellation SHALL submit no score. A game failure SHALL use the existing error callback without submitting a result. Instructions, countdown, feedback, and results SHALL remain legible at 1280x720 and 1440x900, support keyboard focus and announced feedback, and provide stationary solution cards with the same rules when reduced motion is preferred. Motion SHALL NOT be the sole indication of success, failure, or streak.

#### Scenario: Player cancels an unfinished round
- **WHEN** the player activates cancel before completion or timeout
- **THEN** the game exits without a completion score

#### Scenario: Keyboard-only play
- **WHEN** the player uses only the keyboard from the goal view through all three correct matches
- **THEN** the player can start, select and match each pair, perceive feedback, and complete the round without a pointer

#### Scenario: Reduced-motion play
- **WHEN** the player prefers reduced motion and starts a round
- **THEN** all six available cards remain stationary and keyboard/pointer matching, timer, feedback, and score rules stay equivalent