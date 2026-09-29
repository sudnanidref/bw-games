import { gameSlots, type ValueId } from './games/slots'
import { validateCompletion, type GameResult } from './games/contract'

export interface Journey {
  playerName: string
  runId: string
  results: readonly GameResult[]
}

export function createJourney(name: string, runId: string): Journey | null {
  const playerName = name.trim()
  const length = Array.from(playerName).length
  if (length < 1 || length > 24 || !runId) return null
  return { playerName, runId, results: [] }
}

export function currentValue(journey: Journey): ValueId | null {
  return gameSlots[journey.results.length]?.id ?? null
}

export function stageStatus(journey: Journey, valueId: ValueId): 'complete' | 'current' | 'locked' {
  const index = gameSlots.findIndex((game) => game.id === valueId)
  return index < journey.results.length ? 'complete' : index === journey.results.length ? 'current' : 'locked'
}

export function completeStage(journey: Journey, input: unknown, available: boolean): Journey {
  const current = currentValue(journey)
  if (!available || !current) return journey
  const result = validateCompletion(current, journey.results, input)
  return result ? { ...journey, results: [...journey.results, result] } : journey
}

export function totalScore(journey: Journey): number | null {
  if (journey.results.length !== gameSlots.length) return null
  return journey.results.reduce((sum, result) => sum + result.score, 0)
}