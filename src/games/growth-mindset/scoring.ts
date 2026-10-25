import { PASS_SCORE } from '../score-status'

export { PASS_SCORE } from '../score-status'

export const LEVELS = [
  { length: 3, points: 15, stepMs: 550, hint: 'PELAN' },
  { length: 4, points: 18, stepMs: 450, hint: 'SEDANG' },
  { length: 5, points: 20, stepMs: 380, hint: 'CEPAT' },
  { length: 5, points: 22, stepMs: 320, hint: 'LEBIH CEPAT' },
  { length: 6, points: 25, stepMs: 260, hint: 'TERCEPAT' },
] as const

export const ROUND_MS = 20000
export function scoreRound(clearedLevels: number, bestCorrect: number): number {
  const cleared = Math.min(Math.max(Math.trunc(clearedLevels), 0), LEVELS.length)
  let score = LEVELS.slice(0, cleared).reduce((sum, level) => sum + level.points, 0)
  const next = LEVELS[cleared]
  if (next) {
    const correct = Math.min(Math.max(Math.trunc(bestCorrect), 0), next.length)
    score += Math.floor((next.points * correct) / next.length)
  }
  return Math.min(Math.max(score, 0), 100)
}

export function isPassing(score: number): boolean {
  return score >= PASS_SCORE
}
