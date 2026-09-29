import { LEVELS, PASS_SCORE, ROUND_MS, isPassing, scoreRound } from './scoring'

export type Arrow = 'left' | 'up' | 'right' | 'down'

export interface GrowthGameOptions {
  onComplete: (score: number) => void
  onCancel: () => void
  onError: (error: Error) => void
  random?: () => number
}

export interface GrowthGameHandle {
  destroy: () => void
}

type Phase = 'briefing' | 'showing' | 'input' | 'lesson' | 'result' | 'done'

const ARROWS: readonly Arrow[] = ['left', 'up', 'right', 'down']
const GLYPH: Record<Arrow, string> = { left: '←', up: '↑', right: '→', down: '↓' }
const LABEL: Record<Arrow, string> = { left: 'kiri', up: 'atas', right: 'kanan', down: 'bawah' }
const KEYS: Record<string, Arrow> = {
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowRight: 'right', d: 'right', D: 'right',
  ArrowDown: 'down', s: 'down', S: 'down',
}
const LESSON_MS = 700
const LEVEL_PAUSE_MS = 250
const TICK_MS = 100

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const node = el('button', className, label)
  node.type = 'button'
  node.addEventListener('click', onClick)
  return node
}

function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} d`
}

function levelText(index: number): string {
  return `TAHAP ${index + 1} / ${LEVELS.length} · ${LEVELS[index].hint}`
}

export function mountGrowthGame(root: HTMLElement, options: GrowthGameOptions): GrowthGameHandle {
  const random = options.random ?? Math.random
  const timeouts = new Set<ReturnType<typeof setTimeout>>()
  let ticker: ReturnType<typeof setInterval> | null = null
  let phase: Phase = 'briefing'
  let level = 0
  let pattern: Arrow[] = []
  let position = 0
  let bestCorrect = 0
  let deadline = 0
  let score = 0

  const game = el('div', 'gm-game')
  game.tabIndex = -1
  game.setAttribute('role', 'application')
  game.setAttribute('aria-label', 'Pola Tumbuh')

  const hud = el('div', 'gm-hud')
  const time = el('span', 'gm-time', formatTime(ROUND_MS))
  const levelLabel = el('span', 'gm-level', levelText(0))
  const exit = button('Keluar', 'gm-exit', () => guard(cancel))
  hud.append(time, levelLabel, exit)

  const bar = el('div', 'gm-timer')
  bar.setAttribute('aria-hidden', 'true')
  const fill = el('div', 'gm-timer-fill')
  bar.append(fill)

  const sprout = el('div', 'gm-sprout')
  sprout.setAttribute('role', 'img')
  const stem = el('span', 'gm-stem')
  const leaves = LEVELS.map((_, index) => el('span', `gm-leaf gm-leaf-${index + 1}`))
  const soil = el('span', 'gm-soil')
  const sproutCaption = el('span', 'gm-sprout-caption')
  sprout.append(stem, ...leaves, soil, sproutCaption)

  const slots = el('div', 'gm-pattern')
  const message = el('p', 'gm-message')
  message.setAttribute('aria-live', 'polite')
  const board = el('div', 'gm-board')
  board.append(slots, message)

  const pad = el('div', 'gm-pad')
  pad.setAttribute('aria-label', 'Tombol panah')
  for (const arrow of ARROWS) {
    const control = button(GLYPH[arrow], `gm-key gm-key-${arrow}`, () => guard(() => input(arrow)))
    control.setAttribute('aria-label', `Panah ${LABEL[arrow]}`)
    pad.append(control)
  }

  const play = el('div', 'gm-play')
  play.append(sprout, board, pad)

  const panel = el('div', 'gm-panel')
  game.append(hud, bar, play, panel)
  root.append(game)

  function later(ms: number, fn: () => void) {
    const id = setTimeout(() => {
      timeouts.delete(id)
      guard(fn)
    }, ms)
    timeouts.add(id)
  }

  function clearTimers() {
    for (const id of timeouts) clearTimeout(id)
    timeouts.clear()
    if (ticker !== null) clearInterval(ticker)
    ticker = null
  }

  function guard(fn: () => void) {
    if (phase === 'done') return
    try {
      fn()
    } catch (error) {
      finish(() => options.onError(error instanceof Error ? error : new Error(String(error))))
    }
  }

  function finish(report: () => void) {
    if (phase === 'done') return
    phase = 'done'
    clearTimers()
    report()
  }

  function cancel() {
    finish(options.onCancel)
  }

  function renderSprout(stage: number) {
    sprout.style.setProperty('--gm-stage', String(stage))
    leaves.forEach((leaf, index) => leaf.classList.toggle('is-grown', index < stage))
    sprout.setAttribute('aria-label', `Tanaman tahap ${stage} dari ${LEVELS.length}`)
    sproutCaption.textContent = `Tumbuh ${stage} / ${LEVELS.length}`
  }

  function renderSlots(render: (slot: HTMLSpanElement, index: number) => void) {
    slots.replaceChildren(...pattern.map((_, index) => {
      const slot = el('span', 'gm-slot')
      render(slot, index)
      return slot
    }))
  }

  function renderTime() {
    const remaining = phase === 'briefing' ? ROUND_MS : Math.max(0, deadline - Date.now())
    time.textContent = formatTime(remaining)
    fill.style.width = `${(remaining / ROUND_MS) * 100}%`
    return remaining
  }

  function showPanel(title: string, lines: string[], actions: HTMLButtonElement[]) {
    const heading = el('h2', 'gm-panel-title', title)
    panel.replaceChildren(heading, ...lines.map((line) => el('p', 'gm-panel-text', line)), el('div', 'gm-actions'))
    panel.lastElementChild?.append(...actions)
    panel.hidden = false
    play.setAttribute('aria-hidden', 'true')
    actions[0]?.focus()
  }

  function hidePanel() {
    panel.hidden = true
    panel.replaceChildren()
    play.removeAttribute('aria-hidden')
    game.focus()
  }

  function briefing() {
    renderSprout(0)
    showPanel('Pola Tumbuh', [
      'Perhatikan pola panah yang menyala, lalu ulangi urutannya.',
      'Pakai tombol panah / WASD atau klik tombol di layar. Salah? Itu pelajaran — pola diputar ulang, coba lagi.',
      `Tuntaskan 5 tahap dalam 20 detik. Raih minimal ${PASS_SCORE} poin untuk lanjut.`,
    ], [
      button('Mulai', 'gm-primary', () => guard(startRound)),
    ])
  }

  function startRound() {
    clearTimers()
    level = 0
    bestCorrect = 0
    score = 0
    deadline = Date.now() + ROUND_MS
    hidePanel()
    renderSprout(0)
    ticker = setInterval(() => guard(() => {
      if (renderTime() === 0) endRound()
    }), TICK_MS)
    renderTime()
    startLevel()
  }

  function startLevel() {
    const { length } = LEVELS[level]
    pattern = Array.from({ length }, () => {
      const arrow = ARROWS[Math.floor(random() * ARROWS.length)]
      if (!arrow) throw new Error('Pola tidak valid.')
      return arrow
    })
    levelLabel.textContent = levelText(level)
    showPattern('Perhatikan polanya...')
  }

  function showPattern(note: string) {
    phase = 'showing'
    position = 0
    message.textContent = note
    pad.classList.add('is-waiting')
    renderSlots((slot) => { slot.textContent = '•' })
    const { stepMs } = LEVELS[level]
    pattern.forEach((arrow, index) => {
      later(index * stepMs, () => renderSlots((slot, current) => {
        if (current === index) {
          slot.textContent = GLYPH[arrow]
          slot.classList.add('is-lit')
        } else {
          slot.textContent = '•'
        }
      }))
    })
    later(pattern.length * stepMs, () => {
      phase = 'input'
      pad.classList.remove('is-waiting')
      message.textContent = 'Giliranmu! Ulangi polanya.'
      renderSlots((slot) => { slot.textContent = '?' })
    })
  }

  function input(arrow: Arrow) {
    if (phase !== 'input') return
    const slot = slots.children[position] as HTMLElement | undefined
    if (pattern[position] === arrow) {
      position += 1
      bestCorrect = Math.max(bestCorrect, position)
      if (slot) {
        slot.textContent = `${GLYPH[arrow]} ✓`
        slot.classList.add('is-ok')
      }
      if (position === pattern.length) clearLevel()
      return
    }
    phase = 'lesson'
    if (slot) {
      slot.textContent = `${GLYPH[arrow]} ✗`
      slot.classList.add('is-wrong')
    }
    message.textContent = `Pelajaran: panah ke-${position + 1} seharusnya ${GLYPH[pattern[position]]}. Perhatikan lagi!`
    later(LESSON_MS, () => showPattern('Coba lagi — pola diputar ulang.'))
  }

  function clearLevel() {
    level += 1
    bestCorrect = 0
    renderSprout(level)
    if (level === LEVELS.length) {
      endRound()
      return
    }
    phase = 'showing'
    message.textContent = 'Bagus! Tanamanmu tumbuh.'
    later(LEVEL_PAUSE_MS, startLevel)
  }

  function endRound() {
    clearTimers()
    renderTime()
    phase = 'result'
    score = scoreRound(level, bestCorrect)
    if (isPassing(score)) {
      showPanel(`Lulus! ${score} / 100`, [
        `Kamu melampaui target ${PASS_SCORE} poin. Terus belajar, terus tumbuh.`,
      ], [
        button('Lanjut', 'gm-primary', () => guard(() => finish(() => options.onComplete(score)))),
      ])
    } else {
      showPanel(`Skor ${score} / 100`, [
        `Target ${PASS_SCORE} poin belum tercapai. Kesalahan adalah bagian dari proses — coba lagi!`,
      ], [
        button('Coba lagi', 'gm-primary', () => guard(startRound)),
        button('Kembali ke menu', 'gm-secondary', () => guard(cancel)),
      ])
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (phase === 'done') return
    const onButton = event.target instanceof HTMLButtonElement
    if (event.key === 'Escape') {
      event.preventDefault()
      guard(cancel)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      // Focused buttons already activate natively on Enter/Space.
      if (onButton) return
      event.preventDefault()
      if (phase === 'briefing') guard(startRound)
      else if (phase === 'result' && isPassing(score)) guard(() => finish(() => options.onComplete(score)))
      else if (phase === 'result') guard(startRound)
      return
    }
    const arrow = KEYS[event.key]
    if (arrow) {
      event.preventDefault()
      guard(() => input(arrow))
    }
  }

  game.addEventListener('keydown', onKeyDown)
  guard(briefing)

  return {
    destroy() {
      phase = 'done'
      clearTimers()
      game.removeEventListener('keydown', onKeyDown)
      game.remove()
    },
  }
}
