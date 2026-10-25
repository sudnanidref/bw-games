import { describe, expect, it } from 'vitest'
import { applyAction, countInstructionCharacters, MAX_INSTRUCTION_CHARACTERS, type Board } from './game'
import { outcomeMatchesSource } from './ai-contract'
import { interpretInstruction } from './instructions'
import { GUIDE_GROUPS } from './guide'

describe('in-game instruction guide', () => {
  const examples = GUIDE_GROUPS.flatMap((group) => group.examples)

  it('keeps every example within the instruction limit', () => {
    for (const example of examples) expect(countInstructionCharacters(example), example).toBeLessThanOrEqual(MAX_INSTRUCTION_CHARACTERS)
  })

  it('plays every example successfully in order, starting from an empty board', () => {
    let board: Board = []
    for (const instruction of examples) {
      const outcome = interpretInstruction(instruction, board)
      expect(outcome.type, `${instruction} -> ${JSON.stringify(outcome)}`).toBe('action')
      expect(outcomeMatchesSource({ roundId: 1, instruction, board, transcript: [] }, outcome), instruction).toBe(true)
      if (outcome.type !== 'action') return
      const result = applyAction(board, outcome.action)
      expect(result.ok, `${instruction} -> ${JSON.stringify(result)}`).toBe(true)
      if (result.ok) board = result.board
    }
  })
})
