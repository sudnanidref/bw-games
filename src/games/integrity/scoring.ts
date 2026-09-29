export const POINTS_PER_ALIGNED_HIT = 5
export const POINTS_PER_VIOLATION_HIT = -5

export function runningScore(alignedHits: number, violationHits: number): number {
  return alignedHits * POINTS_PER_ALIGNED_HIT + violationHits * POINTS_PER_VIOLATION_HIT
}

export function finalScore(alignedHits: number, violationHits: number): number {
  const score = runningScore(alignedHits, violationHits)
  return Math.min(100, Math.max(0, score))
}
