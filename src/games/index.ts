import type { PlayableGame } from './contract'
import { BlindBuilder } from './collaborative/BlindBuilder'
import { MatchTheSolution } from './customer-focus/MatchTheSolution'
import { IntegrityGame } from './integrity/IntegrityGame'
import { gameSlots, type GameSlotInfo, type ValueId } from './slots'

export type { ValueId }

export interface GameSlot extends GameSlotInfo {
  available: boolean
  component?: PlayableGame
  briefing?: string
}

const playable: Partial<Record<ValueId, Pick<GameSlot, 'component' | 'briefing'>>> = {
  integrity: {
    component: IntegrityGame,
    briefing: 'Tembak kata yang mencerminkan integritas (+5) dan hindari kata pelanggaran (−5) dalam 25 detik. Gerakkan mouse lalu klik, atau gunakan panah/A/D dan Spasi.',
  },
  collaborative: {
    component: BlindBuilder,
    briefing: 'Arahkan rekanmu menyusun pola pada papan 5x5 dalam 180 detik. Beri instruksi warna, bentuk, dan posisi dengan jelas.',
  },
  'customer-focus': {
    component: MatchTheSolution,
    briefing: 'Tangkap kartu solusi yang bergerak dan cocokkan dengan tiga kebutuhan pelanggan dalam 45 detik.',
  },
}

export const games: readonly GameSlot[] = gameSlots.map((slot) => {
  const playableParts = playable[slot.id]
  return { ...slot, available: Boolean(playableParts?.component), ...playableParts }
})
