import { describe, expect, it } from 'vitest'
import type { Badge, DailyLogs, PomodoroSession } from '../types'
import { buildProfileSummary, getNextBadgeTargets, profileDisplayName, type AchievementMetrics } from './profileSummary'

const session = (date: string, workDuration: number): PomodoroSession => ({
  id: `${date}-${workDuration}`,
  habitId: '__free__',
  date,
  workDuration,
  breakDuration: 5,
  timestamp: `${date}T12:00:00.000Z`,
})

describe('buildProfileSummary', () => {
  it('includes free sessions in totals, active days and day records', () => {
    const logs: DailyLogs = {
      '2026-07-14': {
        date: '2026-07-14',
        habits: {
          h1: { completed: true, boostMode: false, boostUsed: true, notes: '', pomodoroSessions: [session('2026-07-14', 25)] },
        },
      },
    }
    const summary = buildProfileSummary(logs, [session('2026-07-15', 40), session('2026-07-14', 15)])
    expect(summary).toMatchObject({
      totalCompleted: 1,
      totalPomodoros: 3,
      totalFocusMinutes: 80,
      totalBoostUsed: 1,
      activeDays: 2,
      averageFocusMinutes: 40,
      bestFocusMinutes: 40,
    })
  })
})

describe('getNextBadgeTargets', () => {
  it('returns the closest unearned measurable targets first', () => {
    const metrics: AchievementMetrics = {
      totalCompleted: 9, totalPomodoros: 2, totalFocusMinutes: 30, totalBoostUsed: 0,
      longestStreak: 1, level: 1, totalExp: 100, waterEntries: 0, waterGoalDays: 0,
      waterBestDayMl: 0, waterTotalMl: 0, wakeRecords: 0, wakeGoalDays: 0,
      todoCompleted: 0, noRushCompleted: 0, noRushSeconds: 0,
    }
    const badges: Badge[] = [
      { id: 'first_step', name: 'İlk', icon: 'seedling', description: '', condition: '' },
      { id: 'total_10', name: 'On', icon: 'circle-check', description: '', condition: '' },
      { id: 'streak_3', name: 'Seri', icon: 'bolt', description: '', condition: '' },
    ]
    expect(getNextBadgeTargets(badges, ['first_step'], metrics, 2).map((target) => target.badge.id)).toEqual(['total_10', 'streak_3'])
  })
})

describe('profileDisplayName', () => {
  it('does not expose the generic default identity', () => {
    expect(profileDisplayName({ username: 'Luupi Kullanıcısı' } as never)).toBe('Luupi yolculuğu')
  })
})
