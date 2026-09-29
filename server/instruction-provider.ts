import OpenAI from 'openai'
import { outcomeMatchesSource, outcomeSchema, type InstructionOutcome, type InstructionRequest } from '../src/games/collaborative/ai-contract'

export interface InstructionProvider {
  requestOutcome(request: InstructionRequest): Promise<InstructionOutcome>
}
export interface FoundryConfig { endpoint: string; apiKey: string; deployment: string }
interface CompletionRequest {
  model: string
  response_format: { type: 'json_object' }
  messages: Array<{ role: 'system' | 'user'; content: string }>
}
type CompletionTransport = (request: CompletionRequest) => Promise<string | null>
type ProviderEnvironment = Readonly<Record<string, string | undefined>>
export type InstructionMode = 'auto' | 'llm' | 'deterministic'

const systemPrompt = [
  'You are a concise, collaborative teammate building a 5 by 5 board from player instructions.',
  'The board coordinates are zero-based integers from 0 to 4. The player sees each cell labeled A1 through E5: letters A-E identify rows and numbers 1-5 identify columns.',
  'Only use circle, square, or triangle; only use red, blue, or green.',
  "Return exactly one JSON object: {type:'action',action:...}, {type:'clarification',message:string}, or {type:'message',message:string}.",
  'Executable action types are only place, move, and remove. Do not add fields.',
  "For moves, use the object's current cell as 'from'. A letter-number coordinate such as C3 names the source cell (row 2, column 2 in zero-based coordinates), not the destination; the direction determines the one-cell destination. Numeric row and column coordinates are one-based. If multiple objects match, require a source cell that contains the requested object.",
  'A move is exactly one cell left, right, up, or down. Never move diagonally, to an arbitrary destination, or more than one cell; clarify unsupported move requests.',
  'Ask for clarification when the instruction is ambiguous. Never guess a missing color, shape, or position.',
  'The input contains the teammate board, latest player instruction, and prior transcript. It never contains the target.',
].join(' ')

export function readInstructionMode(environment: ProviderEnvironment = process.env): InstructionMode {
  const mode = environment.INSTRUCTION_MODE?.trim().toLowerCase() || 'auto'
  if (mode === 'auto' || mode === 'llm' || mode === 'deterministic') return mode
  throw new Error('INSTRUCTION_MODE must be auto, llm, or deterministic.')
}

export function readFoundryConfig(environment: ProviderEnvironment = process.env): FoundryConfig | null {
  const endpoint = environment.AZURE_FOUNDRY_ENDPOINT?.trim()
  const apiKey = environment.AZURE_FOUNDRY_API_KEY?.trim()
  const deployment = environment.AZURE_FOUNDRY_DEPLOYMENT?.trim()
  const configuredValues = [endpoint, apiKey, deployment].filter(Boolean).length
  if (!configuredValues) return null
  if (configuredValues !== 3 || !endpoint || !apiKey || !deployment) {
    throw new Error('AZURE_FOUNDRY_ENDPOINT, AZURE_FOUNDRY_API_KEY, and AZURE_FOUNDRY_DEPLOYMENT must be configured together.')
  }
  const parsedEndpoint = new URL(endpoint)
  if (parsedEndpoint.protocol !== 'https:') throw new Error('AZURE_FOUNDRY_ENDPOINT must use HTTPS.')
  return { endpoint: parsedEndpoint.toString(), apiKey, deployment }
}

export function buildInstructionPayload(request: InstructionRequest) {
  return { board: request.board, instruction: request.instruction, transcript: request.transcript }
}

export class ValidatedInstructionProvider implements InstructionProvider {
  constructor(private readonly deployment: string, private readonly complete: CompletionTransport) {}

  async requestOutcome(request: InstructionRequest): Promise<InstructionOutcome> {
    let lastError: unknown
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const content = await this.complete({ model: this.deployment, response_format: { type: 'json_object' }, messages: [
          { role: 'system', content: systemPrompt }, { role: 'user', content: JSON.stringify(buildInstructionPayload(request)) },
        ] })
        if (!content) throw new Error('The provider returned an empty response.')
        const parsed = outcomeSchema.safeParse(JSON.parse(content))
        if (parsed.success && outcomeMatchesSource(request, parsed.data)) return parsed.data
        lastError = parsed.success ? new Error('The provider selected a different source cell.') : parsed.error
      } catch (error) { lastError = error }
    }
    throw lastError ?? new Error('The provider response could not be validated.')
  }
}

export function getConfiguredInstructionProvider(environment: ProviderEnvironment = process.env): InstructionProvider | null {
  const mode = readInstructionMode(environment)
  if (mode === 'deterministic') return null
  const foundry = readFoundryConfig(environment)
  if (foundry) {
    const client = new OpenAI({ apiKey: foundry.apiKey, baseURL: foundry.endpoint, timeout: 8000, maxRetries: 0 })
    return new ValidatedInstructionProvider(foundry.deployment, async (request) => {
      const completion = await client.chat.completions.create(request)
      return completion.choices[0]?.message.content ?? null
    })
  }
  const apiKey = environment.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    if (mode === 'llm') throw new Error('INSTRUCTION_MODE=llm requires a configured Foundry or OpenAI provider.')
    return null
  }
  const client = new OpenAI({ apiKey, timeout: 8000, maxRetries: 0 })
  const deployment = environment.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  return new ValidatedInstructionProvider(deployment, async (request) => {
    const completion = await client.chat.completions.create(request)
    return completion.choices[0]?.message.content ?? null
  })
}