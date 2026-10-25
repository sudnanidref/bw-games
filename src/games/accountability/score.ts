export const maximumRawScore = 1_670

export function normalizeAccountabilityScore(rawScore: number): number {
  if (!Number.isFinite(rawScore)) return 0
  return Math.min(100, Math.max(0, Math.round(rawScore * 100 / maximumRawScore)))
}