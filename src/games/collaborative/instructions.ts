import type { Board, Color, GameAction, Position, Shape } from './game'

export type InstructionOutcome =
  | { type: 'action'; action: GameAction }
  | { type: 'clarification'; message: string }
  | { type: 'message'; message: string }

const shapes: Shape[] = ['circle', 'square', 'triangle']
const colors: Color[] = ['red', 'blue', 'green']

function matchWord<T extends string>(text: string, values: T[]): T | undefined {
  return values.find((value) => new RegExp(`\\b${value}\\b`, 'i').test(text))
}

function parsePosition(text: string): Position | undefined {
  const rowColumn = text.match(/\brow\s*([1-5])\D+column\s*([1-5])\b/i)
    ?? text.match(/\b([1-5])\s*[,/]\s*([1-5])\b/)
  if (rowColumn) return { row: Number(rowColumn[1]) - 1, column: Number(rowColumn[2]) - 1 }
  const positions: Record<string, Position> = {
    'top left': { row: 0, column: 0 }, 'upper left': { row: 0, column: 0 },
    'top center': { row: 0, column: 2 }, 'top right': { row: 0, column: 4 }, 'upper right': { row: 0, column: 4 },
    'center left': { row: 2, column: 0 }, center: { row: 2, column: 2 }, 'center right': { row: 2, column: 4 },
    'bottom left': { row: 4, column: 0 }, 'lower left': { row: 4, column: 0 },
    'bottom center': { row: 4, column: 2 }, 'bottom right': { row: 4, column: 4 }, 'lower right': { row: 4, column: 4 },
  }
  const position = Object.keys(positions).sort((first, second) => second.length - first.length)
    .find((candidate) => new RegExp(`\\b${candidate}\\b`, 'i').test(text))
  return position ? positions[position] : undefined
}

export function explicitMoveSource(text: string): Position | undefined {
  const coordinate = text.match(/\b([a-e])([1-5])\b/i)
  return coordinate
    ? { row: coordinate[1].toUpperCase().charCodeAt(0) - 65, column: Number(coordinate[2]) - 1 }
    : parsePosition(text)
}

export function interpretInstruction(instruction: string, board: Board): InstructionOutcome {
  const text = instruction.trim().toLowerCase()
  const shape = matchWord(text, shapes)
  const color = matchWord(text, colors)
  const position = parsePosition(text)
  const matchingObjects = shape && color ? board.filter((object) => object.shape === shape && object.color === color) : []

  if (/\b(undo|replace|clear)\b/.test(text)) {
    return { type: 'message', message: 'For this round, I can place, move, or remove shapes only.' }
  }
  if (/\b(remove|delete|take away)\b/.test(text)) {
    if (!shape || !color) return { type: 'clarification', message: 'Which color and shape should I remove?' }
    const matchingPosition = position && matchingObjects.some((object) => object.row === position.row && object.column === position.column)
    if (matchingObjects.length > 1 && !matchingPosition) {
      return { type: 'clarification', message: `There are multiple ${color} ${shape} objects. Which cell should I remove?` }
    }
    if (matchingObjects.length === 1) {
      const { row, column } = matchingObjects[0]
      return { type: 'action', action: { type: 'remove', shape, color, at: { row, column } } }
    }
    if (matchingObjects.length > 1 && position && matchingPosition) {
      return { type: 'action', action: { type: 'remove', shape, color, at: position } }
    }
    return { type: 'clarification', message: 'I see more than one. Which cell is it in?' }
  }
  if (/\b(move|shift)\b/.test(text)) {
    if (!shape || !color) return { type: 'clarification', message: 'Which color and shape should I move?' }
    const sourcePosition = explicitMoveSource(text)
    const source = sourcePosition
      ? matchingObjects.find((object) => object.row === sourcePosition.row && object.column === sourcePosition.column)
      : matchingObjects.length === 1 ? matchingObjects[0] : undefined
    if (matchingObjects.length > 1 && !sourcePosition) {
      return { type: 'clarification', message: `There are multiple ${color} ${shape} objects. Which one should I move?` }
    }
    if (sourcePosition && !source) {
      return { type: 'clarification', message: `I can't find a ${color} ${shape} at row ${sourcePosition.row + 1}, column ${sourcePosition.column + 1}. Which cell should I use?` }
    }
    if (!source) return { type: 'message', message: `I can't find a ${color} ${shape} on my board.` }
    const directions: Record<string, Position> = {
      left: { row: 0, column: -1 }, right: { row: 0, column: 1 },
      up: { row: -1, column: 0 }, down: { row: 1, column: 0 },
    }
    const direction = Object.keys(directions).find((word) => new RegExp(`\\b${word}\\b`).test(text))
    const distanceMatch = text.match(/\b([a-z]+|\d+)\s+(?:cells?|steps?|spaces?)\b/)
    const distanceWords: Record<string, number> = {
      a: 1, single: 1, zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
    }
    const distance = distanceMatch
      ? Number.isNaN(Number(distanceMatch[1])) ? distanceWords[distanceMatch[1]] ?? Number.NaN : Number(distanceMatch[1])
      : 1
    if (!direction || /\bdiagonal(?:ly)?\b/.test(text) || distance !== 1) {
      return { type: 'clarification', message: 'Move it one cell left, right, up, or down. Which direction should I use?' }
    }
    const delta = directions[direction]
    return { type: 'action', action: { type: 'move', shape, color,
      from: { row: source.row, column: source.column },
      to: { row: source.row + delta.row, column: source.column + delta.column } } }
  }
  if (/\b(place|put|add)\b/.test(text) || (shape && color && position)) {
    if (!shape || !color || !position) {
      return { type: 'clarification', message: 'Tell me the color, shape, and cell (for example, top left).' }
    }
    return { type: 'action', action: { type: 'place', object: { shape, color, ...position } } }
  }
  return { type: 'message', message: 'I can place, move, or remove a shape. What should I do?' }
}