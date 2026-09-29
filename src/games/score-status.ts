export const PASS_SCORE = 65

export function scoreStatus(score: number): 'PASS' | 'FAIL' {
  return score >= PASS_SCORE ? 'PASS' : 'FAIL'
}
