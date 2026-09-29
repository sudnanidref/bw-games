import { z } from 'zod'
import { COLORS, MAX_INSTRUCTION_CHARACTERS, SHAPES, countInstructionCharacters, type RoundState } from './game'
import { explicitMoveSource } from './instructions'

const positionSchema = z.object({ row: z.number().int().min(0).max(4), column: z.number().int().min(0).max(4) }).strict()
const objectSchema = positionSchema.extend({ shape: z.enum(SHAPES), color: z.enum(COLORS) }).strict()
const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('place'), object: objectSchema }).strict(),
  z.object({ type: z.literal('move'), shape: z.enum(SHAPES), color: z.enum(COLORS), from: positionSchema, to: positionSchema }).strict(),
  z.object({ type: z.literal('remove'), shape: z.enum(SHAPES), color: z.enum(COLORS), at: positionSchema }).strict(),
])

export const outcomeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('action'), action: actionSchema }).strict(),
  z.object({ type: z.literal('clarification'), message: z.string().min(1).max(300) }).strict(),
  z.object({ type: z.literal('message'), message: z.string().min(1).max(300) }).strict(),
])

const boardSchema = z.array(objectSchema).max(25).superRefine((board, context) => {
  const cells = new Set<string>()
  board.forEach(({ row, column }, index) => {
    const key = `${row}:${column}`
    if (cells.has(key)) context.addIssue({ code: 'custom', path: [index], message: 'Board cells must be unique.' })
    cells.add(key)
  })
})

export const instructionRequestSchema = z.object({
  roundId: z.number().int().positive(),
  instruction: z.string().trim().min(1).max(200).refine(
    (value) => countInstructionCharacters(value) <= MAX_INSTRUCTION_CHARACTERS,
    `Instructions may contain at most ${MAX_INSTRUCTION_CHARACTERS} non-space characters.`,
  ),
  board: boardSchema,
  transcript: z.array(z.object({ speaker: z.enum(['player', 'teammate']), text: z.string().max(500) }).strict()).max(100),
}).strict()

export const instructionResponseSchema = z.object({ roundId: z.number().int().positive(), outcome: outcomeSchema }).strict()
export type InstructionRequest = z.infer<typeof instructionRequestSchema>
export type InstructionOutcome = z.infer<typeof outcomeSchema>

export function outcomeMatchesSource(request: InstructionRequest, outcome: InstructionOutcome): boolean {
  if (outcome.type !== 'action' || outcome.action.type !== 'move') return true
  const { from, shape, color } = outcome.action
  const source = explicitMoveSource(request.instruction)
  if (source && (source.row !== from.row || source.column !== from.column)) return false
  const matches = request.board.filter((object) => object.shape === shape && object.color === color)
  if (matches.length > 1 && !source) return false
  return matches.some((object) => object.row === from.row && object.column === from.column)
}

export function parseCurrentInstructionResponse(body: unknown, roundId: number, roundState: RoundState) {
  if (roundState !== 'resolving') return null
  const parsed = instructionResponseSchema.safeParse(body)
  return parsed.success && parsed.data.roundId === roundId ? parsed.data : null
}