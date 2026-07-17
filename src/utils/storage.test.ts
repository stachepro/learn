import { describe, it, expect } from 'vitest'
import { migrateHabit } from './storage'
import type { Habit } from '../types'

const base = { id: 'h1', name: 'Su iç', createdAt: '2026-07-01T08:00:00.000Z' }

describe('migrateHabit', () => {
  it('eksik alanlara varsayılan verir', () => {
    const h = migrateHabit({ ...base })
    expect(h.icon).toBe('sparkles')
    expect(h.categoryId).toBe('diger')
  })

  it('eski emojiyi ikon kimliğine taşır ve kategoriyi ezmez', () => {
    const h = migrateHabit({ ...base, emoji: '💧', categoryId: 'saglik' })
    expect(h.icon).toBe('water')
    expect(h.categoryId).toBe('saglik')
  })

  // Regresyon: bu iki alan bir zamanlar okuma sırasında sessizce düşüyordu,
  // yani seçilen kart rengi ve günün vakti her açılışta sıfırlanıyordu
  it('labelColor ve timeOfDay alanlarını korur', () => {
    const h = migrateHabit({ ...base, labelColor: '#22c55e', timeOfDay: 'evening' })
    expect(h.labelColor).toBe('#22c55e')
    expect(h.timeOfDay).toBe('evening')
  })

  it('zamanlama alanlarını olduğu gibi taşır', () => {
    const h = migrateHabit({
      ...base,
      recurrence: 'custom',
      recurrenceDays: [1, 3, 5],
      timeWindow: { start: '07:00', end: '09:00' },
      createdDate: '2026-07-01',
      completionMode: 'multi',
      completionGoal: 3,
    })
    expect(h.recurrence).toBe('custom')
    expect(h.recurrenceDays).toEqual([1, 3, 5])
    expect(h.timeWindow).toEqual({ start: '07:00', end: '09:00' })
    expect(h.createdDate).toBe('2026-07-01')
    expect(h.completionMode).toBe('multi')
    expect(h.completionGoal).toBe(3)
  })

  // migrateHabit alanları tek tek saymak yerine yayılım kullanır; Habit'e
  // eklenecek her yeni alan otomatik hayatta kalmalı
  it('sonradan eklenen bilinmeyen alanları düşürmez', () => {
    const withFutureField = { ...base, someFutureField: 42 } as unknown as Habit
    const h = migrateHabit(withFutureField) as unknown as { someFutureField?: number }
    expect(h.someFutureField).toBe(42)
  })
})
