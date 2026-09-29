export interface GameSlotInfo {
  id: 'integrity' | 'collaborative' | 'accountability' | 'growth-mindset' | 'customer-focus'
  title: string
  accent: string
  description: string
}

export type ValueId = GameSlotInfo['id']

export const gameSlots: readonly GameSlotInfo[] = [
  { id: 'integrity', title: 'Integrity', accent: 'var(--integrity)', description: 'Teguh pada aturan, sadar risiko, dan jujur dalam setiap keputusan.' },
  { id: 'collaborative', title: 'Collaborative', accent: 'var(--collaborative)', description: 'Bekerja bersama, saling menguatkan, mencapai tujuan yang sama.' },
  { id: 'accountability', title: 'Accountability', accent: 'var(--accountability)', description: 'Memiliki tanggung jawab dan menuntaskan pekerjaan dengan baik.' },
  { id: 'growth-mindset', title: 'Growth Mindset', accent: 'var(--growth-mindset)', description: 'Terus belajar, beradaptasi, dan bertumbuh.' },
  { id: 'customer-focus', title: 'Customer Focus', accent: 'var(--customer-focus)', description: 'Melayani dengan cepat, tepat, dan memberi nilai tambah.' },
]

export const valueIds = gameSlots.map((game) => game.id)
