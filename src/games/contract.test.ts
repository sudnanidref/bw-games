import { describe, expect, it } from 'vitest'
import { isGameResult, validateCompletion } from './contract'

describe('game result contract', () => {
  it('accepts zero and 100 as valid completed scores', () => {
    expect(isGameResult({ valueId: 'integrity', score: 0 })).toBe(true)
    expect(isGameResult({ valueId: 'integrity', score: 100 })).toBe(true)
  })

  it.each([-1, 101, 1.5, Number.NaN, '80'])('rejects invalid score %s', (score) => {
    expect(isGameResult({ valueId: 'integrity', score })).toBe(false)
  })

  it('rejects unknown values, wrong stages, and duplicate completions', () => {
    expect(isGameResult({ valueId: 'other', score: 80 })).toBe(false)
    expect(validateCompletion('integrity', [], { valueId: 'collaborative', score: 80 })).toBeNull()
    expect(validateCompletion('integrity', [{ valueId: 'integrity', score: 50 }], { valueId: 'integrity', score: 80 })).toBeNull()
    expect(validateCompletion('customer-focus', [], { valueId: 'customer-focus', score: 80 })).toBeNull()
  })

  it('returns a validated result for the current stage', () => {
    expect(validateCompletion('collaborative', [{ valueId: 'integrity', score: 0 }], { valueId: 'collaborative', score: 75 }))
      .toEqual({ valueId: 'collaborative', score: 75 })
  })
})