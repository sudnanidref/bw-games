import type { CaseId } from './cases'
import { draftDistractors } from './draft-distractors'

export const ROUND_MS = 45_000
export type ResponseId = CaseId | (typeof draftDistractors)[number]['id']
const responseIds: readonly ResponseId[] = ['login', 'qris', 'transfer', ...draftDistractors.map(({ id }) => id)]
let previousOrder: readonly ResponseId[] = []

export function circuitMs(correctPairs: number): number {
  return [12_000, 10_000, 8_000][Math.min(2, correctPairs)]
}

export interface Round {
  phase: 'playing' | 'finished'
  matched: readonly CaseId[]
  order: readonly ResponseId[]
  streak: number
  incorrectAttempts: number
  feedback: 'correct' | 'incorrect' | null
  score: number | null
}

export function startRound(random: () => number = Math.random): Round {
  const order = [...responseIds]
  for (let index = order.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }
  if (order.every((id, index) => id === previousOrder[index])) order.push(order.shift()!)
  previousOrder = order
  return { phase: 'playing', matched: [], order, streak: 0, incorrectAttempts: 0, feedback: null, score: null }
}

export function scoreRound(correctPairs: number, incorrectAttempts: number, remainingMs: number): number {
  const timeBonus = correctPairs === 3 ? Math.floor(40 * Math.max(0, Math.min(ROUND_MS, remainingMs)) / ROUND_MS) : 0
  return Math.max(0, Math.min(100, 20 * correctPairs + timeBonus - 5 * incorrectAttempts))
}

export function finishRound(round: Round, remainingMs = 0): Round {
  if (round.phase === 'finished') return round
  return { ...round, phase: 'finished', score: scoreRound(round.matched.length, round.incorrectAttempts, remainingMs) }
}

export function matchPair(round: Round, responseId: ResponseId, customerId: CaseId | null, remainingMs: number): Round {
  if (round.phase === 'finished') return round
  if (remainingMs <= 0) return finishRound(round)
  if (!customerId || !round.order.includes(responseId) || round.matched.includes(responseId as CaseId) || round.matched.includes(customerId)) return round
  if (responseId !== customerId) return { ...round, streak: 0, incorrectAttempts: round.incorrectAttempts + 1, feedback: 'incorrect' }

  const next: Round = { ...round, matched: [...round.matched, customerId], streak: round.streak + 1, feedback: 'correct' }
  return next.matched.length === 3 ? finishRound(next, remainingMs) : next
}