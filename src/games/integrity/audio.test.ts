import { describe, expect, it, vi } from 'vitest'
import { MUTE_STORAGE_KEY, createGameAudio, soundsFor, type AudioDeps } from './audio'
import { createState, step } from './engine'

function fakeNode() {
  return { gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }
}

function fakeContext() {
  const source = { buffer: null as unknown, loop: false, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }
  const gains: ReturnType<typeof fakeNode>[] = []
  const context = {
    currentTime: 0,
    destination: {},
    createGain: vi.fn(() => { const node = fakeNode(); gains.push(node); return node }),
    createBufferSource: vi.fn(() => source),
    createOscillator: vi.fn(() => ({ type: '', frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() })),
    decodeAudioData: vi.fn(async () => ({})),
    close: vi.fn(async () => undefined),
  }
  return { context, source, gains }
}

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => { data[key] = value } }
}

function makeDeps(overrides: Partial<AudioDeps> = {}) {
  const fake = fakeContext()
  const storage = fakeStorage()
  const deps: AudioDeps = {
    createContext: vi.fn(() => fake.context as unknown as AudioContext),
    getStorage: () => storage,
    loadMusicBytes: vi.fn(async () => new ArrayBuffer(8)),
    ...overrides,
  }
  return { deps, storage, ...fake }
}

describe('createGameAudio', () => {
  it('creates nothing before start', () => {
    const { deps } = makeDeps()
    createGameAudio(deps)
    expect(deps.createContext).not.toHaveBeenCalled()
    expect(deps.loadMusicBytes).not.toHaveBeenCalled()
  })

  it('starts looping music once started', async () => {
    const { deps, source } = makeDeps()
    await createGameAudio(deps).start()
    expect(source.loop).toBe(true)
    expect(source.start).toHaveBeenCalledTimes(1)
  })

  it('resumes a suspended audio context after a player interaction', async () => {
    const { deps, context } = makeDeps()
    const suspended = context as typeof context & { state: string; resume: ReturnType<typeof vi.fn> }
    suspended.state = 'suspended'
    suspended.resume = vi.fn(async () => { suspended.state = 'running' })
    const audio = createGameAudio(deps)
    await audio.start()
    expect(suspended.resume).toHaveBeenCalledOnce()
    await audio.start()
    expect(suspended.resume).toHaveBeenCalledOnce()
  })

  it('keeps music quieter than effects', async () => {
    const { deps, gains } = makeDeps()
    await createGameAudio(deps).start()
    const [, musicGain, effectsGain] = gains
    expect(musicGain.gain.value).toBeLessThan(effectsGain.gain.value)
  })

  it('persists mute, zeroes master gain, and restores it', async () => {
    const { deps, storage, gains } = makeDeps()
    const audio = createGameAudio(deps)
    await audio.start()
    audio.setMuted(true)
    expect(gains[0].gain.value).toBe(0)
    expect(storage.data[MUTE_STORAGE_KEY]).toBe('1')
    expect(createGameAudio(deps).isMuted()).toBe(true)
    audio.setMuted(false)
    expect(gains[0].gain.value).toBe(1)
  })

  it('does not play effects while muted', async () => {
    const { deps, context } = makeDeps()
    const audio = createGameAudio(deps)
    await audio.start()
    audio.setMuted(true)
    audio.play('fire')
    expect(context.createOscillator).not.toHaveBeenCalled()
    audio.setMuted(false)
    audio.play('fire')
    expect(context.createOscillator).toHaveBeenCalledTimes(1)
  })

  it('does not throw when AudioContext is missing, throws, or decoding fails', async () => {
    const missing = createGameAudio(makeDeps({ createContext: () => null }).deps)
    await expect(missing.start()).resolves.toBeUndefined()
    missing.play('fire')

    const throwing = createGameAudio(makeDeps({ createContext: () => { throw new Error('blocked') } }).deps)
    await expect(throwing.start()).resolves.toBeUndefined()

    const failedDecode = makeDeps()
    failedDecode.context.decodeAudioData.mockRejectedValueOnce(new Error('bad data'))
    const audio = createGameAudio(failedDecode.deps)
    await expect(audio.start()).resolves.toBeUndefined()
    expect(() => audio.play('end')).not.toThrow()
    expect(() => audio.stop()).not.toThrow()
  })

  it('survives blocked storage', () => {
    const blocked = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
    const audio = createGameAudio(makeDeps({ getStorage: () => blocked }).deps)
    expect(audio.isMuted()).toBe(false)
    expect(() => audio.setMuted(true)).not.toThrow()
  })

  it('stop halts music and closes the context', async () => {
    const { deps, source, context } = makeDeps()
    const audio = createGameAudio(deps)
    await audio.start()
    audio.stop()
    expect(source.stop).toHaveBeenCalledTimes(1)
    expect(context.close).toHaveBeenCalledTimes(1)
    audio.play('fire')
    expect(context.createOscillator).not.toHaveBeenCalled()
  })

  it('does not start music that finishes loading after stop', async () => {
    const { deps, source } = makeDeps()
    const audio = createGameAudio(deps)
    const starting = audio.start()
    audio.stop()
    await starting
    expect(source.start).not.toHaveBeenCalled()
  })
})

describe('soundsFor', () => {
  it('reports fire, hits, countdown ticks, and the end', () => {
    const base = createState([])
    expect(soundsFor(base, { ...base, cooldownMs: 250 })).toEqual(['fire'])
    expect(soundsFor(base, { ...base, alignedHits: 1 })).toEqual(['aligned'])
    expect(soundsFor(base, { ...base, violationHits: 1 })).toEqual(['violation'])
    expect(soundsFor(base, step(base, 16))).toEqual([])

    expect(soundsFor({ ...base, clockMs: 19_990 }, { ...base, clockMs: 20_000 })).toEqual(['countdown'])
    expect(soundsFor({ ...base, clockMs: 20_000 }, { ...base, clockMs: 20_010 })).toEqual([])
    expect(soundsFor({ ...base, clockMs: 18_990 }, { ...base, clockMs: 19_000 })).toEqual([])
    expect(soundsFor({ ...base, clockMs: 24_990 }, { ...base, clockMs: 25_000, finished: true })).toEqual(['end'])
  })
})
