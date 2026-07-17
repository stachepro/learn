import { describe, expect, it } from 'vitest'
import type { WaterEntry } from '../types'
import { daysGoalMet, elapsedDaysInMonth, formatWaterAmount, waterMonthSummary } from './water'

function entry(date: string, ml: number, id = date): WaterEntry {
  return { id, date, ml, time: '09:00', timestamp: `${date}T09:00:00.000Z` }
}

describe('water utilities', () => {
  it('miktarı Türkçe ve kompakt gösterir', () => {
    expect(formatWaterAmount(750)).toBe('750 ml')
    expect(formatWaterAmount(1600)).toBe('1,6 L')
  })

  it('içinde bulunulan ayın ortalamasına gelecek günleri katmaz', () => {
    const entries = [entry('2026-07-01', 1000), entry('2026-07-02', 2000)]
    const result = waterMonthSummary(entries, 2026, 6, '2026-07-02', 2500)
    expect(result.elapsedDays).toBe(2)
    expect(result.average).toBe(1500)
  })

  it('gelecek ayı ölçülebilir gün olmadan döndürür', () => {
    expect(elapsedDaysInMonth(2026, 7, '2026-07-16')).toBe(0)
  })

  it('hedef günlerini o günün hedefiyle değerlendirir', () => {
    const entries = [entry('2026-07-01', 2000), entry('2026-07-02', 2500)]
    expect(daysGoalMet(entries, (date) => date === '2026-07-01' ? 2000 : 3000)).toBe(1)
  })
})
