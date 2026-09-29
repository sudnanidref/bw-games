import { describe, expect, it } from 'vitest'
import { finalScore, runningScore } from './scoring'

describe('finalScore', () => {
  it.each([
    [20, 0, 100],
    [1, 4, 0],
    [14, 3, 55],
    [0, 0, 0],
  ])('%i aligned and %i violation hits score %i', (aligned, violation, expected) => {
    expect(finalScore(aligned, violation)).toBe(expected)
  })

  it('returns an integer within 0-100 for every reachable hit count', () => {
    for (let aligned = 0; aligned <= 20; aligned += 1) {
      for (let violation = 0; violation <= 12; violation += 1) {
        const score = finalScore(aligned, violation)
        expect(Number.isInteger(score)).toBe(true)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      }
    }
  })

  it('keeps the running score unclamped', () => {
    expect(runningScore(1, 4)).toBe(-15)
  })
})
