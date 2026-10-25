import { describe, expect, it } from 'vitest'
import { createGame } from './engine'
import { paymentMethods } from './config'

function setupGame() {
  let now = 0
  const game = createGame({ clock: () => now, random: () => 0 })
  const setNow = (next: number) => { now = next }
  const started = game.startRound()
  return { game, setNow, started }
}

function answerCorrect(game: ReturnType<typeof createGame>, setNow: (time: number) => void) {
  const snapshot = game.getSnapshot()
  const buyer = snapshot.queue[0]
  if (!buyer || !snapshot.roundId) throw new Error('Expected an active buyer')
  const result = game.selectPayment({ paymentId: buyer.paymentId, roundId: snapshot.roundId, customerId: buyer.id })
  setNow(result.lockUntil)
  return game.advance()
}

function wrongPayment(paymentId: string) {
  return paymentMethods.find(({ id }) => id !== paymentId)?.id ?? 'invalid'
}

describe('Accountability round engine', () => {
  it('L01 initializes one 20-second round with a three-buyer queue and zero counters', () => {
    const { game, started } = setupGame()

    expect(started).toMatchObject({
      phase: 'playing', score: 0, servedCount: 0, wrongCount: 0,
      startedAt: 0, deadline: 20_000, remainingMs: 20_000,
    })
    expect(started.queue).toHaveLength(3)
    expect(game.getSnapshot().queue[0].id).toBe(started.queue[0].id)
  })

  it.each(paymentMethods)('L02 scores a correct $label request once', ({ id }) => {
    const drawForMethod = paymentMethods.findIndex((method) => method.id === id) / paymentMethods.length
    const draws = [0, drawForMethod, 0, 0, 0, 0]
    let drawIndex = 0
    let now = 0
    const game = createGame({ clock: () => now, random: () => draws[drawIndex++] ?? 0 })
    const started = game.startRound()
    const buyer = started.queue[0]
    const result = game.selectPayment({ paymentId: id, roundId: started.roundId!, customerId: buyer.id })

    expect(buyer.paymentId).toBe(id)
    expect(result).toMatchObject({ score: 10, servedCount: 1, wrongCount: 0, lockReason: 'correct' })
  })

  it('L03 applies one wrong penalty and retains the active buyer', () => {
    const { game, started } = setupGame()
    const buyer = started.queue[0]
    const result = game.selectPayment({ paymentId: wrongPayment(buyer.paymentId), roundId: started.roundId!, customerId: buyer.id })

    expect(result).toMatchObject({ score: 0, servedCount: 0, wrongCount: 1, lockReason: 'wrong', feedback: 'wrong' })
    expect(result.queue[0]).toEqual(buyer)
  })

  it('L04 applies the score floor after a wrong choice before a later correct choice', () => {
    const { game, setNow, started } = setupGame()
    const first = started.queue[0]
    game.selectPayment({ paymentId: wrongPayment(first.paymentId), roundId: started.roundId!, customerId: first.id })
    setNow(500)
    const unlocked = game.advance()
    const second = unlocked.queue[0]
    const result = game.selectPayment({ paymentId: second.paymentId, roundId: unlocked.roundId!, customerId: second.id })

    expect(result).toMatchObject({ score: 10, servedCount: 1, wrongCount: 1 })
  })

  it('L05 preserves the documented mixed-sequence totals', () => {
    const { game, setNow } = setupGame()

    for (let index = 0; index < 3; index += 1) answerCorrect(game, setNow)
    let snapshot = game.getSnapshot()
    let buyer = snapshot.queue[0]
    game.selectPayment({ paymentId: wrongPayment(buyer.paymentId), roundId: snapshot.roundId!, customerId: buyer.id })
    setNow(game.getSnapshot().lockUntil)
    game.advance()
    answerCorrect(game, setNow)
    setNow(game.getSnapshot().lockUntil)
    answerCorrect(game, setNow)
    snapshot = game.getSnapshot()

    expect(snapshot).toMatchObject({ score: 45, servedCount: 5, wrongCount: 1 })
  })

  it.each([
    { choice: 'correct', duration: 120 },
    { choice: 'wrong', duration: 500 },
  ] as const)('L06 drops further choices during the $choice lock', ({ choice, duration }) => {
    const { game, setNow, started } = setupGame()
    const buyer = started.queue[0]
    const paymentId = choice === 'correct' ? buyer.paymentId : wrongPayment(buyer.paymentId)
    const first = game.selectPayment({ paymentId, roundId: started.roundId!, customerId: buyer.id })
    const second = game.selectPayment({ paymentId: buyer.paymentId, roundId: started.roundId!, customerId: buyer.id })

    expect(first.lockUntil).toBe(duration)
    expect(second).toMatchObject({ score: first.score, servedCount: first.servedCount, wrongCount: first.wrongCount })
    setNow(duration)
    expect(game.advance().lockReason).toBe('none')
  })

  it('L07 completes a correct FIFO transition at exactly 120 ms', () => {
    const { game, setNow, started } = setupGame()
    const firstBuyer = started.queue[0]
    game.selectPayment({ paymentId: firstBuyer.paymentId, roundId: started.roundId!, customerId: firstBuyer.id })
    setNow(119)
    expect(game.advance().queue[0].id).toBe(firstBuyer.id)
    setNow(120)
    const transitioned = game.advance()

    expect(transitioned.queue[0].id).toBe(started.queue[1].id)
    expect(transitioned.queue).toHaveLength(3)
    expect(transitioned.queue[2].id).not.toBe(started.queue[2].id)
  })

  it('L08 reopens the same buyer at exactly 500 ms after a wrong choice', () => {
    const { game, setNow, started } = setupGame()
    const buyer = started.queue[0]
    game.selectPayment({ paymentId: wrongPayment(buyer.paymentId), roundId: started.roundId!, customerId: buyer.id })
    setNow(499)
    expect(game.advance().lockReason).toBe('wrong')
    setNow(500)
    const unlocked = game.advance()

    expect(unlocked.lockReason).toBe('none')
    expect(unlocked.queue[0]).toEqual(buyer)
  })

  it('L09 accepts an unlocked choice one millisecond before the deadline', () => {
    const { game, setNow, started } = setupGame()
    const buyer = started.queue[0]
    setNow(19_999)
    const result = game.selectPayment({ paymentId: buyer.paymentId, roundId: started.roundId!, customerId: buyer.id })

    expect(result).toMatchObject({ phase: 'playing', score: 10, servedCount: 1 })
  })

  it('L10 rejects a choice at the exact deadline', () => {
    const { game, setNow, started } = setupGame()
    const buyer = started.queue[0]
    setNow(20_000)
    const result = game.selectPayment({ paymentId: buyer.paymentId, roundId: started.roundId!, customerId: buyer.id })

    expect(result).toMatchObject({ phase: 'result', score: 0, servedCount: 0, wrongCount: 0 })
  })

  it.each([
    { choice: 'correct', expected: { score: 10, servedCount: 1, wrongCount: 0 } },
    { choice: 'wrong', expected: { score: 0, servedCount: 0, wrongCount: 1 } },
  ] as const)('L11/L12 finalizes at the deadline during a $choice lock', ({ choice, expected }) => {
    const { game, setNow, started } = setupGame()
    const buyer = started.queue[0]
    setNow(19_900)
    game.selectPayment({
      paymentId: choice === 'correct' ? buyer.paymentId : wrongPayment(buyer.paymentId),
      roundId: started.roundId!,
      customerId: buyer.id,
    })
    setNow(20_000)
    const result = game.advance()

    expect(result).toMatchObject({ phase: 'result', ...expected, lockReason: 'none', feedback: 'none' })
    expect(result.queue[0].id).toBe(buyer.id)
  })

  it('L13 keeps a finalized result unchanged on repeated updates', () => {
    const { game, setNow } = setupGame()
    setNow(20_000)
    const result = game.advance()
    setNow(40_000)

    expect(game.advance()).toEqual(result)
  })

  it('L14 finalizes immediately after a clock jump past the deadline', () => {
    const { game, setNow } = setupGame()
    setNow(19_999)
    game.advance()
    setNow(25_000)

    expect(game.advance()).toMatchObject({ phase: 'result', remainingMs: 0 })
  })

  it('L17 does not draw buyers during reads, timer updates, or wrong choices', () => {
    let randomCalls = 0
    const game = createGame({ clock: () => 0, random: () => { randomCalls += 1; return 0 } })
    const started = game.startRound()
    const callsAfterStart = randomCalls
    const buyer = started.queue[0]
    game.getSnapshot()
    game.advance()
    game.selectPayment({ paymentId: wrongPayment(buyer.paymentId), roundId: started.roundId!, customerId: buyer.id })
    game.getSnapshot()

    expect(callsAfterStart).toBe(6)
    expect(randomCalls).toBe(callsAfterStart)
  })

  it('L18 rejects old round, old buyer, and invalid payment identities', () => {
    const { game, setNow, started } = setupGame()
    const oldBuyer = started.queue[0]
    setNow(20_000)
    game.advance()
    const newRound = game.startRound()
    const activeBuyer = newRound.queue[0]

    const oldRound = game.selectPayment({ paymentId: activeBuyer.paymentId, roundId: started.roundId!, customerId: activeBuyer.id })
    const oldBuyerAction = game.selectPayment({ paymentId: activeBuyer.paymentId, roundId: newRound.roundId!, customerId: oldBuyer.id })
    const invalidPayment = game.selectPayment({ paymentId: 'transfer', roundId: newRound.roundId!, customerId: activeBuyer.id })

    expect(oldRound.score).toBe(0)
    expect(oldBuyerAction.score).toBe(0)
    expect(invalidPayment).toMatchObject({ score: 0, servedCount: 0, wrongCount: 0 })
  })

  it('L19 isolates a new round from actions carrying old round IDs', () => {
    const { game, setNow, started } = setupGame()
    const oldBuyer = started.queue[0]
    setNow(20_000)
    game.advance()
    const nextRound = game.startRound()
    const afterOldAction = game.selectPayment({ paymentId: oldBuyer.paymentId, roundId: started.roundId!, customerId: oldBuyer.id })

    expect(afterOldAction).toMatchObject({ phase: 'playing', roundId: nextRound.roundId, score: 0, servedCount: 0 })
  })

  it('L20 ignores a repeated start while the round is playing', () => {
    const { game, started } = setupGame()
    const repeated = game.startRound()

    expect(repeated.roundId).toBe(started.roundId)
    expect(repeated.deadline).toBe(started.deadline)
    expect(repeated.queue).toEqual(started.queue)
  })

  it('L21 keeps FIFO order after a wrong choice followed by a correct one', () => {
    const { game, setNow, started } = setupGame()
    const firstBuyer = started.queue[0]
    game.selectPayment({ paymentId: wrongPayment(firstBuyer.paymentId), roundId: started.roundId!, customerId: firstBuyer.id })
    setNow(500)
    const unlocked = game.advance()
    const current = unlocked.queue[0]
    game.selectPayment({ paymentId: current.paymentId, roundId: unlocked.roundId!, customerId: current.id })
    setNow(620)
    const transitioned = game.advance()

    expect(transitioned.queue[0].id).toBe(started.queue[1].id)
    expect(transitioned.queue).toHaveLength(3)
    expect(transitioned.wrongCount).toBe(1)
    expect(transitioned.servedCount).toBe(1)
  })
})