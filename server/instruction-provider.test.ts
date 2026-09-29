import { describe, expect, it, vi } from 'vitest'
import { ValidatedInstructionProvider, buildInstructionPayload, getConfiguredInstructionProvider, readFoundryConfig, readInstructionMode } from './instruction-provider'

const request = { roundId: 7, instruction: 'Move C3 blue square left', board: [
  { shape: 'square' as const, color: 'blue' as const, row: 0, column: 0 },
  { shape: 'square' as const, color: 'blue' as const, row: 2, column: 2 },
], transcript: [{ speaker: 'teammate' as const, text: 'Ready.' }] }

describe('instruction provider', () => {
  it('supports deterministic mode without credentials and validates provider configuration', () => {
    expect(readInstructionMode({})).toBe('auto')
    expect(getConfiguredInstructionProvider({ INSTRUCTION_MODE: 'deterministic' })).toBeNull()
    expect(getConfiguredInstructionProvider({ INSTRUCTION_MODE: 'auto' })).toBeNull()
    expect(() => getConfiguredInstructionProvider({ INSTRUCTION_MODE: 'llm' })).toThrow(/requires a configured/)
    expect(() => readFoundryConfig({ AZURE_FOUNDRY_API_KEY: 'x' })).toThrow(/configured together/)
    expect(readFoundryConfig({ AZURE_FOUNDRY_ENDPOINT: 'https://example.com/openai/v1/', AZURE_FOUNDRY_API_KEY: 'x', AZURE_FOUNDRY_DEPLOYMENT: 'gpt-5-mini' })?.deployment).toBe('gpt-5-mini')
  })

  it('keeps the target and round ID out of the provider payload', () => {
    expect(buildInstructionPayload(request)).toEqual({ board: request.board, instruction: request.instruction, transcript: request.transcript })
  })

  it('accepts compliant output and rejects a mismatched source after a retry', async () => {
    const valid = { type: 'action', action: { type: 'move', shape: 'square', color: 'blue', from: { row: 2, column: 2 }, to: { row: 2, column: 1 } } }
    const complete = vi.fn().mockResolvedValue(JSON.stringify(valid))
    await expect(new ValidatedInstructionProvider('gpt-5-mini', complete).requestOutcome(request)).resolves.toEqual(valid)
    expect(complete.mock.calls[0][0].messages[0].content).toContain('letters A-E identify rows')
    const wrong = vi.fn().mockResolvedValue(JSON.stringify({ ...valid, action: { ...valid.action, from: { row: 0, column: 0 } } }))
    await expect(new ValidatedInstructionProvider('gpt-5-mini', wrong).requestOutcome(request)).rejects.toThrow(/different source/)
    expect(wrong).toHaveBeenCalledTimes(2)
  })
})