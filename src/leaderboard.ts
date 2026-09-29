import { gameSlots } from './games/slots'
import { isGameResult, type GameResult } from './games/contract'

export interface LeaderboardEntry {
  id: number
  playerName: string
  results: GameResult[]
  total: number
  completedAt: string
}

export interface Submission {
  runId: string
  playerName: string
  results: GameResult[]
  total: number
  completedAt: string
}

export function parseSubmission(input: unknown): Submission | null {
  if (typeof input !== 'object' || input === null) return null
  const value = input as Record<string, unknown>
  if (typeof value.runId !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.runId)) return null
  if (typeof value.playerName !== 'string') return null
  const playerName = value.playerName.trim()
  if (Array.from(playerName).length < 1 || Array.from(playerName).length > 24) return null
  if (!Array.isArray(value.results) || value.results.length !== gameSlots.length) return null
  if (!value.results.every((result, index) => isGameResult(result) && result.valueId === gameSlots[index].id)) return null
  const results = value.results.map((result: GameResult) => ({ valueId: result.valueId, score: result.score }))
  const total = results.reduce((sum: number, result: GameResult) => sum + result.score, 0)
  if (value.total !== total || typeof value.completedAt !== 'string' || !Number.isFinite(Date.parse(value.completedAt))) return null
  return { runId: value.runId, playerName, results, total, completedAt: value.completedAt }
}