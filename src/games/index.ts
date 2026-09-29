import type { PlayableGame } from './contract'
import { GrowthMindsetGame } from './growth-mindset'
import type { ValueId } from './slots'

export type { ValueId } from './slots'

export interface GameSlot {
  id: ValueId
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
  { id: 'accountability', title: 'Accountability', accent: 'var(--accountability)', description: 'Memiliki tanggung jawab dan menuntaskan pekerjaan dengan baik.', available: false },
  { id: 'growth-mindset', title: 'Growth Mindset', accent: 'var(--growth-mindset)', description: 'Terus belajar, beradaptasi, dan bertumbuh.', available: true, component: GrowthMindsetGame, briefing: 'Ingat pola panah dan ulangi urutannya. Salah? Pelajari dan coba lagi — raih minimal 65 poin dalam 20 detik.' },
  { id: 'customer-focus', title: 'Customer Focus', accent: 'var(--customer-focus)', description: 'Melayani dengan cepat, tepat, dan memberi nilai tambah.', available: false },
]
