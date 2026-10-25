import { characters, type CharacterId } from './customers'

interface CharacterPortraitProps {
  characterId: CharacterId
}

export function CharacterPortrait({ characterId }: CharacterPortraitProps) {
  const character = characters.find(({ id }) => id === characterId) ?? characters[0]

  return (
    <svg className={`kasir-character kasir-character-${character.id}`} viewBox="0 0 100 130" aria-hidden="true" focusable="false">
      <path d="M14 128c2-26 16-39 36-39s34 13 36 39" fill={character.shirt} />
      <path d="M42 77h16v19H42z" fill={character.skin} />
      {character.accessory === 'headscarf' && <path d="M24 51c0-30 12-43 26-43s26 13 26 43v36L62 102l-12-11-12 11-14-15z" fill={character.shirt} />}
      {character.accessory === 'cap' && <path d="M26 25c4-17 15-23 25-23s22 6 25 23H26zm-4 3h58v8H22z" fill="#ffc629" />}
      {character.hair === 'long' && <path d="M23 37c-3-23 10-34 27-34s31 11 27 34v43l-10-4V43H33v38l-10 2z" fill="#27364a" />}
      {character.hair === 'ponytail' && <><path d="M69 26c16 4 18 17 11 29-5-5-9-12-12-20z" fill="#27364a" /><path d="M26 29c3-16 13-25 24-25s22 9 25 25l-9 9H35z" fill="#27364a" /></>}
      {character.hair === 'short' && <path d="M27 31c1-20 10-29 23-29s23 9 24 29l-8 8H35z" fill="#27364a" />}
      {character.hair === 'curly' && <g fill="#27364a"><circle cx="31" cy="22" r="9" /><circle cx="44" cy="13" r="10" /><circle cx="58" cy="13" r="10" /><circle cx="70" cy="23" r="9" /><path d="M27 24h47v14H27z" /></g>}
      <ellipse cx="50" cy="48" rx="23" ry="27" fill={character.skin} />
      {character.accessory === 'headscarf' && <path d="M24 47c3-25 12-37 26-37s24 12 26 37L63 34l-13 9-13-9z" fill={character.shirt} />}
      {character.accessory === 'cap' && <path d="M27 31c4-17 13-25 23-25s20 8 23 25H62l-12-9-12 9z" fill="#ffc629" />}
      <path d="M40 52h1m18 0h1" stroke="#152f4d" strokeLinecap="round" strokeWidth="3" />
      <path d="M44 64q6 5 12 0" fill="none" stroke="#8c493b" strokeLinecap="round" strokeWidth="2.5" />
      {character.accessory === 'glasses' && <g fill="none" stroke="#152f4d" strokeWidth="2"><circle cx="41" cy="52" r="7" /><circle cx="59" cy="52" r="7" /><path d="M48 52h4" /></g>}
    </svg>
  )
}