import { describe, expect, it } from 'vitest'
import { gameConfig, paymentMethods } from './config'

describe('Accountability game configuration', () => {
  it('keeps all source-owned values in one configuration', () => {
    expect(gameConfig).toEqual({
      durationMs: 20_000,
      correctPoints: 10,
      wrongPenalty: 5,
      minimumScore: 0,
      correctTransitionMs: 120,
      wrongLockMs: 500,
      urgentTimeMs: 3_000,
      minimumCharacterCount: 6,
      queueSize: 3,
      autoStartMs: 5_000,
    })
  })

  it('exposes only the three payment methods in their fixed order', () => {
    expect(paymentMethods.map(({ id, label }) => [id, label])).toEqual([
      ['cash', 'TUNAI'],
      ['edc', 'EDC'],
      ['qris', 'QRIS'],
    ])
  })
})