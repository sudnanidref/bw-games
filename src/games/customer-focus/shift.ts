import { customers, serviceScore, TIMEOUT_PENALTY } from './service'

export const CUSTOMER_MS = 10_000
export const WARNING_MS = 3_000
export const ATTACK_MS = 1_400
export { TIMEOUT_PENALTY }

export interface ServiceRound {
  phase: 'ready' | 'playing' | 'resolved' | 'attacking' | 'result'
  index: number
  step: number
  resolved: number
  mistakes: number
  timeouts: number
  wrong: readonly number[]
  expression: 'angry' | 'happy' | null
  feedback: string
  deadline: number
  remaining: number
  attackEnds: number
}

export type ServiceAction =
  | { type: 'begin'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'next'; now: number }
  | { type: 'choose'; now: number; choice: number }

export function createServiceRound(): ServiceRound {
  return { phase: 'ready', index: 0, step: 0, resolved: 0, mistakes: 0, timeouts: 0,
    wrong: [], expression: null, feedback: '', deadline: 0, remaining: CUSTOMER_MS, attackEnds: 0 }
}

function arrive(round: ServiceRound, now: number): ServiceRound {
  if (round.index === customers.length - 1) return { ...round, phase: 'result' }
  return { ...round, phase: 'playing', index: round.index + 1, step: 0,
    wrong: [], expression: null, feedback: '', deadline: now + CUSTOMER_MS, remaining: CUSTOMER_MS, attackEnds: 0 }
}

function timeout(round: ServiceRound, now: number): ServiceRound {
  return { ...round, phase: 'attacking', timeouts: round.timeouts + 1,
    remaining: 0, expression: 'angry', attackEnds: now + ATTACK_MS,
    feedback: `Waktu habis! Nasabah menyerang. −${TIMEOUT_PENALTY} poin. Nasabah berikutnya akan datang.` }
}

export function roundScore(round: ServiceRound): number {
  return serviceScore(round.resolved, round.mistakes, round.timeouts)
}

export function advanceService(round: ServiceRound, action: ServiceAction): ServiceRound {
  if (action.type === 'begin') {
    return round.phase === 'ready' ? { ...round, phase: 'playing', deadline: action.now + CUSTOMER_MS } : round
  }
  if (action.type === 'next') return round.phase === 'resolved' ? arrive(round, action.now) : round
  if (action.type === 'tick') {
    if (round.phase === 'attacking') return action.now >= round.attackEnds ? arrive(round, action.now) : round
    if (round.phase !== 'playing') return round
    const remaining = Math.max(0, round.deadline - action.now)
    if (!remaining) return timeout(round, action.now)
    return remaining === round.remaining ? round : { ...round, remaining }
  }
  if (round.phase !== 'playing') return round
  // The deadline wins even if a card click lands before the next interval callback.
  if (action.now >= round.deadline) return timeout(round, action.now)
  const step = customers[round.index].steps[round.step]
  if (!Number.isInteger(action.choice) || !step.cards[action.choice] || round.wrong.includes(action.choice)) return round
  const remaining = Math.max(0, round.deadline - action.now)
  if (action.choice !== step.correct) return { ...round, remaining,
    mistakes: round.mistakes + 1, wrong: [...round.wrong, action.choice], expression: 'angry', feedback: step.hint }
  if (round.step + 1 < customers[round.index].steps.length) return { ...round, remaining,
    step: round.step + 1, wrong: [], expression: 'happy', feedback: 'Respons tepat! Selesaikan langkah berikutnya sebelum waktu habis.' }
  return { ...round, phase: 'resolved', remaining, resolved: round.resolved + 1, wrong: [],
    expression: 'happy', feedback: customers[round.index].resolution }
}
