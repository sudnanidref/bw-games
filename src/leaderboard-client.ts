import { totalScore, type Journey } from './journey'
import type { Submission } from './leaderboard'

export function submissionFor(journey: Journey): Submission | null {
  const total = totalScore(journey)
  if (total === null) return null
  return {
    runId: journey.runId,
    playerName: journey.playerName,
    results: journey.results.map((result) => ({ ...result })),
    total,
    completedAt: new Date().toISOString(),
  }
}