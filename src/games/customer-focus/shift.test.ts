import { describe, expect, it } from 'vitest'
import { customers } from './service'
import { advanceService, ATTACK_MS, createServiceRound, CUSTOMER_MS, roundScore, WARNING_MS } from './shift'

const begin = () => advanceService(createServiceRound(), { type: 'begin', now: 100 })

describe('per-customer service deadlines', () => {
  it('shares one ten-second deadline across both choices and wrong attempts', () => {
    let round = begin()
    round = advanceService(round, { type: 'choose', choice: 0, now: 2100 })
    expect(round.mistakes).toBe(1)
    expect(round.deadline).toBe(10100)
    round = advanceService(round, { type: 'choose', choice: 1, now: 7100 })
    expect(round.step).toBe(1)
    expect(round.remaining).toBe(WARNING_MS)
    expect(round.deadline).toBe(10100)
    round = advanceService(round, { type: 'choose', choice: 0, now: 10099 })
    expect(round.phase).toBe('resolved')
    expect(round.resolved).toBe(1)
    expect(advanceService(round, { type: 'tick', now: 90000 })).toBe(round)
    round = advanceService(round, { type: 'next', now: 90000 })
    expect(round.phase).toBe('playing')
    expect(round.remaining).toBe(CUSTOMER_MS)
    expect(round.deadline).toBe(100000)
  })
  it('attacks exactly once at the deadline, rejects late cards, then starts a fresh customer', () => {
    let round = begin()
    round = advanceService(round, { type: 'choose', choice: 1, now: 10100 })
    expect(round).toMatchObject({ phase: 'attacking', step: 0, resolved: 0, timeouts: 1, expression: 'angry' })
    expect(advanceService(round, { type: 'choose', choice: 1, now: 10200 })).toBe(round)
    expect(advanceService(round, { type: 'next', now: 10200 })).toBe(round)
    expect(advanceService(round, { type: 'tick', now: 10100 + ATTACK_MS - 1 })).toBe(round)
    round = advanceService(round, { type: 'tick', now: 10100 + ATTACK_MS })
    expect(round).toMatchObject({ phase: 'playing', index: 1, step: 0, timeouts: 1, remaining: CUSTOMER_MS, expression: null })
    expect(round.deadline).toBe(10100 + ATTACK_MS + CUSTOMER_MS)
  })
  it('does not complete a partial conversation and charges the timeout penalty', () => {
    let round = begin()
    for (const choice of [1, 0]) round = advanceService(round, { type: 'choose', choice, now: 200 })
    expect(roundScore(round)).toBe(17)
    round = advanceService(round, { type: 'next', now: 500 })
    round = advanceService(round, { type: 'choose', choice: 2, now: 600 })
    round = advanceService(round, { type: 'tick', now: 10500 })
    expect(round).toMatchObject({ phase: 'attacking', resolved: 1, timeouts: 1 })
    expect(roundScore(round)).toBe(7)
  })
  it('finishes after the final customer attack with bounded points, even after a suspended tab', () => {
    let round = begin()
    let now = 100
    for (let index = 0; index < customers.length; index++) {
      now += 1_000_000
      round = advanceService(round, { type: 'tick', now })
      expect(round.phase).toBe('attacking')
      expect(round.timeouts).toBe(index + 1)
      round = advanceService(round, { type: 'tick', now: now + ATTACK_MS })
    }
    expect(round.phase).toBe('result')
    expect(roundScore(round)).toBe(0)
    expect(advanceService(round, { type: 'tick', now: now + 2_000_000 })).toBe(round)
  })
})
