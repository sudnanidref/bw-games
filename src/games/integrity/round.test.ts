import { describe, expect, it } from 'vitest'
import { createRound, mulberry32, type WordBank } from './round'

function makeBank(alignedCount: number, violationCount: number): WordBank {
  return {
    aligned: Array.from({ length: alignedCount }, (_, index) => `aligned ${index}`),
    violation: Array.from({ length: violationCount }, (_, index) => `violation ${index}`),
  }
}

describe('createRound', () => {
  const bank = makeBank(45, 35)

  it('creates exactly 20 aligned and 12 violation targets', () => {
    const round = createRound(bank, mulberry32(1))
    expect(round.filter((target) => target.category === 'aligned')).toHaveLength(20)
    expect(round.filter((target) => target.category === 'violation')).toHaveLength(12)
  })

  it('never repeats a word', () => {
    const round = createRound(bank, mulberry32(2))
    expect(new Set(round.map((target) => target.word)).size).toBe(32)
  })

  it('spreads targets over 3 lanes and lets every target enter within 19 s', () => {
    const round = createRound(bank, mulberry32(3))
    expect(new Set(round.map((target) => target.lane))).toEqual(new Set([0, 1, 2]))
    expect(Math.max(...round.map((target) => target.spawnAtMs))).toBeLessThanOrEqual(19_000)
    expect(Math.min(...round.map((target) => target.spawnAtMs))).toBe(0)
  })

  it('is reproducible for the same seed and differs for another seed', () => {
    const first = createRound(bank, mulberry32(42))
    expect(createRound(bank, mulberry32(42))).toEqual(first)
    expect(createRound(bank, mulberry32(43))).not.toEqual(first)
  })

  it('throws when a pool is too small', () => {
    expect(() => createRound(makeBank(19, 35), mulberry32(1))).toThrow(/aligned/)
    expect(() => createRound(makeBank(45, 11), mulberry32(1))).toThrow(/violation/)
  })
})
