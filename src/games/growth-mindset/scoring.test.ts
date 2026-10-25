import { describe, expect, it } from 'vitest'
import { LEVELS, PASS_SCORE, ROUND_MS, isPassing, scoreRound } from './scoring'

describe('growth mindset level curve', () => {
  it('ramps from easy to hard: faster display, never shorter patterns', () => {
    for (let index = 1; index < LEVELS.length; index += 1) {
      expect(LEVELS[index].stepMs).toBeLessThan(LEVELS[index - 1].stepMs)
      expect(LEVELS[index].length).toBeGreaterThanOrEqual(LEVELS[index - 1].length)
    }
  })

  it('keeps total display time within half the round', () => {
    const display = LEVELS.reduce((sum, level) => sum + level.length * level.stepMs, 0)
    expect(display).toBeLessThanOrEqual(ROUND_MS / 2)
  })
})

describe('growth mindset scoring', () => {
  it('awards 100 for clearing every level', () => {
    expect(LEVELS.reduce((sum, level) => sum + level.points, 0)).toBe(100)
    expect(scoreRound(5, 0)).toBe(100)
  })

  it('awards 0 without any correct input', () => {
    expect(scoreRound(0, 0)).toBe(0)
  })

  it('awards 15 for clearing only level 1', () => {
    expect(scoreRound(1, 0)).toBe(15)
  })

  it('adds floored partial credit for the unfinished level', () => {
    expect(scoreRound(3, 2)).toBe(61)
    expect(scoreRound(3, 3)).toBe(66)
  })

  it('clamps out-of-range input to integers within 0-100', () => {
    expect(scoreRound(-2, -5)).toBe(0)
    expect(scoreRound(9, 9)).toBe(100)
    expect(scoreRound(0, 99)).toBe(15)
    expect(Number.isInteger(scoreRound(2.7, 1.9))).toBe(true)
  })

  it('passes at 65 and fails at 64', () => {
    expect(PASS_SCORE).toBe(65)
    expect(isPassing(64)).toBe(false)
    expect(isPassing(65)).toBe(true)
  })
})
