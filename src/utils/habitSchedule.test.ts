import { describe, it, expect } from 'vitest'
import { isHabitScheduledFor, getWindowStatus } from './habitSchedule'
import type { Habit, RecurrenceType } from '../types'

// 2026-07-06 Pzt · 07-08 Çar · 07-10 Cum · 07-13 Pzt · 07-17 Cum
function habit(partial: Partial<Habit> = {}): Habit {
  return {
    id: 'h1', name: 'Test', emoji: '⭐', categoryId: 'diger',
    createdAt: '2026-07-06T09:00:00.000Z', createdDate: '2026-07-06',
    ...partial,
  }
}

describe('isHabitScheduledFor', () => {
  it('recurrence tanımsızsa her gün görünür (eski kayıtlar)', () => {
    expect(isHabitScheduledFor(habit(), '2026-07-10')).toBe(true)
  })

  it('daily her gün görünür', () => {
    expect(isHabitScheduledFor(habit({ recurrence: 'daily' }), '2026-07-17')).toBe(true)
  })

  it('once yalnızca oluşturulduğu gün görünür', () => {
    const h = habit({ recurrence: 'once' })
    expect(isHabitScheduledFor(h, '2026-07-06')).toBe(true)
    expect(isHabitScheduledFor(h, '2026-07-07')).toBe(false)
  })

  it('createdDate yoksa once için createdAt tarihine düşer', () => {
    const h = habit({ recurrence: 'once', createdDate: undefined })
    expect(isHabitScheduledFor(h, '2026-07-06')).toBe(true)
  })

  it('weekly oluşturulduğu haftanın gününde görünür', () => {
    const h = habit({ recurrence: 'weekly' })   // Pazartesi oluşturuldu
    expect(isHabitScheduledFor(h, '2026-07-13')).toBe(true)   // Pazartesi
    expect(isHabitScheduledFor(h, '2026-07-10')).toBe(false)  // Cuma
  })

  it('custom yalnızca seçilen günlerde görünür', () => {
    const h = habit({ recurrence: 'custom', recurrenceDays: [1, 5] })  // Pzt, Cum
    expect(isHabitScheduledFor(h, '2026-07-13')).toBe(true)   // Pzt
    expect(isHabitScheduledFor(h, '2026-07-10')).toBe(true)   // Cum
    expect(isHabitScheduledFor(h, '2026-07-08')).toBe(false)  // Çar
  })

  it('custom seçili gün yoksa her gün görünür', () => {
    expect(isHabitScheduledFor(habit({ recurrence: 'custom', recurrenceDays: [] }), '2026-07-08')).toBe(true)
  })

  // Regresyon koruması: tarihler yerel olarak ayrıştırılmalı. new Date('2026-07-10')
  // UTC gece yarısı verir ve UTC+3'te bir gün geriye kayar.
  it('gün adını saat diliminden bağımsız çözer', () => {
    const cuma = habit({ recurrence: 'custom', recurrenceDays: [5] })
    expect(isHabitScheduledFor(cuma, '2026-07-10')).toBe(true)
    const persembe = habit({ recurrence: 'custom', recurrenceDays: [4] })
    expect(isHabitScheduledFor(persembe, '2026-07-10')).toBe(false)
  })

  it('bilinmeyen recurrence değerinde görünür kalır', () => {
    expect(isHabitScheduledFor(habit({ recurrence: 'saçma' as RecurrenceType }), '2026-07-10')).toBe(true)
  })
})

describe('getWindowStatus', () => {
  const at = (h: number, m: number) => new Date(2026, 6, 10, h, m)

  it('saat aralığı yoksa none döner', () => {
    expect(getWindowStatus(habit(), at(12, 0))).toBe('none')
  })

  it('bitiş saatinden önce açıktır', () => {
    const h = habit({ timeWindow: { start: '07:00', end: '09:00' } })
    expect(getWindowStatus(h, at(8, 59))).toBe('open')
  })

  it('bitiş saatinde ve sonrasında süresi dolar', () => {
    const h = habit({ timeWindow: { start: '07:00', end: '09:00' } })
    expect(getWindowStatus(h, at(9, 0))).toBe('expired')
    expect(getWindowStatus(h, at(23, 30))).toBe('expired')
  })
})
