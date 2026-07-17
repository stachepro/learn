import { describe, expect, it } from 'vitest'
import type { DailyLogs, Habit } from '../types'
import { buildHabitOverview } from './habitOverview'

function habit(partial: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Test alışkanlığı',
    icon: 'seedling',
    categoryId: 'gelisim',
    createdAt: '2026-07-01T08:00:00.000Z',
    createdDate: '2026-07-01',
    recurrence: 'daily',
    ...partial,
  }
}

function logs(entries: Record<string, { completed?: boolean; skippedAt?: string }>): DailyLogs {
  return Object.fromEntries(Object.entries(entries).map(([date, value]) => [
    date,
    {
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
    },
  ]))
}

describe('buildHabitOverview', () => {
  it('returns consecutive days ending with the logical today', () => {
    const overview = buildHabitOverview(habit(), {}, '2026-07-15', 3)
    expect(overview.days.map((day) => day.date)).toEqual(['2026-07-13', '2026-07-14', '2026-07-15'])
  })

  it('separates completed, explicit skip, closed miss, and today pending', () => {
    const overview = buildHabitOverview(habit(), logs({
      '2026-07-12': { completed: true },
      '2026-07-13': { skippedAt: '2026-07-13T10:00:00.000Z' },
    }), '2026-07-15', 4)

    expect(overview.days.map((day) => day.status)).toEqual(['completed', 'skipped', 'skipped', 'pending'])
    expect(overview.days[1].explicitlySkipped).toBe(true)
    expect(overview.days[2].explicitlySkipped).toBe(false)
    expect(overview.completed).toBe(1)
    expect(overview.skipped).toBe(2)
  })

  it('keeps unscheduled recurrence days out of the performance summary', () => {
    const overview = buildHabitOverview(habit({ recurrence: 'custom', recurrenceDays: [1, 3, 5] }), {}, '2026-07-15', 3)
    expect(overview.days.map((day) => day.status)).toEqual(['skipped', 'off', 'pending'])
    expect(overview.skipped).toBe(1)
  })

  it('leaves dates before habit creation empty', () => {
    const overview = buildHabitOverview(habit({ createdDate: '2026-07-14' }), {}, '2026-07-15', 3)
    expect(overview.days.map((day) => day.status)).toEqual(['before-created', 'skipped', 'pending'])
  })
})
