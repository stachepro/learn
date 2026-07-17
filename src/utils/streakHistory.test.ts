import { describe, expect, it } from 'vitest'
import type { DailyLogs, UserProfile } from '../types'
import { buildStreakMonth, getStreakActiveDates, getStreakDayState } from './streakHistory'

function profile(partial: Partial<UserProfile> = {}): UserProfile {
  return {
    username: 'Test', streak: 0, longestStreak: 0, totalExp: 0,
    level: 1, badges: [], lastActiveDate: '', ...partial,
  }
}

const logs: DailyLogs = {
  '2026-07-10': {
    date: '2026-07-10',
    habits: {
      h1: { completed: true, boostMode: false, boostUsed: false, notes: '', pomodoroSessions: [] },
    },
  },
}

describe('streak history', () => {
  it('merges persistent streak days with currently completed logs', () => {
    expect([...getStreakActiveDates(profile({ streakActiveDates: ['2026-07-09'] }), logs)].sort())
      .toEqual(['2026-07-09', '2026-07-10'])
  })

  it('keeps a persistent day active even when its habit completion was undone', () => {
    const active = getStreakActiveDates(profile({ streakActiveDates: ['2026-07-09'] }), {})
    expect(getStreakDayState('2026-07-09', '2026-07-10', '2026-07-09', active, new Set())).toBe('done')
  })

  it('does not mistake the synthetic frozen lastActiveDate for a real completion', () => {
    const active = getStreakActiveDates(profile({ lastActiveDate: '2026-07-09', frozenDates: ['2026-07-09'] }), {}, '2026-07-10')
    expect(active.has('2026-07-09')).toBe(false)
  })

  it('separates frozen, missed, pending, future and pre-tracking days', () => {
    const active = new Set<string>()
    const frozen = new Set(['2026-07-08'])
    expect(getStreakDayState('2026-07-06', '2026-07-10', '2026-07-07', active, frozen)).toBe('before-tracking')
    expect(getStreakDayState('2026-07-08', '2026-07-10', '2026-07-07', active, frozen)).toBe('frozen')
    expect(getStreakDayState('2026-07-09', '2026-07-10', '2026-07-07', active, frozen)).toBe('missed')
    expect(getStreakDayState('2026-07-10', '2026-07-10', '2026-07-07', active, frozen)).toBe('pending')
    expect(getStreakDayState('2026-07-11', '2026-07-10', '2026-07-07', active, frozen)).toBe('future')
  })

  it('builds the viewed month using the supplied logical today', () => {
    const days = buildStreakMonth(profile({ streakActiveDates: ['2026-07-09'] }), {}, 2026, 6, '2026-07-10')
    expect(days[8].state).toBe('done')
    expect(days[9].state).toBe('pending')
    expect(days[10].state).toBe('future')
  })
})
