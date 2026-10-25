import { describe, expect, it } from 'vitest'
import { normalizeAccountabilityScore } from './score'
import { scoreStatus } from '../score-status'

describe('journey score normalization', () => {
  it.each([
    [0, 0],
    [10, 10],
    [45, 45],
    [60, 60],
    [64, 64],
    [65, 65],
    [70, 70],
    [95, 95],
    [100, 100],
    [110, 100],
    [1_670, 100],
    [2_000, 100],
    [64.49, 64],
    [64.5, 65],
    [-10, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [Number.NEGATIVE_INFINITY, 0],
  ])('maps raw score %s to integer journey score %s', (rawScore, expected) => {
    const score = normalizeAccountabilityScore(rawScore)
    expect(score).toBe(expected)
    expect(Number.isInteger(score)).toBe(true)
  })

  it('uses the shared PASS threshold at 65 earned points', () => {
    expect(scoreStatus(normalizeAccountabilityScore(60))).toBe('FAIL')
    expect(scoreStatus(normalizeAccountabilityScore(65))).toBe('PASS')
    expect(scoreStatus(normalizeAccountabilityScore(70))).toBe('PASS')
  })
})
