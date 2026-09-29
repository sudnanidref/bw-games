import { describe, expect, it } from 'vitest'
import { explicitMoveSource, interpretInstruction } from './instructions'
import { applyAction, type Board } from './game'

describe('Blind Builder instructions', () => {
  const board: Board = [
    { shape: 'square', color: 'blue', row: 0, column: 0 },
    { shape: 'square', color: 'blue', row: 2, column: 2 },
  ]

  it('places and removes legal pieces and clarifies missing details', () => {
    expect(interpretInstruction('Put the red circle at top left', [])).toMatchObject({ type: 'action', action: { object: { row: 0, column: 0 } } })
    expect(interpretInstruction('Place a red square at row 2 column 4', [])).toMatchObject({ type: 'action', action: { object: { row: 1, column: 3 } } })
    expect(interpretInstruction('Remove blue square', board)).toMatchObject({ type: 'clarification' })
    expect(interpretInstruction('Remove blue square at row 3 column 3', board)).toMatchObject({ action: { at: { row: 2, column: 2 } } })
    expect(interpretInstruction('Undo the last move', board)).toMatchObject({ type: 'message' })
  })

  it('selects a duplicate by numeric or case-insensitive letter-number source', () => {
    for (const text of ['Move C3 blue square to left', 'Move c3 blue square left', 'Move blue square at 3,3 left']) {
      const outcome = interpretInstruction(text, board)
      expect(outcome).toMatchObject({ type: 'action', action: { from: { row: 2, column: 2 }, to: { row: 2, column: 1 } } })
      if (outcome.type === 'action') expect(applyAction(board, outcome.action)).toMatchObject({ ok: true, board: [{ row: 0, column: 0 }, { row: 2, column: 1 }] })
    }
    expect(explicitMoveSource('Move C3 blue square left')).toEqual({ row: 2, column: 2 })
    expect(interpretInstruction('Move B2 blue square left', board)).toMatchObject({ type: 'clarification' })
    expect(interpretInstruction('Move blue square left', board)).toMatchObject({ type: 'clarification' })
  })

  it('permits only one cardinal step, never a jump or arbitrary destination', () => {
    const unique: Board = [board[1]]
    for (const [direction, to] of [
      ['left', { row: 2, column: 1 }], ['right', { row: 2, column: 3 }],
      ['up', { row: 1, column: 2 }], ['down', { row: 3, column: 2 }],
    ] as const) {
      expect(interpretInstruction(`Move blue square one cell ${direction}`, unique)).toMatchObject({ action: { to } })
    }
    for (const text of ['Move blue square two cells right', 'Move blue square diagonally left', 'Move blue square to row 3 column 3']) {
      expect(interpretInstruction(text, unique)).toMatchObject({ type: 'clarification' })
    }
  })
})