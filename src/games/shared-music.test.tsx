// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { BlindBuilder } from './collaborative/BlindBuilder'
import { MatchTheSolution } from './customer-focus/MatchTheSolution'
import { GrowthMindsetGame } from './growth-mindset/GrowthMindsetGame'
import { AccountabilityGame } from './accountability/AccountabilityGame'
import { MUTE_STORAGE_KEY } from './integrity/audio'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

it('loops the shared music across games, stops it at results or exit, and keeps mute preference', async () => {
  const preferences = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => preferences.get(key) ?? null,
    setItem: (key: string, value: string) => { preferences.set(key, value) },
  })
  const sources: Array<{ loop: boolean; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn> }> = []
  class FakeAudioContext {
    destination = {}
    currentTime = 0
    createGain() { return { gain: { value: 1 }, connect: vi.fn() } }
    createBufferSource() {
      const source = { loop: false, start: vi.fn(), stop: vi.fn(), connect: vi.fn() }
      sources.push(source)
      return source
    }
    async decodeAudioData() { return {} }
    async resume() {}
    async close() {}
  }
  vi.stubGlobal('AudioContext', FakeAudioContext)
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))

  const collaborative = render(<BlindBuilder context={{ valueId: 'collaborative', playerName: 'Ayu', priorResults: [] }} onComplete={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />)
  await waitFor(() => expect(sources[0]?.start).toHaveBeenCalledOnce())
  expect(sources[0].loop).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Matikan suara' }))
  expect(preferences.get(MUTE_STORAGE_KEY)).toBe('1')
  fireEvent.click(screen.getByRole('button', { name: 'Submit round' }))
  expect(sources[0].stop).toHaveBeenCalledOnce()
  collaborative.unmount()

  render(<MatchTheSolution context={{ valueId: 'customer-focus', playerName: 'Ayu', priorResults: [] }} onComplete={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />)
  expect(sources).toHaveLength(1)
  expect(screen.getByRole('button', { name: 'Nyalakan suara' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Mulai ronde' }))
  await waitFor(() => expect(sources[1]?.start).toHaveBeenCalledOnce())
  expect(sources[1].loop).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Nyalakan suara' }))
  expect(preferences.get(MUTE_STORAGE_KEY)).toBe('0')
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
  expect(sources[1].stop).toHaveBeenCalledOnce()
  cleanup()

  const growth = render(<GrowthMindsetGame context={{ valueId: 'growth-mindset', playerName: 'Ayu', priorResults: [] }} onComplete={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Matikan suara' }).getAttribute('aria-pressed')).toBe('false')
  fireEvent.click(screen.getByRole('button', { name: 'Mulai' }))
  await waitFor(() => expect(sources[2]?.start).toHaveBeenCalledOnce())
  expect(sources[2].loop).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Matikan suara' }))
  expect(preferences.get(MUTE_STORAGE_KEY)).toBe('1')
  fireEvent.click(screen.getByRole('button', { name: 'Keluar' }))
  expect(sources[2].stop).toHaveBeenCalledOnce()
  growth.unmount()

  const accountability = render(<AccountabilityGame context={{ valueId: 'accountability', playerName: 'Ayu', priorResults: [] }} onComplete={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Nyalakan suara' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
  await waitFor(() => expect(sources[3]?.start).toHaveBeenCalledOnce())
  expect(sources[3].loop).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Nyalakan suara' }))
  expect(preferences.get(MUTE_STORAGE_KEY)).toBe('0')
  const endTime = performance.now() + 20_001
  vi.spyOn(performance, 'now').mockReturnValue(endTime)
  fireEvent(document, new Event('visibilitychange'))
  expect(screen.getByRole('heading', { name: 'Waktu Habis!' })).toBeTruthy()
  expect(sources[3].stop).toHaveBeenCalledOnce()
  accountability.unmount()
})
