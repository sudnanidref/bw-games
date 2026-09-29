export const gameConfig = {
  durationMs: 20_000,
  correctPoints: 10,
  wrongPenalty: 5,
  minimumScore: 0,
  correctTransitionMs: 120,
  wrongLockMs: 500,
  urgentTimeMs: 3_000,
  minimumCharacterCount: 6,
  queueSize: 3,
  autoStartMs: 5_000,
} as const

export const paymentMethods = [
  { id: 'cash', label: 'TUNAI', request: 'Saya bayar tunai, ya!', icon: 'cash' },
  { id: 'edc', label: 'EDC', request: 'Saya bayar pakai kartu, ya!', icon: 'card' },
  { id: 'qris', label: 'QRIS', request: 'Saya bayar pakai QRIS, ya!', icon: 'qr' },
] as const

export type PaymentId = typeof paymentMethods[number]['id']