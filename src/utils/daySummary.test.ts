import { describe, it, expect } from 'vitest'
import { calcDayScore, type DaySummary } from './daySummary'
import type { Habit, HabitLog, PomodoroSession, NoRushRecord, TodoItem } from '../types'

/* calcDayScore saf — DaySummary'yi elle kurarak her senaryo test edilir. */

const habit = (id: string): Habit =>
  ({ id, name: id, emoji: '⭐', categoryId: 'diger', createdAt: '2026-07-01T08:00:00.000Z' })

const log = (completed: boolean): HabitLog =>
  ({ completed, boostMode: false, boostUsed: false, notes: '', pomodoroSessions: [] })

const session = (): PomodoroSession =>
  ({ id: 'p1', habitId: 'h1', date: '2026-07-10', workDuration: 25, breakDuration: 5, timestamp: '2026-07-10T10:00:00.000Z' })

const noRush = (): NoRushRecord =>
  ({ id: 'n1', title: 'iş', stageCount: 3, totalSeconds: 600, completedAt: '2026-07-10T13:00:00.000Z' })

const todo = (): TodoItem =>
  ({ id: 't1', text: 'iş', color: '#fff', done: true, createdAt: '2026-07-10T09:00:00.000Z', completedAt: '2026-07-10T10:00:00.000Z' })

function summary(partial: Partial<DaySummary> = {}): DaySummary {
  return {
    date: '2026-07-10',
    habitEntries: [], doneCount: 0,
    water: null, wake: null,
    sessions: [], totalPomMin: 0, noRush: [], todos: [],
    ...partial,
  }
}

describe('calcDayScore', () => {
  it('hiç veri yoksa puan üretmez', () => {
    const r = calcDayScore(summary())
    expect(r.score).toBeNull()
    expect(r.label).toContain('kayıt yok')
  })

  it('tüm alışkanlıklar tamamsa 10 verir', () => {
    const r = calcDayScore(summary({
      habitEntries: [{ habit: habit('a'), log: log(true) }, { habit: habit('b'), log: log(true) }],
      doneCount: 2,
    }))
    expect(r.score).toBe(10)
    expect(r.label).toBe('Efsane bir gün!')
  })

  it('hiçbir alışkanlık yapılmadıysa 0 verir', () => {
    const r = calcDayScore(summary({
      habitEntries: [{ habit: habit('a'), log: log(false) }],
      doneCount: 0,
    }))
    expect(r.score).toBe(0)
  })

  it('olmayan hedef paydaya girmez: yarım alışkanlık günü 5 puandır', () => {
    const r = calcDayScore(summary({
      habitEntries: [{ habit: habit('a'), log: log(true) }, { habit: habit('b'), log: log(false) }],
      doneCount: 1,
    }))
    expect(r.score).toBe(5)
  })

  it('su hedefi aşımı 1\'de kırpılır', () => {
    const r = calcDayScore(summary({ water: { goal: 2000, actual: 3000 } }))
    expect(r.score).toBe(10)
  })

  it('uyanma: hedefte tam, gecikince kademeli düşer, kayıt yoksa 0', () => {
    const at = (actualTime: string | null) =>
      calcDayScore(summary({ wake: { goal: '07:00', actualTime, onTime: actualTime !== null && actualTime <= '07:00' } })).score
    expect(at('06:50')).toBe(10)
    expect(at('07:10')).toBe(8)
    expect(at('07:25')).toBe(6)
    expect(at('07:55')).toBe(4)
    expect(at('09:00')).toBe(2)
    expect(at(null)).toBe(0)
  })

  it('bileşenler ağırlıklarıyla harmanlanır (alışkanlık 5, su 2.5, uyanma 2.5)', () => {
    const r = calcDayScore(summary({
      habitEntries: [{ habit: habit('a'), log: log(true) }],
      doneCount: 1,                                  // 1.0 × 5
      water: { goal: 2000, actual: 1000 },           // 0.5 × 2.5
      wake: { goal: '07:00', actualTime: null, onTime: false }, // 0 × 2.5
    }))
    expect(r.score).toBe(6.3)  // 10 × 6.25/10 = 6.25 → 6.3'e yuvarlanır
  })

  it('kullanılan her araç +0.4 bonus verir, tavan 10', () => {
    const half = summary({
      habitEntries: [{ habit: habit('a'), log: log(true) }, { habit: habit('b'), log: log(false) }],
      doneCount: 1,
      sessions: [session()], noRush: [noRush()], todos: [todo()],
    })
    expect(calcDayScore(half).score).toBe(6.2)  // 5 + 3×0.4
  })

  it('hedefsiz günde puan yalnızca araç kullanımından gelir', () => {
    expect(calcDayScore(summary({ sessions: [session()] })).score).toBe(7)
    expect(calcDayScore(summary({ sessions: [session()], todos: [todo()] })).score).toBe(9)
    expect(calcDayScore(summary({ sessions: [session()], todos: [todo()], noRush: [noRush()] })).score).toBe(10)
  })
})
