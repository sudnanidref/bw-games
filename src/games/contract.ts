import type { ComponentType } from 'react'
import { gameSlots, type ValueId } from './slots'

export interface GameResult {
  valueId: ValueId
  score: number
}

export interface GameContext {
  valueId: ValueId
  playerName: string
  priorResults: readonly Readonly<GameResult>[]
}

export interface GameProps {
  context: Readonly<GameContext>
  onComplete: (result: GameResult) => void
  onCancel: () => void
  onError: (error: Error) => void
}

export type PlayableGame = ComponentType<GameProps>

export function isGameResult(input: unknown): input is GameResult {
  if (typeof input !== 'object' || input === null) return false
  const result = input as Record<string, unknown>
  return gameSlots.some((game) => game.id === result.valueId)
    && typeof result.score === 'number'
    && Number.isInteger(result.score)
    && result.score >= 0
    && result.score <= 100
}

export function validateCompletion(current: ValueId, priorResults: readonly GameResult[], input: unknown): GameResult | null {
  if (!isGameResult(input) || input.valueId !== current) return null
  if (priorResults.some((result) => result.valueId === current)) return null
  if (gameSlots[priorResults.length]?.id !== current) return null
  return { valueId: input.valueId, score: input.score }
}