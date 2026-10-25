import { gameConfig, paymentMethods, type PaymentId } from './config'

export const characters = [
  { id: 'short-cut', hair: 'short', skin: '#9a6047', shirt: '#00549a', accessory: 'none' },
  { id: 'ponytail', hair: 'ponytail', skin: '#d49a72', shirt: '#ffc629', accessory: 'none' },
  { id: 'curly-hair', hair: 'curly', skin: '#704b3d', shirt: '#3f8375', accessory: 'glasses' },
  { id: 'headscarf', hair: 'covered', skin: '#e1ad89', shirt: '#d96e59', accessory: 'headscarf' },
  { id: 'cap', hair: 'covered', skin: '#8d5a45', shirt: '#e7edf2', accessory: 'cap' },
  { id: 'long-hair', hair: 'long', skin: '#f0c09a', shirt: '#5576a5', accessory: 'none' },
] as const

export type CharacterId = typeof characters[number]['id']

export interface Buyer {
  id: string
  characterId: CharacterId
  paymentId: PaymentId
}

export type RandomSource = () => number

export function createBuyer(
  id: string,
  random: RandomSource = Math.random,
  excludedCharacterIds: readonly CharacterId[] = [],
): Buyer {
  const availableCharacters = characters.filter(({ id: characterId }) => !excludedCharacterIds.includes(characterId))
  const characterPool = availableCharacters.length > 0 ? availableCharacters : characters
  const character = characterPool[Math.floor(random() * characterPool.length)]
  const payment = paymentMethods[Math.floor(random() * paymentMethods.length)]
  return { id, characterId: character.id, paymentId: payment.id }
}

export function createInitialQueue(nextId: () => string, random: RandomSource = Math.random): Buyer[] {
  const queue: Buyer[] = []

  while (queue.length < gameConfig.queueSize) {
    queue.push(createBuyer(nextId(), random, queue.map(({ characterId }) => characterId)))
  }

  return queue
}
