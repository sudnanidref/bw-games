import { characters, type CharacterId } from './customers'
import capPortrait from './assets/characters/cap.png'
import curlyHairPortrait from './assets/characters/curly-hair.png'
import headscarfPortrait from './assets/characters/headscarf.png'
import longHairPortrait from './assets/characters/long-hair.png'
import ponytailPortrait from './assets/characters/ponytail.png'
import shortCutPortrait from './assets/characters/short-cut.png'

interface CharacterPortraitProps {
  characterId: CharacterId
}

const portraits = {
  'short-cut': shortCutPortrait,
  ponytail: ponytailPortrait,
  'curly-hair': curlyHairPortrait,
  headscarf: headscarfPortrait,
  cap: capPortrait,
  'long-hair': longHairPortrait,
} satisfies Record<CharacterId, string>

export function CharacterPortrait({ characterId }: CharacterPortraitProps) {
  const character = characters.find(({ id }) => id === characterId) ?? characters[0]

  return (
    <img
      className={`kasir-character kasir-character-${character.id}`}
      src={portraits[character.id]}
      alt=""
      draggable={false}
    />
  )
}
