# Spec Delta

## MODIFIED Requirements

### Requirement: 65-point pass gate
The game SHALL treat 65 as the Growth Mindset pass mark. When a round scores 65 or more, the game SHALL show a PASS result and a "Lanjut" action. When a round scores below 65, the game SHALL show a FAIL result, the actual score, the 65-point target, and three actions: "Coba lagi" starts a fresh round with new patterns and a full 20 seconds; "Kembali ke menu" exits to the current stage briefing without recording the attempt; and "Lanjut ke stage berikutnya" reports exactly one completed result to the shell for `growth-mindset` with the actual score. A failed score SHALL be recorded like any other valid 0-100 score and SHALL NOT block the ordered journey when the player chooses to continue. The result SHALL be reported only when the player chooses to continue or completes a passing round. The game SHALL NOT offer navigation to a previous stage.

#### Scenario: Passing round
- **WHEN** a round ends with score 65 or more and the player activates "Lanjut"
- **THEN** the game reports exactly one completion `{ valueId: "growth-mindset", score }` with the actual score and reports nothing further

#### Scenario: Failing round offers retry
- **WHEN** a round ends with score 64
- **THEN** the game shows FAIL, score 64, target 65, "Coba lagi", "Kembali ke menu", and "Lanjut ke stage berikutnya", without yet reporting a result

#### Scenario: Continue after a failed round
- **WHEN** the player activates "Lanjut ke stage berikutnya" after a round scores below 65
- **THEN** the game reports exactly one completion with the actual score, and the shell records the result and advances to the next journey stage

#### Scenario: Retry after failing
- **WHEN** the player activates "Coba lagi" after a failing round
- **THEN** a new round starts at level 1 with new patterns and 20 seconds, and the prior failed attempt is not added to journey results

#### Scenario: Back to menu after failing
- **WHEN** the player activates "Kembali ke menu" after a failing round
- **THEN** the game reports a non-scoring cancellation, the attempt is not recorded, and the current Growth Mindset stage remains incomplete

#### Scenario: No previous-stage navigation
- **WHEN** a round has ended
- **THEN** the game offers no action to return to or replay a previous journey stage

## ADDED Requirements

### Requirement: Growth Mindset pass/fail history
The journey SHALL display the completed Growth Mindset score and a text PASS or FAIL status wherever per-stage results are listed, including the route and the final score breakdown. The status SHALL be derived from the recorded Growth Mindset score: 65 or more is PASS, and below 65 is FAIL. Other games SHALL retain their existing completion display and SHALL NOT inherit this Growth Mindset threshold.

#### Scenario: Failed score is visible after continuing
- **WHEN** the player continues from a Growth Mindset result below 65
- **THEN** the route marks Growth Mindset complete, displays its actual score as FAIL, and makes the next stage current

#### Scenario: Pass/fail appears in final results
- **WHEN** the five-stage journey is complete
- **THEN** the Growth Mindset row in the final score breakdown displays its actual score and PASS or FAIL status

#### Scenario: Other game result status is unchanged
- **WHEN** another game completes with any valid score
- **THEN** its route and final-result display continue to show its existing completion and score without applying the Growth Mindset PASS/FAIL rule
