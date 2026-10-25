import { describe, expect, it } from 'vitest'
import { games } from './games'
import { completeStage, createJourney, currentValue, isSkipped, skipStage, stageStatus, totalScore } from './journey'
import { submissionFor } from './leaderboard-client'

describe('five-value journey', () => {
  it('rejects blank and long names and starts at Integrity', () => {
    expect(createJourney('   ', 'run')).toBeNull()
    expect(createJourney('x'.repeat(25), 'run')).toBeNull()
    expect(createJourney('😀'.repeat(24), 'run')?.playerName).toBe('😀'.repeat(24))
    const journey = createJourney('  Ayu  ', 'run')!
    expect(journey.playerName).toBe('Ayu')
    expect(currentValue(journey)).toBe('integrity')
    expect(stageStatus(journey, 'collaborative')).toBe('locked')
    expect(totalScore(journey)).toBeNull()
  })

  it('cannot skip a stage, award unavailable points, or complete after cancel', () => {
    const journey = createJourney('Ayu', 'run')!
    expect(completeStage(journey, { valueId: 'integrity', score: 60 }, false)).toBe(journey)
    expect(completeStage(journey, { valueId: 'collaborative', score: 60 }, true)).toBe(journey)
    expect(currentValue(journey)).toBe('integrity')
  })

  it('counts zero, prevents duplicate/wrong results and totals five stages', () => {
    let journey = createJourney('Ayu', 'run')!
    for (const [index, game] of games.entries()) {
      const score = index * 20
      const next = completeStage(journey, { valueId: game.id, score }, true)
      expect(stageStatus(next, game.id)).toBe('complete')
      expect(completeStage(next, { valueId: game.id, score: 100 }, true)).toBe(next)
      journey = next
    }
    expect(journey.results.map((result) => result.score)).toEqual([0, 20, 40, 60, 80])
    expect(currentValue(journey)).toBeNull()
    expect(totalScore(journey)).toBe(200)
    expect(completeStage(journey, { valueId: 'customer-focus', score: 100 }, true)).toBe(journey)
  })

  it('skips the current stage with 0 points, in order, and keeps the run off the leaderboard', () => {
    let journey = createJourney('Ayu', 'run')!
    journey = skipStage(journey)
    expect(currentValue(journey)).toBe('collaborative')
    expect(isSkipped(journey, 'integrity')).toBe(true)
    expect(isSkipped(journey, 'collaborative')).toBe(false)
    journey = completeStage(journey, { valueId: 'collaborative', score: 70 }, true)
    for (let index = 0; index < 3; index += 1) journey = skipStage(journey)
    expect(journey.results.map((result) => result.score)).toEqual([0, 70, 0, 0, 0])
    expect(totalScore(journey)).toBe(70)
    expect(submissionFor(journey)).toBeNull()
    expect(skipStage(journey)).toBe(journey)

    let clean = createJourney('Ayu', 'run-2')!
    for (const game of games) clean = completeStage(clean, { valueId: game.id, score: 50 }, true)
    expect(submissionFor(clean)?.total).toBe(250)
  })
})