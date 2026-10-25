import { gameConfig, paymentMethods } from './config'
import { createBuyer, createInitialQueue, type Buyer, type RandomSource } from './customers'

export type GamePhase = 'ready' | 'playing' | 'result'
export type LockReason = 'none' | 'correct' | 'wrong'
export type Feedback = 'none' | 'correct' | 'wrong'

export interface GameSnapshot {
  phase: GamePhase
  roundId: string | null
  score: number
  servedCount: number
  wrongCount: number
  queue: readonly Readonly<Buyer>[]
  startedAt: number | null
  deadline: number | null
  lockUntil: number
  lockReason: LockReason
  feedback: Feedback
  remainingMs: number
  displaySeconds: number
}

interface GameState {
  phase: GamePhase
  roundId: string | null
  score: number
  servedCount: number
  wrongCount: number
  queue: Buyer[]
  startedAt: number | null
  deadline: number | null
  lockUntil: number
  lockReason: LockReason
  feedback: Feedback
}

interface GameOptions {
  clock?: () => number
  random?: RandomSource
}

interface PaymentAction {
  paymentId: string
  roundId: string
  customerId: string
}

function initialState(): GameState {
  return {
    phase: 'ready',
    roundId: null,
    score: 0,
    servedCount: 0,
    wrongCount: 0,
    queue: [],
    startedAt: null,
    deadline: null,
    lockUntil: 0,
    lockReason: 'none',
    feedback: 'none',
  }
}

export function createGame(options: GameOptions = {}) {
  const clock = options.clock ?? (() => performance.now())
  const random = options.random ?? Math.random
  let state = initialState()
  let roundSequence = 0
  let buyerSequence = 0

  function getSnapshot(): GameSnapshot {
    const now = clock()
    const remainingMs = state.phase === 'result'
      ? 0
      : state.deadline === null
        ? gameConfig.durationMs
        : Math.max(0, state.deadline - now)

    return {
      ...state,
      queue: state.queue.map((buyer) => ({ ...buyer })),
      remainingMs,
      displaySeconds: Math.ceil(remainingMs / 1_000),
    }
  }

  function finishRound() {
    state = {
      ...state,
      phase: 'result',
      lockUntil: 0,
      lockReason: 'none',
      feedback: 'none',
    }
  }

  function advanceAt(now: number) {
    if (state.phase !== 'playing' || state.deadline === null) return
    if (now >= state.deadline) {
      finishRound()
      return
    }

    if (state.lockReason === 'none' || now < state.lockUntil) return

    if (state.lockReason === 'correct') {
      const roundId = state.roundId
      const [, ...waiting] = state.queue
      const newBuyer = createBuyer(`${roundId}-buyer-${++buyerSequence}`, random)
      state = { ...state, queue: [...waiting, newBuyer] }
    }

    state = { ...state, lockUntil: 0, lockReason: 'none', feedback: 'none' }
  }

  function startRound(): GameSnapshot {
    if (state.phase === 'playing') return getSnapshot()

    const roundId = `round-${++roundSequence}`
    buyerSequence = 0
    const queue = createInitialQueue(
      () => `${roundId}-buyer-${++buyerSequence}`,
      random,
    )
    const startedAt = clock()
    state = {
      phase: 'playing',
      roundId,
      score: 0,
      servedCount: 0,
      wrongCount: 0,
      queue,
      startedAt,
      deadline: startedAt + gameConfig.durationMs,
      lockUntil: 0,
      lockReason: 'none',
      feedback: 'none',
    }
    return getSnapshot()
  }

  function advance(): GameSnapshot {
    advanceAt(clock())
    return getSnapshot()
  }

  function selectPayment(action: PaymentAction): GameSnapshot {
    const now = clock()
    advanceAt(now)

    const activeBuyer = state.queue[0]
    const isValidPayment = paymentMethods.some(({ id }) => id === action.paymentId)
    if (state.phase !== 'playing'
      || state.lockReason !== 'none'
      || state.roundId !== action.roundId
      || activeBuyer?.id !== action.customerId
      || !isValidPayment) {
      return getSnapshot()
    }

    if (action.paymentId === activeBuyer.paymentId) {
      state = {
        ...state,
        score: state.score + gameConfig.correctPoints,
        servedCount: state.servedCount + 1,
        lockUntil: now + gameConfig.correctTransitionMs,
        lockReason: 'correct',
        feedback: 'correct',
      }
    } else {
      state = {
        ...state,
        score: Math.max(gameConfig.minimumScore, state.score - gameConfig.wrongPenalty),
        wrongCount: state.wrongCount + 1,
        lockUntil: now + gameConfig.wrongLockMs,
        lockReason: 'wrong',
        feedback: 'wrong',
      }
    }

    return getSnapshot()
  }

  return { startRound, advance, selectPayment, getSnapshot }
}