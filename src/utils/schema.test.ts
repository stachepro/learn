import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { migrationsToRun, MIGRATIONS, SCHEMA_VERSION, type Migration } from './schema'

const step = (to: number): Migration => ({ to, describe: `v${to}`, run: () => {} })
const all = [step(2), step(4), step(3)]   // kasten sırasız

describe('migrationsToRun', () => {
  it('yalnızca mevcut sürümün üstündeki adımları seçer', () => {
    expect(migrationsToRun(2, 4, all).map((m) => m.to)).toEqual([3, 4])
  })

  it('adımları sürüm sırasına dizer', () => {
    expect(migrationsToRun(1, 4, all).map((m) => m.to)).toEqual([2, 3, 4])
  })

  it('hedef sürümün üstüne çıkmaz', () => {
    expect(migrationsToRun(1, 3, all).map((m) => m.to)).toEqual([2, 3])
  })

  it('güncel sürümde hiçbir adım çalıştırmaz', () => {
    expect(migrationsToRun(4, 4, all)).toEqual([])
  })

  it('veri uygulamadan yeniyse geriye adım üretmez', () => {
    expect(migrationsToRun(9, 4, all)).toEqual([])
  })

  it('güncel sürümden çalıştırılacak bir geçiş yok', () => {
    expect(migrationsToRun(SCHEMA_VERSION)).toEqual([])
  })
})

/* v2 adımı — testler node ortamında koştuğu için localStorage taklit edilir */
describe('v2: başlangıç dondurma hakkı', () => {
  const PROFILE_KEY = 'luupi_user_profile'
  const store = new Map<string, string>()
  const fakeLocalStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
  }
  const run = MIGRATIONS.find((m) => m.to === 2)!.run

  beforeEach(() => {
    store.clear()
    ;(globalThis as Record<string, unknown>).localStorage = fakeLocalStorage
  })
  afterAll(() => {
    delete (globalThis as Record<string, unknown>).localStorage
  })

  const readProfile = () => JSON.parse(store.get(PROFILE_KEY)!) as {
    streak: number; streakFreezes?: number; freezeProgress?: number
  }

  it('serinin her 7 günü için 1 dondurma verir (maks 3)', () => {
    store.set(PROFILE_KEY, JSON.stringify({ streak: 16 }))
    run()
    expect(readProfile().streakFreezes).toBe(2)
    expect(readProfile().freezeProgress).toBe(2)  // 16 % 7
  })

  it('3 hakta tavan yapar, sayaç sıfırdan bekler', () => {
    store.set(PROFILE_KEY, JSON.stringify({ streak: 40 }))
    run()
    expect(readProfile().streakFreezes).toBe(3)
    expect(readProfile().freezeProgress).toBe(0)
  })

  it('kısa seri hak vermez, sayaç seriden başlar', () => {
    store.set(PROFILE_KEY, JSON.stringify({ streak: 4 }))
    run()
    expect(readProfile().streakFreezes).toBe(0)
    expect(readProfile().freezeProgress).toBe(4)
  })

  it('alan zaten varsa dokunmaz (iki kez koşsa da güvenli)', () => {
    store.set(PROFILE_KEY, JSON.stringify({ streak: 20, streakFreezes: 1, freezeProgress: 5 }))
    run()
    expect(readProfile().streakFreezes).toBe(1)
    expect(readProfile().freezeProgress).toBe(5)
  })

  it('profil hiç yoksa sessizce geçer', () => {
    expect(() => run()).not.toThrow()
    expect(store.has(PROFILE_KEY)).toBe(false)
  })
})

describe('v3: kalıcı streak günleri', () => {
  const PROFILE_KEY = 'luupi_user_profile'
  const LOGS_KEY = 'luupi_daily_logs'
  const store = new Map<string, string>()
  const fakeLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
  }
  const run = MIGRATIONS.find((migration) => migration.to === 3)!.run

  beforeEach(() => {
    store.clear()
    ;(globalThis as Record<string, unknown>).localStorage = fakeLocalStorage
  })
  afterAll(() => { delete (globalThis as Record<string, unknown>).localStorage })

  it('tamamlanan log günlerini ve son aktif günü profile taşır', () => {
    store.set(PROFILE_KEY, JSON.stringify({ lastActiveDate: '2026-07-10' }))
    store.set(LOGS_KEY, JSON.stringify({
      '2026-07-09': { habits: { h1: { completed: true } } },
      '2026-07-08': { habits: { h1: { completed: false } } },
    }))
    run()
    expect(JSON.parse(store.get(PROFILE_KEY)!).streakActiveDates).toEqual(['2026-07-09', '2026-07-10'])
  })

  it('alan zaten varsa geçmişe dokunmaz', () => {
    store.set(PROFILE_KEY, JSON.stringify({ lastActiveDate: '2026-07-10', streakActiveDates: ['2026-07-01'] }))
    run()
    expect(JSON.parse(store.get(PROFILE_KEY)!).streakActiveDates).toEqual(['2026-07-01'])
  })

  it('dondurma muhasebesinin sentetik son aktif tarihini gerçek tamamlanma saymaz', () => {
    store.set(PROFILE_KEY, JSON.stringify({ lastActiveDate: '2026-07-10', frozenDates: ['2026-07-10'] }))
    run()
    expect(JSON.parse(store.get(PROFILE_KEY)!).streakActiveDates).toEqual([])
  })
})
