import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { dateStr, logicalNow, getDayEndHour, yesterdayStr, DAY_END_HOUR_KEY } from './date'

// date.ts gün bitiş saatini localStorage'dan okur; node ortamında yok, o yüzden
// testler için minimal bir localStorage saplaması kurup değeri kontrol ediyoruz.
const store = new Map<string, string>()
const stubStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
  clear: () => store.clear(),
}

beforeEach(() => {
  store.clear()
  ;(globalThis as unknown as { localStorage: typeof stubStorage }).localStorage = stubStorage
})
afterEach(() => {
  delete (globalThis as unknown as { localStorage?: unknown }).localStorage
})

function setDayEnd(h: number) { store.set(DAY_END_HOUR_KEY, JSON.stringify(h)) }

describe('getDayEndHour', () => {
  it('ayar yoksa 0 döner', () => {
    expect(getDayEndHour()).toBe(0)
  })
  it('kayıtlı değeri okur ve 0–4 aralığına kısar', () => {
    setDayEnd(3); expect(getDayEndHour()).toBe(3)
    setDayEnd(9); expect(getDayEndHour()).toBe(4)
    setDayEnd(-2); expect(getDayEndHour()).toBe(0)
  })
})

describe('logicalNow — gün bitiş saati ötelemesi', () => {
  it('öteleme 0 iken gerçek zamanı aynen döndürür', () => {
    const base = new Date(2026, 6, 12, 1, 30) // 12 Tmz 01:30
    expect(dateStr(logicalNow(base))).toBe('2026-07-12')
  })

  it('öteleme 3 iken bitiş saatinden ÖNCEKİ erken saatler önceki güne sayılır', () => {
    setDayEnd(3)
    const early = new Date(2026, 6, 12, 1, 30) // 01:30 → hâlâ 11 Tmz'nin günü
    expect(dateStr(logicalNow(early))).toBe('2026-07-11')
  })

  it('öteleme 3 iken tam bitiş saatinde yeni güne geçer', () => {
    setDayEnd(3)
    const boundary = new Date(2026, 6, 12, 3, 0) // 03:00 → yeni gün
    expect(dateStr(logicalNow(boundary))).toBe('2026-07-12')
  })

  it('öteleme gündüz saatlerini etkilemez', () => {
    setDayEnd(3)
    const noon = new Date(2026, 6, 12, 14, 0)
    expect(dateStr(logicalNow(noon))).toBe('2026-07-12')
  })
})

describe('yesterdayStr', () => {
  it('mantıksal bugünün bir önceki günüdür', () => {
    setDayEnd(0)
    // yesterdayStr gerçek "şimdi"yi kullanır; mantıksal bugünle tutarlı olmalı
    const t = dateStr(logicalNow())
    const y = yesterdayStr()
    // y, t'den tam bir gün önce olmalı
    const back = new Date(logicalNow().getTime())
    back.setDate(back.getDate() - 1)
    expect(y).toBe(dateStr(back))
    expect(y < t).toBe(true)
  })
})
