import { describe, expect, it } from 'vitest'
import { applyAction, calculateScore, countInstructionCharacters, generateTarget, limitInstruction, MAX_INSTRUCTION_CHARACTERS, ROUND_SECONDS, type Board } from './game'

const piece = { shape: 'circle' as const, color: 'red' as const, row: 0, column: 0 }

describe('Blind Builder board and score', () => {
  it('generates 3-6 pieces in distinct legal cells', () => {
    for (let iteration = 0; iteration < 100; iteration += 1) {
      const target = generateTarget()
      expect(target.length).toBeGreaterThanOrEqual(3)
      expect(target.length).toBeLessThanOrEqual(6)
      expect(new Set(target.map(({ row, column }) => `${row}:${column}`)).size).toBe(target.length)
      expect(target.every(({ row, column }) => row >= 0 && row < 5 && column >= 0 && column < 5)).toBe(true)
    }
  })

  it('places, moves one cardinal cell, and removes without mutating the original board', () => {
    const placed = applyAction([], { type: 'place', object: piece })
    expect(placed).toMatchObject({ ok: true, board: [piece] })
    if (!placed.ok) return
    const moved = applyAction(placed.board, { type: 'move', shape: 'circle', color: 'red', from: { row: 0, column: 0 }, to: { row: 0, column: 1 } })
    expect(moved).toMatchObject({ ok: true, board: [{ row: 0, column: 1 }] })
    if (!moved.ok) return
    expect(applyAction(moved.board, { type: 'remove', shape: 'circle', color: 'red', at: { row: 0, column: 1 } })).toMatchObject({ ok: true, board: [] })
    expect(placed.board).toEqual([piece])
  })

  it('rejects illegal moves, occupied cells, and invalid objects without mutation', () => {
    const board: Board = [piece, { shape: 'square', color: 'blue', row: 0, column: 1 }]
    for (const to of [{ row: 2, column: 0 }, { row: 1, column: 1 }, { row: 0, column: 0 }]) {
      expect(applyAction(board, { type: 'move', shape: 'circle', color: 'red', from: piece, to })).toMatchObject({ ok: false, error: 'invalid-move' })
    }
    expect(applyAction(board, { type: 'move', shape: 'circle', color: 'red', from: piece, to: { row: 0, column: 1 } })).toMatchObject({ ok: false, error: 'occupied' })
    expect(applyAction(board, { type: 'move', shape: 'circle', color: 'red', from: piece, to: { row: -1, column: 0 } })).toMatchObject({ ok: false, error: 'out-of-bounds' })
    expect(applyAction(board, { type: 'place', object: { ...piece, row: -1 } })).toMatchObject({ ok: false, error: 'invalid-object' })
    expect(board).toEqual([piece, { shape: 'square', color: 'blue', row: 0, column: 1 }])
  })

  it('computes weighted scores and accepts zero and 100', () => {
    const target: Board = [piece]
    const stats = { countedPlayerInstructions: 1, rejectedPlayerInstructions: 0, remainingSeconds: ROUND_SECONDS, timedOut: false }
    expect(calculateScore(target, target, stats).final).toBe(100)
    expect(calculateScore(target, [], { ...stats, countedPlayerInstructions: 50, rejectedPlayerInstructions: 50, timedOut: true }).final).toBe(0)
    expect(calculateScore(target, target, { ...stats, timedOut: true }).speed).toBe(0)
    expect(calculateScore(target, [...target, { shape: 'square', color: 'blue', row: 1, column: 1 }], stats).accuracy).toBe(50)
  })

  it('limits instructions by non-whitespace characters', () => {
    expect(countInstructionCharacters('move red   to A1')).toBe(11)
    expect(countInstructionCharacters('a'.repeat(MAX_INSTRUCTION_CHARACTERS + 1))).toBe(36)
    expect(limitInstruction(`${'a'.repeat(36)} to A1`)).toBe(`${'a'.repeat(35)}  `)
  })
})