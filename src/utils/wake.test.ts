import { describe, expect, it } from 'vitest'
import type { WakeRecord } from '../types'
import { averageWakeTime, formatWakeDifference, wakeGoalDifference, wakeGoalRate, wakeRhythmStreak } from './wake'

const record = (date: string, time: string, goal?: string | null): WakeRecord => ({ date, time, goal })

describe('wake utilities', () => {
  it('gece yarısı çevresindeki ortalamayı dairesel hesaplar', () => {
    expect(averageWakeTime([record('2026-07-01', '23:50'), record('2026-07-02', '00:10')])).toBe('00:00')
  })

  it('hedef farkını gece yarısından geçirerek hesaplar', () => {
    expect(wakeGoalDifference('00:10', '23:50')).toBe(20)
    expect(formatWakeDifference(-12)).toBe('Hedefinden 12 dk önce')
  })

  it('ardışık ritmi bugün yoksa dünden geriye sayar', () => {
    const records = [record('2026-07-13', '07:00'), record('2026-07-14', '07:00'), record('2026-07-15', '07:00')]
    expect(wakeRhythmStreak(records, '2026-07-16')).toBe(3)
  })

  it('başarı oranında kayıt anındaki hedefi kullanır', () => {
    const records = [record('2026-07-14', '07:30', '08:00'), record('2026-07-15', '07:30', '07:00')]
    expect(wakeGoalRate(records, '09:00')).toBe(50)
  })
})
