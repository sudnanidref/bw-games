export function normalizeAccountabilityScore(rawScore: number): number {
  if (!Number.isFinite(rawScore)) return 0
  // Like Integrity, earned points count directly toward the shared 0–100 score.
  return Math.min(100, Math.max(0, Math.round(rawScore)))
}
