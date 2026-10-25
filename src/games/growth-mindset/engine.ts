import { LEVELS, PASS_SCORE, ROUND_MS, isPassing, scoreRound } from './scoring'

export type Arrow = 'left' | 'up' | 'right' | 'down'

export interface GrowthGameOptions {
  onComplete: (score: number) => void
  onCancel: () => void
  onError: (error: Error) => void
  random?: () => number
  music?: {
    start: () => void
    stop: () => void
    isMuted: () => boolean
    toggleMute: () => void
  }
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
const ART = '/assets/growth-mindset/'
const LESSON_MS = 700
const LEVEL_PAUSE_MS = 250
const TICK_MS = 100
const GROWTH_TARGET = LEVELS.reduce((sum, stage) => sum + stage.length, 0)

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
  let correctAnswers = 0

  // Warm the generated artwork before the timed round begins.
  for (const name of ['garden', 'seed', 'sprout', 'sapling', 'tree-medium', 'tree-large', 'arrow', 'sparkle', 'retry']) {
    const image = new Image()
    image.src = `${ART}${name}.png`
  }

  const game = el('div', 'gm-game')
  game.tabIndex = -1
  game.setAttribute('role', 'application')
  game.setAttribute('aria-label', 'Pola Tumbuh')

  const brand = el('div', 'gm-brand')
  brand.append(el('span', 'gm-kicker', 'GROWTH MINDSET / GAME 04'), el('h2', '', 'Kebun Belajar'), el('span', 'gm-tagline', 'Sedikit belajar, banyak bertumbuh.'))
  const hud = el('div', 'gm-hud')
  const time = el('span', 'gm-time', formatTime(ROUND_MS))
  const levelLabel = el('span', 'gm-level', levelText(0))
  const exit = button('Keluar', 'gm-exit', () => guard(cancel))
  const mute = options.music && button('', 'gm-mute', () => {
    options.music?.toggleMute()
    updateMute()
  })
  function updateMute() {
    if (!mute || !options.music) return
    const muted = options.music.isMuted()
    mute.textContent = muted ? '🔇 Suara mati' : '🔊 Suara hidup'
    mute.setAttribute('aria-label', muted ? 'Nyalakan suara' : 'Matikan suara')
    mute.setAttribute('aria-pressed', String(muted))
  }
  updateMute()
  hud.append(time, levelLabel, ...(mute ? [mute] : []), exit)

  const bar = el('div', 'gm-timer')
  bar.setAttribute('aria-hidden', 'true')
  const fill = el('div', 'gm-timer-fill')
  bar.append(fill)

  const sprout = el('div', 'gm-sprout')
  sprout.setAttribute('role', 'img')
  const plant = el('img', 'gm-plant')
  plant.alt = ''
  const growthEffect = el('img', 'gm-growth-effect')
  growthEffect.src = `${ART}sparkle.png`
  growthEffect.alt = ''
  const sproutCaption = el('span', 'gm-sprout-caption')
  sprout.append(growthEffect, plant, sproutCaption)

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
    const art = el('img')
    art.src = `${ART}arrow.png`
    art.alt = ''
    control.replaceChildren(art)
    pad.append(control)
  }

  const guide = el('div', 'gm-guide')
  const guideArt = el('img', 'gm-guide-art')
  guideArt.src = '/assets/customer-focus/confused.png'
  guideArt.alt = 'Rekan belajar yang menyemangati'
  const bubble = el('p', 'gm-bubble', 'Salah itu bagian dari belajar. Kita coba lagi, ya!')
  guide.append(bubble, guideArt)
  const play = el('div', 'gm-play')
  board.append(pad, el('small', 'gm-control-hint', 'PANAH / WASD · ATAU KLIK TOMBOL'))
  play.append(sprout, board, guide)
  const scene = el('div', 'gm-scene')
  const progress = el('div', 'gm-progress')
  progress.setAttribute('aria-label', 'Perkembangan tanaman')
  LEVELS.forEach((_, i) => progress.append(el('span', '', `${String(i + 1).padStart(2, '0')} ${['Bibit', 'Tunas', 'Pohon kecil', 'Pohon muda', 'Pohon besar'][i]}`)))

  const panel = el('div', 'gm-panel')
  scene.append(play, panel)
  const toolbar = el('header', 'gm-toolbar')
  toolbar.append(brand, hud)
  game.append(toolbar, bar, scene, progress)
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
    options.music?.stop()
    report()
  }

  function cancel() {
    finish(options.onCancel)
  }

  function renderSprout() {
    const fraction = correctAnswers / GROWTH_TARGET
    const name = correctAnswers === 0 ? 'seed' : correctAnswers < 4 ? 'sprout'
      : correctAnswers < 9 ? 'sapling' : correctAnswers < 16 ? 'tree-medium' : 'tree-large'
    const source = `${ART}${name}.png`
    if (plant.getAttribute('src') !== source) plant.src = source
    plant.style.height = `${95 + fraction * 225}px`
    plant.style.width = `${45 + fraction * 55}%`
    sprout.style.setProperty('--gm-tree-height', plant.style.height)
    sprout.style.setProperty('--gm-tree-width', plant.style.width)
    sprout.dataset.correct = String(correctAnswers)
    sprout.classList.toggle('is-growing', correctAnswers > 0)
    const thresholds = [1, 4, 9, 16, GROWTH_TARGET]
    Array.from(progress.children).forEach((step, i) => step.classList.toggle('is-complete', correctAnswers >= thresholds[i]))
    sprout.setAttribute('aria-label', `Tanaman bertumbuh: ${correctAnswers} dari ${GROWTH_TARGET} jawaban benar`)
    sproutCaption.textContent = `Tumbuh ${correctAnswers} / ${GROWTH_TARGET}`
  }

  function renderSlots(render: (slot: HTMLSpanElement, index: number) => void) {
    slots.replaceChildren(...pattern.map((_, index) => {
      const slot = el('span', 'gm-slot')
      render(slot, index)
      const arrow = ARROWS.find((direction) => slot.textContent?.includes(GLYPH[direction]))
      if (arrow) slot.dataset.arrow = arrow
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
    play.inert = true
    game.dataset.phase = phase
    const illustration = el('img', 'gm-panel-art')
    illustration.src = plant.src
    illustration.alt = ''
    panel.prepend(illustration)
    actions[0]?.focus()
  }

  function hidePanel() {
    panel.hidden = true
    panel.replaceChildren()
    play.removeAttribute('aria-hidden')
    play.inert = false
    game.focus()
  }

  function briefing() {
    renderSprout()
    showPanel('Pola Tumbuh', [
      'Ingat pola panah, lalu ulangi. Setiap jawaban benar membesarkan tanamanmu dari bibit menjadi pohon besar.',
      'Pakai tombol panah / WASD atau klik tombol di layar. Salah? Itu pelajaran — pola diputar ulang, coba lagi.',
      `Tuntaskan 5 tahap dalam 20 detik. Target ${PASS_SCORE} poin — setiap percobaan membuatmu tumbuh.`,
    ], [
      button('Mulai', 'gm-primary', () => guard(startRound)),
    ])
  }

  function startRound() {
    clearTimers()
    options.music?.start()
    level = 0
    bestCorrect = 0
    score = 0
    correctAnswers = 0
    deadline = Date.now() + ROUND_MS
    hidePanel()
    renderSprout()
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
    game.dataset.phase = phase
    guideArt.src = '/assets/customer-focus/confused.png'
    bubble.textContent = 'Lihat dulu, ingat arahnya. Setelah itu giliranmu!'
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
      game.dataset.phase = phase
      bubble.textContent = 'Sekarang giliranmu. Kamu pasti bisa!'
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
      correctAnswers = Math.min(GROWTH_TARGET, correctAnswers + 1)
      renderSprout()
      guideArt.src = '/assets/customer-focus/confused-happy.png'
      bubble.textContent = 'Benar! Pohonmu tumbuh sedikit lebih besar.'
      if (slot) {
        slot.textContent = `${GLYPH[arrow]} ✓`
        slot.dataset.arrow = arrow
        slot.classList.add('is-ok')
      }
      if (position === pattern.length) clearLevel()
      return
    }
    phase = 'lesson'
    game.dataset.phase = phase
    guideArt.src = '/assets/customer-focus/worried.png'
    bubble.textContent = 'Tidak apa-apa! Pelajari polanya, lalu coba lagi.'
    if (slot) {
      slot.textContent = `${GLYPH[arrow]} ✗`
      slot.dataset.arrow = arrow
      slot.classList.add('is-wrong')
    }
    message.textContent = `Pelajaran: panah ke-${position + 1} seharusnya ${GLYPH[pattern[position]]}. Perhatikan lagi!`
    later(LESSON_MS, () => showPattern('Coba lagi — pola diputar ulang.'))
  }

  function clearLevel() {
    level += 1
    bestCorrect = 0
    renderSprout()
    guideArt.src = '/assets/customer-focus/confused-happy.png'
    bubble.textContent = 'Hebat! Lihat, tanamanmu bertumbuh!'
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
    options.music?.stop()
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
      showPanel(`FAIL · ${score} / 100`, [
        `Target ${PASS_SCORE} poin belum tercapai. Coba lagi, atau lanjut dan catat skor ini.`,
      ], [
        button('Coba lagi', 'gm-primary', () => guard(startRound)),
        button('Kembali ke menu', 'gm-secondary', () => guard(cancel)),
        button('Lanjut ke stage berikutnya', 'gm-primary', () => guard(() => finish(() => options.onComplete(score)))),
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
      options.music?.stop()
      game.removeEventListener('keydown', onKeyDown)
      game.remove()
    },
  }
}
