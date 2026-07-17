import { describe, expect, it } from 'vitest'
import type { Habit, HabitLog } from '../types'
import { buildHistoryDay, buildHistoryMonth, earliestHistoryDate, type HistorySources } from './history'

const habit = (id: string): Habit => ({
  id,
  name: id,
  icon: 'star',
  categoryId: 'diger',
  createdAt: '2026-07-01T08:00:00.000Z',
  createdDate: '2026-07-01',
})

const log = (partial: Partial<HabitLog> = {}): HabitLog => ({
  completed: false,
  boostMode: false,
  boostUsed: false,
  notes: '',
  pomodoroSessions: [],
  ...partial,
})

function sources(partial: Partial<HistorySources> = {}): HistorySources {
  return {
    habits: [habit('a')],
    logs: {},
    freeSessions: [],
    noRush: [],
    todos: [],
    waterEntries: [],
    waterGoalForDate: () => 2000,
    wakeRecords: [],
    wakeGoal: '07:00',
    justStartDailyCounts: {},
    ...partial,
  }
}

describe('history archive', () => {
  it('geçmiş planlı günü missed, bilinçli atlamayı explicit-skip sayar', () => {
    expect(buildHistoryDay(sources(), '2026-07-14', '2026-07-16').habits[0].status).toBe('missed')
    const skipped = buildHistoryDay(sources({
      logs: { '2026-07-15': { date: '2026-07-15', habits: { a: log({ skippedAt: '2026-07-15T10:00:00.000Z' }) } } },
    }), '2026-07-15', '2026-07-16')
    expect(skipped.explicitSkipped).toBe(1)
    expect(skipped.tone).toBe('missed')
  })

  it('araç-only günü anlamlı kayıt ve tools tonu olarak gösterir', () => {
    const day = buildHistoryDay(sources({ justStartDailyCounts: { '2026-07-16': 2 }, habits: [] }), '2026-07-16', '2026-07-16')
    expect(day.hasRecordedActivity).toBe(true)
    expect(day.activeToolCount).toBe(1)
    expect(day.tone).toBe('tools')
  })

  it('ay akışına yalnızca kayıtlı aktivite günlerini alır', () => {
    const month = buildHistoryMonth(sources({
      logs: { '2026-07-10': { date: '2026-07-10', habits: { a: log({ completed: true }) } } },
    }), 2026, 6, '2026-07-16')
    expect(month.feed.map((day) => day.date)).toEqual(['2026-07-10'])
    expect(month.activeDays).toBe(1)
    expect(month.completionRate).toBeGreaterThan(0)
  })

  it('en eski veri tarihini bütün kaynaklardan bulur', () => {
    expect(earliestHistoryDate(sources({
      habits: [],
      waterEntries: [{ id: 'w', date: '2026-05-02', time: '09:00', ml: 250, timestamp: '2026-05-02T09:00:00.000Z' }],
    }), '2026-07-16')).toBe('2026-05-02')
  })
})
