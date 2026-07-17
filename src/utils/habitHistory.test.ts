import { describe, expect, it } from 'vitest'
import type { DailyLogs, Habit } from '../types'
import { buildHabitAllTimeHistory, buildHabitMonthHistory, getHabitHistoryStatus } from './habitHistory'

function habit(partial: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Su iç',
    icon: 'water',
    categoryId: 'saglik',
    createdAt: '2026-07-01T08:00:00.000Z',
    createdDate: '2026-07-01',
    recurrence: 'daily',
    ...partial,
  }
}

function logs(entries: Record<string, { completed?: boolean; skippedAt?: string }>): DailyLogs {
  return Object.fromEntries(Object.entries(entries).map(([date, value]) => [date, {
    date,
    habits: {
      'habit-1': {
        completed: value.completed ?? false,
        skippedAt: value.skippedAt,
        boostMode: false,
        boostUsed: false,
        notes: '',
        pomodoroSessions: [],
      },
    },
  }]))
}

describe('habit history', () => {
  it('keeps an explicit skip distinct from a closed miss, including today', () => {
    const data = logs({ '2026-07-14': {}, '2026-07-15': { skippedAt: '2026-07-15T10:00:00.000Z' } })
    expect(getHabitHistoryStatus(habit(), data, '2026-07-14', '2026-07-15')).toBe('missed')
    expect(getHabitHistoryStatus(habit(), data, '2026-07-15', '2026-07-15')).toBe('explicit-skip')
  })

  it('excludes pending, future, off and pre-creation dates from success', () => {
    const result = buildHabitMonthHistory(
      habit({ createdDate: '2026-07-13', recurrence: 'custom', recurrenceDays: [1, 3, 5] }),
      logs({ '2026-07-13': { completed: true } }),
      2026,
      6,
      '2026-07-15',
    )
    expect(result.summary).toMatchObject({ completed: 1, skipped: 0, eligibleTotal: 1, successPct: 100 })
  })

  it('returns no percentage instead of zero when there is no eligible history', () => {
    const result = buildHabitMonthHistory(habit({ createdDate: '2026-07-15' }), {}, 2026, 6, '2026-07-15')
    expect(result.summary.successPct).toBeNull()
    expect(result.summary.eligibleTotal).toBe(0)
  })

  it('summarizes all scheduled days from creation through the logical today', () => {
    const result = buildHabitAllTimeHistory(
      habit({ createdDate: '2026-07-13' }),
      logs({
        '2026-07-13': { completed: true },
        '2026-07-14': { skippedAt: '2026-07-14T10:00:00.000Z' },
      }),
      '2026-07-15',
    )
    expect(result.summary).toEqual({
      completed: 1,
      explicitSkipped: 1,
      missed: 0,
      skipped: 1,
      eligibleTotal: 2,
      successPct: 50,
    })
  })
})
