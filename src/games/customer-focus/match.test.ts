import { describe, expect, it } from 'vitest'
import { cases, solutionOrder } from './cases'
import { draftDistractors } from './draft-distractors'
import { circuitMs, finishRound, matchPair, scoreRound, startRound } from './rules'

describe('Customer Focus cases', () => {
  it('keeps three unique distractor drafts out of the approved production cards', () => {
    expect(draftDistractors).toHaveLength(3)
    expect(new Set([...cases.map(({ id }) => id), ...draftDistractors.map(({ id }) => id)]).size).toBe(6)
    expect(new Set([...cases.map(({ solution }) => solution), ...draftDistractors.map(({ text }) => text)]).size).toBe(6)
    expect(solutionOrder).toHaveLength(3)
    expect(solutionOrder.every((id) => cases.some((item) => item.id === id))).toBe(true)
    const approvedIds = new Set<string>(solutionOrder)
    const approvedSolutions = new Set<string>(cases.map(({ solution }) => solution))
    expect(draftDistractors.every(({ id, text }) =>
      !approvedIds.has(id) && !approvedSolutions.has(text),
    )).toBe(true)
    expect(draftDistractors.map(({ text }) => text).join(' ')).not.toMatch(/\b(PIN|password|kata sandi|OTP|dijamin|pasti berhasil|transfer ulang)\b/i)
  })

  it('contains three distinct service situations and a different, one-to-one response order', () => {
    expect(cases.map(({ id }) => id)).toEqual(['login', 'qris', 'transfer'])
    expect(solutionOrder).toEqual(['qris', 'transfer', 'login'])
    expect(new Set(solutionOrder).size).toBe(3)
    expect(new Set(cases.map(({ customer }) => customer)).size).toBe(3)
    expect(new Set(cases.map(({ solution }) => solution)).size).toBe(3)
  })

  it('uses service directions without requesting credentials or promising resolution', () => {
    expect(cases[0].solution).toMatch(/dampingi.*panduan resmi/i)
    expect(cases[1].solution).toMatch(/QRIS.*dukungan.*opsi pembayaran/i)
    expect(cases[2].solution).toMatch(/periksa status transaksi.*kanal resmi/i)
    expect(cases.map(({ solution }) => solution).join(' ')).not.toMatch(/\b(PIN|password|kata sandi|OTP|dijamin|pasti berhasil|transfer ulang)\b/i)
  })
})

describe('Customer Focus round', () => {
  it('shuffles six cards between plays and cycles missed cards without a penalty', () => {
    const first = startRound(() => 0)
    const replay = startRound(() => .99)
    expect(new Set(first.order).size).toBe(6)
    expect(first.order).not.toEqual(replay.order)
    expect(startRound(() => .99).order).not.toEqual(replay.order)
    expect(matchPair(first, first.order[0], null, 42_000)).toBe(first)
    expect(first.incorrectAttempts).toBe(0)
  })

  it('returns distractors, resets streak on wrong matches, and accelerates correct catches', () => {
    const first = matchPair(startRound(() => 0), 'login', 'login', 40_000)
    expect(first.streak).toBe(1)
    expect(circuitMs(first.matched.length)).toBe(10_000)
    const wrong = matchPair(first, 'guide-only', 'qris', 30_000)
    expect(wrong).toMatchObject({ streak: 0, incorrectAttempts: 1, matched: ['login'] })
    expect(wrong.order).toContain('guide-only')
    const next = matchPair(wrong, 'qris', 'qris', 20_000)
    expect(next.streak).toBe(1)
    expect(circuitMs(next.matched.length)).toBe(8_000)
    expect(circuitMs(0)).toBe(12_000)
    expect(matchPair(next, 'transfer', 'transfer', 0)).toMatchObject({ score: 35, phase: 'finished' })
  })
  it('locks each correct pair and counts only attempted wrong matches', () => {
    const first = matchPair(startRound(), 'login', 'login', 40_000)
    expect(first.matched).toEqual(['login'])
    expect(first.feedback).toBe('correct')
    expect(matchPair(first, 'login', 'login', 39_000)).toBe(first)
    expect(matchPair(first, 'qris', null, 38_000)).toBe(first)
    const wrong = matchPair(first, 'qris', 'transfer', 37_000)
    expect(wrong).toMatchObject({ matched: ['login'], incorrectAttempts: 1, feedback: 'incorrect' })
    expect(matchPair(wrong, 'qris', 'qris', 35_000)).toMatchObject({ matched: ['login', 'qris'], incorrectAttempts: 1 })
  })

  it('finishes early with a bounded integer speed bonus and never changes a finished round', () => {
    const first = matchPair(startRound(), 'login', 'login', 45_000)
    const second = matchPair(first, 'qris', 'qris', 40_000)
    const finished = matchPair(second, 'transfer', 'transfer', 22_500)
    expect(finished).toMatchObject({ phase: 'finished', matched: ['login', 'qris', 'transfer'], score: 80 })
    expect(matchPair(finished, 'login', 'transfer', 10_000)).toBe(finished)
    expect(scoreRound(3, 0, 45_000)).toBe(100)
    expect(scoreRound(3, 0, 90_000)).toBe(100)
    expect(Number.isInteger(scoreRound(3, 1, 23_456))).toBe(true)
  })

  it('scores partial and empty timeouts without a bonus or negative points', () => {
    const one = matchPair(startRound(), 'login', 'login', 20_000)
    expect(finishRound(one)).toMatchObject({ phase: 'finished', score: 20 })
    expect(finishRound(startRound()).score).toBe(0)
    expect(scoreRound(1, 5, 20_000)).toBe(0)
    expect(scoreRound(3, 30, 45_000)).toBe(0)
  })

  it('lets the deadline win over a final match', () => {
    const one = matchPair(startRound(), 'login', 'login', 30_000)
    const two = matchPair(one, 'qris', 'qris', 10_000)
    expect(matchPair(two, 'transfer', 'transfer', 0)).toMatchObject({ phase: 'finished', matched: ['login', 'qris'], score: 40 })
  })
})