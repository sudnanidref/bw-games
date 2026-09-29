export const BOARD_SIZE = 5
export const ROUND_SECONDS = 180
export const MAX_INSTRUCTION_CHARACTERS = 35

export const SHAPES = ['circle', 'square', 'triangle'] as const
export const COLORS = ['red', 'blue', 'green'] as const

export type Shape = (typeof SHAPES)[number]
export type Color = (typeof COLORS)[number]
export type Position = { row: number; column: number }
export type GameObject = Position & { shape: Shape; color: Color }
export type Board = GameObject[]
export type GameAction =
  | { type: 'place'; object: GameObject }
  | { type: 'move'; shape: Shape; color: Color; from: Position; to: Position }
  | { type: 'remove'; shape: Shape; color: Color; at: Position }
export type ActionError = 'invalid-object' | 'invalid-move' | 'out-of-bounds' | 'occupied' | 'object-not-found'
export type ActionResult = { ok: true; board: Board; summary: string } | { ok: false; error: ActionError }
export type RoundState = 'instructions' | 'active' | 'resolving' | 'results'
export type RoundStats = {
  countedPlayerInstructions: number
  rejectedPlayerInstructions: number
  remainingSeconds: number
  timedOut: boolean
}
export type Score = { exactMatches: number; accuracy: number; communication: number; speed: number; final: number }

export function isPosition(value: Position): boolean {
  return Number.isInteger(value.row) && Number.isInteger(value.column)
    && value.row >= 0 && value.row < BOARD_SIZE && value.column >= 0 && value.column < BOARD_SIZE
}

function isValidObject(object: GameObject): boolean {
  return SHAPES.includes(object.shape) && COLORS.includes(object.color) && isPosition(object)
}

function samePosition(first: Position, second: Position): boolean {
  return first.row === second.row && first.column === second.column
}

function findObjectIndex(board: Board, shape: Shape, color: Color, at: Position): number {
  return board.findIndex((object) => object.shape === shape && object.color === color && samePosition(object, at))
}

export function applyAction(board: Board, action: GameAction): ActionResult {
  if (action.type === 'place') {
    if (!isValidObject(action.object)) return { ok: false, error: 'invalid-object' }
    if (board.some((object) => samePosition(object, action.object))) return { ok: false, error: 'occupied' }
    return { ok: true, board: [...board, { ...action.object }], summary: `Placed the ${action.object.color} ${action.object.shape}.` }
  }

  if (action.type === 'move') {
    if (!isPosition(action.from) || !isPosition(action.to)) return { ok: false, error: 'out-of-bounds' }
    const sourceIndex = findObjectIndex(board, action.shape, action.color, action.from)
    if (sourceIndex < 0) return { ok: false, error: 'object-not-found' }
    const rowDistance = Math.abs(action.to.row - action.from.row)
    const columnDistance = Math.abs(action.to.column - action.from.column)
    if (rowDistance + columnDistance !== 1) return { ok: false, error: 'invalid-move' }
    if (board.some((object) => samePosition(object, action.to))) return { ok: false, error: 'occupied' }
    const nextBoard = board.map((object, index) => index === sourceIndex ? { ...object, ...action.to } : object)
    return { ok: true, board: nextBoard, summary: `Moved the ${action.color} ${action.shape}.` }
  }

  if (!isPosition(action.at)) return { ok: false, error: 'out-of-bounds' }
  const sourceIndex = findObjectIndex(board, action.shape, action.color, action.at)
  if (sourceIndex < 0) return { ok: false, error: 'object-not-found' }
  return { ok: true, board: board.filter((_, index) => index !== sourceIndex), summary: `Removed the ${action.color} ${action.shape}.` }
}

export function generateTarget(random: () => number = Math.random): Board {
  const cells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => index)
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[cells[index], cells[swapIndex]] = [cells[swapIndex], cells[index]]
  }
  const count = 3 + Math.floor(random() * 4)
  return cells.slice(0, count).map((cell) => ({
    row: Math.floor(cell / BOARD_SIZE), column: cell % BOARD_SIZE,
    shape: SHAPES[Math.floor(random() * SHAPES.length)],
    color: COLORS[Math.floor(random() * COLORS.length)],
  }))
}

export function calculateScore(target: Board, finalBoard: Board, stats: RoundStats): Score {
  const exactMatches = target.reduce((matches, targetObject) => matches + Number(finalBoard.some((object) =>
    object.shape === targetObject.shape && object.color === targetObject.color
    && object.row === targetObject.row && object.column === targetObject.column)), 0)
  const denominator = Math.max(target.length, finalBoard.length, 1)
  const accuracy = Math.min(100, Math.max(0, (100 * exactMatches) / denominator))
  const communication = Math.min(100, Math.max(0, 100
    - 10 * Math.max(0, stats.countedPlayerInstructions - target.length)
    - 10 * stats.rejectedPlayerInstructions))
  const speed = stats.timedOut ? 0 : Math.min(100, Math.max(0, (100 * stats.remainingSeconds) / ROUND_SECONDS))
  const final = Math.min(100, Math.max(0, Math.round(0.7 * accuracy + 0.2 * communication + 0.1 * speed)))
  return { exactMatches, accuracy, communication, speed, final }
}

export function countInstructionCharacters(instruction: string): number {
  return Array.from(instruction).filter((character) => !/\s/u.test(character)).length
}

export function limitInstruction(instruction: string, limit = MAX_INSTRUCTION_CHARACTERS): string {
  let count = 0
  let result = ''
  for (const character of instruction) {
    if (/\s/u.test(character)) result += character
    else if (count < limit) { result += character; count += 1 }
  }
  return result
}