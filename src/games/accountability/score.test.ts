import { describe, expect, it } from 'vitest'
import { maximumRawScore, normalizeAccountabilityScore } from './score'

describe('journey score normalization', () => {
  it.each([
    [0, 0],
    [835, 50],
    [maximumRawScore, 100],
    [2_000, 100],
    [-10, 0],
    [Number.NaN, 0],
  ])('maps raw score %s to integer journey score %s', (rawScore, expected) => {
    const score = normalizeAccountabilityScore(rawScore)
    expect(score).toBe(expected)
    expect(Number.isInteger(score)).toBe(true)
  })
})