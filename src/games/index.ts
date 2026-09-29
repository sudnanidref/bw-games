import type { PlayableGame } from './contract'

// @ts-ignore Vite transforms import.meta.glob; the server-only config lacks its client type declarations.
const accountabilityComponents = import.meta.glob<PlayableGame>(
  './accountability/AccountabilityGame.tsx',
  { eager: true, import: 'AccountabilityGame' },
)
const AccountabilityGame = accountabilityComponents['./accountability/AccountabilityGame.tsx']

export interface GameSlot {
  id: 'integrity' | 'collaborative' | 'accountability' | 'growth-mindset' | 'customer-focus'
  title: string
  accent: string
  description: string
  available: boolean
  component?: PlayableGame
  briefing?: string
}

export const games: readonly GameSlot[] = [
  { id: 'integrity', title: 'Integrity', accent: 'var(--integrity)', description: 'Teguh pada aturan, sadar risiko, dan jujur dalam setiap keputusan.', available: false },
  { id: 'collaborative', title: 'Collaborative', accent: 'var(--collaborative)', description: 'Bekerja bersama, saling menguatkan, mencapai tujuan yang sama.', available: false },
  {
    id: 'accountability', title: 'Accountability', accent: 'var(--accountability)',
    description: 'Memiliki tanggung jawab dan menuntaskan pekerjaan dengan baik.',
    available: true,
    component: AccountabilityGame,
    briefing: 'Layani permintaan pembayaran tiga pembeli dengan cepat dan tepat selama 20 detik.',
  },
  { id: 'growth-mindset', title: 'Growth Mindset', accent: 'var(--growth-mindset)', description: 'Terus belajar, beradaptasi, dan bertumbuh.', available: false },
  { id: 'customer-focus', title: 'Customer Focus', accent: 'var(--customer-focus)', description: 'Melayani dengan cepat, tepat, dan memberi nilai tambah.', available: false },
]

export type ValueId = GameSlot['id']