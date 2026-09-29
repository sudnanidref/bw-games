import type { PlayableGame } from './contract'
import { BlindBuilder } from './collaborative/BlindBuilder'
import type { ValueId } from './values'

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
  { id: 'collaborative', title: 'Collaborative', accent: 'var(--collaborative)', description: 'Bekerja bersama, saling menguatkan, mencapai tujuan yang sama.', available: true, component: BlindBuilder, briefing: 'Arahkan rekanmu menyusun pola pada papan 5x5 dalam 180 detik. Beri instruksi warna, bentuk, dan posisi dengan jelas.' },
  { id: 'accountability', title: 'Accountability', accent: 'var(--accountability)', description: 'Memiliki tanggung jawab dan menuntaskan pekerjaan dengan baik.', available: false },
  { id: 'growth-mindset', title: 'Growth Mindset', accent: 'var(--growth-mindset)', description: 'Terus belajar, beradaptasi, dan bertumbuh.', available: false },
  { id: 'customer-focus', title: 'Customer Focus', accent: 'var(--customer-focus)', description: 'Melayani dengan cepat, tepat, dan memberi nilai tambah.', available: false },
]

export type { ValueId } from './values'