import bgmUrl from './assets/integrity-bgm.m4a'
import { ROUND_DURATION_MS, type EngineState } from './engine'

export type SoundEffect = 'fire' | 'aligned' | 'violation' | 'countdown' | 'end'

export interface AudioDeps {
  createContext: () => AudioContext | null
  getStorage: () => Pick<Storage, 'getItem' | 'setItem'> | null
  loadMusicBytes: () => Promise<ArrayBuffer>
}

export interface GameAudio {
  start: () => Promise<void>
  play: (effect: SoundEffect) => void
  isMuted: () => boolean
  setMuted: (muted: boolean) => void
  stop: (closeDelayMs?: number) => void
}

export const MUTE_STORAGE_KEY = 'integrity-game:muted'
export const END_JINGLE_MS = 900
const COUNTDOWN_SECONDS = 5
const MUSIC_VOLUME = 0.25
const EFFECTS_VOLUME = 0.5

const defaultDeps: AudioDeps = {
  createContext: () => (typeof AudioContext === 'undefined' ? null : new AudioContext()),
  getStorage: () => globalThis.localStorage ?? null,
  loadMusicBytes: async () => {
    const response = await fetch(bgmUrl)
    if (!response.ok) throw new Error(`Music request failed with status ${response.status}`)
    return response.arrayBuffer()
  },
}

function secondsLeft(state: EngineState): number {
  return Math.ceil((ROUND_DURATION_MS - state.clockMs) / 1000)
}

// Derives sound effects from what changed between two engine states, so the engine stays free of audio.
export function soundsFor(previous: EngineState, next: EngineState): SoundEffect[] {
  const sounds: SoundEffect[] = []
  if (next.cooldownMs > previous.cooldownMs) sounds.push('fire')
  if (next.alignedHits > previous.alignedHits) sounds.push('aligned')
  if (next.violationHits > previous.violationHits) sounds.push('violation')

  const remaining = secondsLeft(next)
  if (remaining < secondsLeft(previous) && remaining >= 1 && remaining <= COUNTDOWN_SECONDS) sounds.push('countdown')
  if (next.finished && !previous.finished) sounds.push('end')
  return sounds
}

function readMuted(deps: AudioDeps): boolean {
  try {
    return deps.getStorage()?.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeMuted(deps: AudioDeps, muted: boolean) {
  try {
    deps.getStorage()?.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // Storage may be blocked; the mute choice then only lasts for this session.
  }
}

export function createGameAudio(deps: AudioDeps = defaultDeps): GameAudio {
  let muted = readMuted(deps)
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let musicGain: GainNode | null = null
  let effectsGain: GainNode | null = null
  let musicSource: AudioBufferSourceNode | null = null

  function applyMute() {
    if (master) master.gain.value = muted ? 0 : 1
  }

  function playTone(type: OscillatorType, fromHz: number, toHz: number, delaySec: number, durationSec: number) {
    if (!context || !effectsGain) return
    const startAt = context.currentTime + delaySec
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(fromHz, startAt)
    oscillator.frequency.exponentialRampToValueAtTime(toHz, startAt + durationSec)
    envelope.gain.setValueAtTime(0.6, startAt)
    envelope.gain.exponentialRampToValueAtTime(0.001, startAt + durationSec)
    oscillator.connect(envelope)
    envelope.connect(effectsGain)
    oscillator.start(startAt)
    oscillator.stop(startAt + durationSec)
  }

  function playEffect(effect: SoundEffect) {
    if (effect === 'fire') playTone('square', 700, 200, 0, 0.1)
    if (effect === 'aligned') {
      playTone('square', 660, 660, 0, 0.08)
      playTone('square', 880, 880, 0.08, 0.12)
    }
    if (effect === 'violation') playTone('sawtooth', 220, 70, 0, 0.3)
    if (effect === 'countdown') playTone('square', 880, 880, 0, 0.06)
    if (effect === 'end') {
      const notes = [523, 659, 784, 1047]
      notes.forEach((hz, index) => playTone('square', hz, hz, index * 0.15, 0.14))
    }
  }

  async function startMusic(audioContext: AudioContext) {
    try {
      const bytes = await deps.loadMusicBytes()
      const buffer = await audioContext.decodeAudioData(bytes)
      if (context !== audioContext || !musicGain) return
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(musicGain)
      source.start(0)
      musicSource = source
    } catch {
      // Music is optional: a failed load or decode just leaves the round silent.
    }
  }

  return {
    async start() {
      if (context) return
      try {
        const created = deps.createContext()
        if (!created) return
        context = created
        master = created.createGain()
        musicGain = created.createGain()
        effectsGain = created.createGain()
        musicGain.gain.value = MUSIC_VOLUME
        effectsGain.gain.value = EFFECTS_VOLUME
        musicGain.connect(master)
        effectsGain.connect(master)
        master.connect(created.destination)
        applyMute()
        await startMusic(created)
      } catch {
        context = null
      }
    },

    play(effect) {
      if (!context || muted) return
      try {
        playEffect(effect)
      } catch {
        // A failed effect must never affect play.
      }
    },

    isMuted: () => muted,

    setMuted(nextMuted) {
      muted = nextMuted
      writeMuted(deps, muted)
      try {
        applyMute()
      } catch {
        // Ignore audio graph failures.
      }
    },

    stop(closeDelayMs = 0) {
      const closing = context
      const source = musicSource
      context = null
      musicSource = null
      try {
        source?.stop()
      } catch {
        // The source may already have stopped.
      }
      if (!closing) return
      const close = () => { closing.close().catch(() => undefined) }
      if (closeDelayMs > 0) setTimeout(close, closeDelayMs)
      else close()
    },
  }
}
