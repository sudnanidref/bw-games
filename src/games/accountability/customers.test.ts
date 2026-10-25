import { describe, expect, it } from 'vitest'
import { characters, createBuyer, createInitialQueue } from './customers'
import { paymentMethods } from './config'

describe('Accountability buyers', () => {
  it('provides at least six visually distinct anonymous character variants', () => {
    const visualVariants = new Set(characters.map(({ hair, skin, shirt, accessory }) => `${hair}:${skin}:${shirt}:${accessory}`))

    expect(characters.length).toBeGreaterThanOrEqual(6)
    expect(visualVariants.size).toBe(characters.length)
  })

  it('creates a three-person queue with unique IDs and valid fixed requests', () => {
    let next = 0
    const queue = createInitialQueue(() => `buyer-${++next}`, () => 0)

    expect(queue).toHaveLength(3)
    expect(new Set(queue.map((buyer) => buyer.id)).size).toBe(3)
    expect(queue.every((buyer) => characters.some(({ id }) => id === buyer.characterId))).toBe(true)
    expect(queue.every((buyer) => paymentMethods.some(({ id }) => id === buyer.paymentId))).toBe(true)
  })

  it.each([
    [0, 'cash'],
    [1 / 3, 'edc'],
    [2 / 3, 'qris'],
    [1 - Number.EPSILON, 'qris'],
  ] as const)('maps payment draw %s to %s', (paymentDraw, expectedPayment) => {
    const draws = [0, paymentDraw]
    let index = 0

    expect(createBuyer('buyer-1', () => draws[index++]).paymentId).toBe(expectedPayment)
    expect(index).toBe(2)
  })

  it('draws character before payment and permits the same character with a different method', () => {
    const firstDraws = [0, 0]
    const secondDraws = [0, 0.8]
    let firstIndex = 0
    let secondIndex = 0
    const first = createBuyer('buyer-1', () => firstDraws[firstIndex++])
    const second = createBuyer('buyer-2', () => secondDraws[secondIndex++])

    expect(first.characterId).toBe(second.characterId)
    expect(first.paymentId).not.toBe(second.paymentId)
    expect(firstIndex).toBe(2)
    expect(secondIndex).toBe(2)
  })
})