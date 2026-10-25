import type { Board, Color, GameAction, Position, Shape } from './game'

export type InstructionOutcome =
  | { type: 'action'; action: GameAction }
  | { type: 'clarification'; message: string }
  | { type: 'message'; message: string }

const shapes: Shape[] = ['circle', 'square', 'triangle']
const colors: Color[] = ['red', 'blue', 'green']

// Indonesian (and a few common English) synonyms mapped to the canonical game values.
// Order inside each list does not matter; longer phrases are handled by the regex word boundaries.
const shapeSynonyms: Record<Shape, string[]> = {
  circle: ['circle', 'lingkaran', 'bulat', 'bundar'],
  square: ['square', 'kotak', 'persegi', 'bujur\\s*sangkar'],
  triangle: ['triangle', 'segitiga', 'segi\\s*tiga'],
}

const colorSynonyms: Record<Color, string[]> = {
  red: ['red', 'merah'],
  blue: ['blue', 'biru'],
  green: ['green', 'hijau'],
}

// Localized shape/color names for teammate replies.
const shapeLabel: Record<Shape, string> = { circle: 'lingkaran', square: 'kotak', triangle: 'segitiga' }
const colorLabel: Record<Color, string> = { red: 'merah', blue: 'biru', green: 'hijau' }

function describe(color: Color, shape: Shape): string {
  return `${shapeLabel[shape]} ${colorLabel[color]}`
}

function matchFromSynonyms<T extends string>(text: string, table: Record<T, string[]>): T | undefined {
  return (Object.keys(table) as T[]).find((key) =>
    table[key].some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text)))
}

function matchShape(text: string): Shape | undefined {
  return matchFromSynonyms(text, shapeSynonyms)
}

function matchColor(text: string): Color | undefined {
  return matchFromSynonyms(text, colorSynonyms)
}

function parsePosition(text: string): Position | undefined {
  // "row 2 column 4" / "baris 2 kolom 4"
  const rowColumn = text.match(/\b(?:row|baris)\s*([1-5])\D+(?:column|kolom)\s*([1-5])\b/i)
    ?? text.match(/\b([1-5])\s*[,/]\s*([1-5])\b/)
  if (rowColumn) return { row: Number(rowColumn[1]) - 1, column: Number(rowColumn[2]) - 1 }
  // Cell code as printed on the board: A1-E5 (letter = row, number = column).
  const code = text.match(/\b([a-e])([1-5])\b/i)
  if (code) return { row: code[1].toUpperCase().charCodeAt(0) - 65, column: Number(code[2]) - 1 }
  // Named positions: each entry lists every phrase (English + Indonesian) that maps to the cell.
  const positionGroups: Array<{ position: Position; phrases: string[] }> = [
    { position: { row: 0, column: 0 }, phrases: ['top left', 'upper left', 'kiri atas', 'atas kiri', 'pojok kiri atas', 'sudut kiri atas'] },
    { position: { row: 0, column: 2 }, phrases: ['top center', 'top middle', 'tengah atas', 'atas tengah'] },
    { position: { row: 0, column: 4 }, phrases: ['top right', 'upper right', 'kanan atas', 'atas kanan', 'pojok kanan atas', 'sudut kanan atas'] },
    { position: { row: 2, column: 0 }, phrases: ['center left', 'middle left', 'tengah kiri', 'kiri tengah'] },
    { position: { row: 2, column: 2 }, phrases: ['center', 'middle', 'tengah', 'pusat', 'tengah-tengah'] },
    { position: { row: 2, column: 4 }, phrases: ['center right', 'middle right', 'tengah kanan', 'kanan tengah'] },
    { position: { row: 4, column: 0 }, phrases: ['bottom left', 'lower left', 'kiri bawah', 'bawah kiri', 'pojok kiri bawah', 'sudut kiri bawah'] },
    { position: { row: 4, column: 2 }, phrases: ['bottom center', 'bottom middle', 'tengah bawah', 'bawah tengah'] },
    { position: { row: 4, column: 4 }, phrases: ['bottom right', 'lower right', 'kanan bawah', 'bawah kanan', 'pojok kanan bawah', 'sudut kanan bawah'] },
  ]
  // Try the longest phrases first so "kiri atas" wins over "kiri"/"atas" alone.
  const candidates = positionGroups
    .flatMap((group) => group.phrases.map((phrase) => ({ phrase, position: group.position })))
    .sort((first, second) => second.phrase.length - first.phrase.length)
  const found = candidates.find((candidate) => new RegExp(`\\b${candidate.phrase}\\b`, 'i').test(text))
  return found?.position
}

export function explicitMoveSource(text: string): Position | undefined {
  const coordinate = text.match(/\b([a-e])([1-5])\b/i)
  return coordinate
    ? { row: coordinate[1].toUpperCase().charCodeAt(0) - 65, column: Number(coordinate[2]) - 1 }
    : parsePosition(text)
}

export function interpretInstruction(instruction: string, board: Board): InstructionOutcome {
  const text = instruction.trim().toLowerCase()
  const shape = matchShape(text)
  const color = matchColor(text)
  const position = parsePosition(text)
  const matchingObjects = shape && color ? board.filter((object) => object.shape === shape && object.color === color) : []

  // Unsupported verbs: undo / replace / clear (EN) + urungkan / batalkan / ganti / hapus semua / bersihkan (ID)
  if (/\b(undo|replace|clear|urungkan|batalkan|ganti|ulangi|hapus\s+semua|bersihkan|reset)\b/i.test(text)) {
    return { type: 'message', message: 'Untuk ronde ini, saya hanya bisa menaruh, memindahkan, atau menghapus bentuk.' }
  }
  // Remove: remove / delete / take away (EN) + hapus / buang / singkirkan / ambil (ID)
  if (/\b(remove|delete|take away|hapus|buang|singkirkan|ambil)\b/i.test(text)) {
    if (!shape || !color) return { type: 'clarification', message: 'Warna dan bentuk apa yang harus saya hapus?' }
    const matchingPosition = position && matchingObjects.some((object) => object.row === position.row && object.column === position.column)
    if (matchingObjects.length > 1 && !matchingPosition) {
      return { type: 'clarification', message: `Ada beberapa ${describe(color, shape)}. Dari sel mana yang harus saya hapus?` }
    }
    if (matchingObjects.length === 1) {
      const { row, column } = matchingObjects[0]
      return { type: 'action', action: { type: 'remove', shape, color, at: { row, column } } }
    }
    if (matchingObjects.length > 1 && position && matchingPosition) {
      return { type: 'action', action: { type: 'remove', shape, color, at: position } }
    }
    return { type: 'clarification', message: 'Saya melihat lebih dari satu. Ada di sel yang mana?' }
  }
  // Move: move / shift (EN) + pindah / pindahkan / geser / gerakkan (ID)
  if (/\b(move|shift|pindah|pindahkan|geser|gerakkan|gerak)\b/i.test(text)) {
    if (!shape || !color) return { type: 'clarification', message: 'Warna dan bentuk apa yang harus saya pindahkan?' }
    const sourcePosition = explicitMoveSource(text)
    const source = sourcePosition
      ? matchingObjects.find((object) => object.row === sourcePosition.row && object.column === sourcePosition.column)
      : matchingObjects.length === 1 ? matchingObjects[0] : undefined
    if (matchingObjects.length > 1 && !sourcePosition) {
      return { type: 'clarification', message: `Ada beberapa ${describe(color, shape)}. Yang mana yang harus saya pindahkan?` }
    }
    if (sourcePosition && !source) {
      return { type: 'clarification', message: `Saya tidak menemukan ${describe(color, shape)} di baris ${sourcePosition.row + 1}, kolom ${sourcePosition.column + 1}. Sel mana yang harus saya pakai?` }
    }
    if (!source) return { type: 'message', message: `Saya tidak menemukan ${describe(color, shape)} di papan saya.` }
    const directions: Record<string, Position> = {
      left: { row: 0, column: -1 }, right: { row: 0, column: 1 },
      up: { row: -1, column: 0 }, down: { row: 1, column: 0 },
    }
    // Map English + Indonesian direction words to a canonical key.
    const directionWords: Record<string, keyof typeof directions> = {
      left: 'left', kiri: 'left',
      right: 'right', kanan: 'right',
      up: 'up', atas: 'up', 'ke atas': 'up', naik: 'up',
      down: 'down', bawah: 'down', 'ke bawah': 'down', turun: 'down',
    }
    const directionKey = Object.keys(directionWords)
      .sort((first, second) => second.length - first.length)
      .find((word) => new RegExp(`\\b${word}\\b`, 'i').test(text))
    const direction = directionKey ? directionWords[directionKey] : undefined
    // Distance: "<n> cells/steps" (EN) or "<n> sel/langkah/petak" (ID).
    // Note: 'kotak' is intentionally excluded here because it also names the square shape.
    const distanceMatch = text.match(/\b([a-z]+|\d+)\s+(?:cells?|steps?|spaces?|sel|langkah|petak)\b/i)
    const distanceWords: Record<string, number> = {
      a: 1, single: 1, zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
      satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8,
      sembilan: 9, sepuluh: 10, nol: 0,
    }
    const distance = distanceMatch
      ? Number.isNaN(Number(distanceMatch[1])) ? distanceWords[distanceMatch[1]] ?? Number.NaN : Number(distanceMatch[1])
      : 1
    if (!direction || /\b(diagonal(?:ly)?|diagonal|serong|miring)\b/i.test(text) || distance !== 1) {
      return { type: 'clarification', message: 'Pindahkan satu sel ke kiri, kanan, atas, atau bawah. Ke arah mana?' }
    }
    const delta = directions[direction]
    return { type: 'action', action: { type: 'move', shape, color,
      from: { row: source.row, column: source.column },
      to: { row: source.row + delta.row, column: source.column + delta.column } } }
  }
  // Place: place / put / add (EN) + taruh / tempatkan / letakkan / pasang / tambah / tambahkan / buat (ID)
  if (/\b(place|put|add|taruh|tempatkan|letakkan|letakan|pasang|tambah|tambahkan|buat|naruh)\b/i.test(text) || (shape && color && position)) {
    if (!shape || !color || !position) {
      return { type: 'clarification', message: 'Sebutkan warna, bentuk, dan selnya (misalnya kiri atas).' }
    }
    return { type: 'action', action: { type: 'place', object: { shape, color, ...position } } }
  }
  return { type: 'message', message: 'Saya bisa menaruh, memindahkan, atau menghapus bentuk. Apa yang harus saya lakukan?' }
}
