import { describe, expect, it } from 'vitest'
import { instructionRequestSchema, instructionResponseSchema, outcomeMatchesSource, parseCurrentInstructionResponse } from './ai-contract'

const request = { roundId: 1, instruction: 'Move C3 blue square left', board: [
  { shape: 'square' as const, color: 'blue' as const, row: 0, column: 0 },
  { shape: 'square' as const, color: 'blue' as const, row: 2, column: 2 },
], transcript: [{ speaker: 'teammate' as const, text: 'Ready.' }] }

describe('instruction contract', () => {
  it('rejects target data, duplicate cells, oversized instructions, and unsupported actions', () => {
    expect(instructionRequestSchema.safeParse(request).success).toBe(true)
    expect(instructionRequestSchema.safeParse({ ...request, target: [] }).success).toBe(false)
    expect(instructionRequestSchema.safeParse({ ...request, instruction: 'x'.repeat(36) }).success).toBe(false)
    expect(instructionRequestSchema.safeParse({ ...request, board: [request.board[0], request.board[0]] }).success).toBe(false)
    expect(instructionResponseSchema.safeParse({ roundId: 1, outcome: { type: 'action', action: { type: 'clear' } } }).success).toBe(false)
  })

  it('rejects stale responses or wrong round states', () => {
    const response = { roundId: 1, outcome: { type: 'message', message: 'Ready.' } }
    expect(parseCurrentInstructionResponse(response, 1, 'resolving')).toEqual(response)
    expect(parseCurrentInstructionResponse(response, 2, 'resolving')).toBeNull()
    expect(parseCurrentInstructionResponse(response, 1, 'results')).toBeNull()
  })

  it('rejects a provider move from the wrong duplicate or without an explicit source', () => {
    const action = { type: 'action' as const, action: { type: 'move' as const, shape: 'square' as const, color: 'blue' as const, from: { row: 2, column: 2 }, to: { row: 2, column: 1 } } }
    expect(outcomeMatchesSource(request, action)).toBe(true)
    expect(outcomeMatchesSource(request, { ...action, action: { ...action.action, from: { row: 0, column: 0 } } })).toBe(false)
    expect(outcomeMatchesSource({ ...request, instruction: 'Move blue square left' }, action)).toBe(false)
  })
})