import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { storage } from './storage'

const store = new Map<string, string>()
const fakeLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value) },
  removeItem: (key: string) => { store.delete(key) },
}

describe('Just Start storage', () => {
  beforeEach(() => {
    store.clear()
    ;(globalThis as Record<string, unknown>).localStorage = fakeLocalStorage
  })

  afterAll(() => {
    delete (globalThis as Record<string, unknown>).localStorage
  })

  it('eski yolculuk verisini ortak Luupi anahtarına taşır', () => {
    store.set('juststart_state', JSON.stringify({
      date: '2026-07-16',
      done: [true, false, false, false, false, false, false, false, false, false],
      active: 1,
      paused: true,
      pausedRemaining: 42,
      xpClaimed: false,
    }))

    const state = storage.getJustStartState()

    expect(state?.runId).toBe('2026-07-16-legacy')
    expect(state?.active).toBe(1)
    expect(state?.pausedRemaining).toBe(42)
    expect(store.has('juststart_state')).toBe(false)
    expect(store.has('luupi_just_start_state')).toBe(true)
  })

  it('eski sürümde alınmış günlük ödülü yeni istatistiğe taşır', () => {
    store.set('juststart_state', JSON.stringify({
      date: '2026-07-16',
      done: Array(10).fill(true),
      active: null,
      xpClaimed: true,
    }))
    store.set('juststart_stats', JSON.stringify({ date: '2026-07-16', today: 1, allTime: 3 }))

    storage.getJustStartState()
    const stats = storage.getJustStartStats()

    expect(stats.lastRewardDate).toBe('2026-07-16')
    expect(stats.today).toBe(1)
    expect(stats.allTime).toBe(3)
    expect(stats.dailyCounts['2026-07-16']).toBe(1)
  })

  it('aynı turu yalnızca bir kez kaydeder ve ödüllendirir', () => {
    const first = storage.recordJustStartRun('run-1', '2026-07-16')
    const duplicate = storage.recordJustStartRun('run-1', '2026-07-16')

    expect(first.isNew).toBe(true)
    expect(first.rewardGranted).toBe(true)
    expect(duplicate.isNew).toBe(false)
    expect(duplicate.rewardGranted).toBe(true)
    expect(duplicate.stats.today).toBe(1)
    expect(duplicate.stats.allTime).toBe(1)
    expect(duplicate.stats.dailyCounts['2026-07-16']).toBe(1)
  })

  it('aynı gün yeni turu sayar ama ikinci kez XP hakkı vermez', () => {
    storage.recordJustStartRun('run-1', '2026-07-16')
    const second = storage.recordJustStartRun('run-2', '2026-07-16')

    expect(second.isNew).toBe(true)
    expect(second.rewardGranted).toBe(false)
    expect(second.stats.today).toBe(2)
    expect(second.stats.allTime).toBe(2)
    expect(second.stats.dailyCounts['2026-07-16']).toBe(2)
  })

  it('yeni günde günlük ödül hakkını yeniler', () => {
    storage.recordJustStartRun('run-1', '2026-07-16')
    const nextDay = storage.recordJustStartRun('run-2', '2026-07-17')

    expect(nextDay.rewardGranted).toBe(true)
    expect(nextDay.stats.today).toBe(1)
    expect(nextDay.stats.allTime).toBe(2)
    expect(nextDay.stats.dailyCounts['2026-07-16']).toBe(1)
    expect(nextDay.stats.dailyCounts['2026-07-17']).toBe(1)
  })
})
