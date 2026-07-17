import type { DailyLogs, UserProfile } from '../types'
import { addDaysStr, dateStr, getDaysInMonth, todayStr } from './date'

export type StreakDayState = 'done' | 'frozen' | 'missed' | 'pending' | 'future' | 'before-tracking'

export interface StreakHistoryDay {
  date: string
  state: StreakDayState
}

export function getStreakActiveDates(profile: UserProfile, logs: DailyLogs, today?: string): Set<string> {
  const dates = new Set(profile.streakActiveDates ?? [])
  for (const [date, day] of Object.entries(logs)) {
    if (Object.values(day.habits).some((log) => log.completed)) dates.add(date)
  }
  const frozenDates = new Set(profile.frozenDates ?? [])
  if (
    profile.streakActiveDates === undefined
    && profile.lastActiveDate
    && !frozenDates.has(profile.lastActiveDate)
    && (!today || profile.lastActiveDate <= today)
  ) dates.add(profile.lastActiveDate)
  return dates
}

export function getStreakTrackingStart(profile: UserProfile, logs: DailyLogs, today = todayStr()): string {
  const candidates = [
    ...getStreakActiveDates(profile, logs, today),
    ...(profile.frozenDates ?? []),
    ...Object.keys(logs),
  ].filter((date) => date <= today).sort()
  return candidates[0] ?? today
}

export function getStreakDayState(
  date: string,
  today: string,
  trackingStart: string,
  activeDates: Set<string>,
  frozenDates: Set<string>,
): StreakDayState {
  if (date > today) return 'future'
  if (date < trackingStart) return 'before-tracking'
  if (activeDates.has(date)) return 'done'
  if (frozenDates.has(date)) return 'frozen'
  if (date === today) return 'pending'
  return 'missed'
}

export function buildStreakWeek(
  profile: UserProfile,
  logs: DailyLogs,
  today = todayStr(),
): StreakHistoryDay[] {
  const activeDates = getStreakActiveDates(profile, logs, today)
  const frozenDates = new Set(profile.frozenDates ?? [])
  const trackingStart = getStreakTrackingStart(profile, logs, today)
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDaysStr(today, index - 6)
    return { date, state: getStreakDayState(date, today, trackingStart, activeDates, frozenDates) }
  })
}

export function buildStreakMonth(
  profile: UserProfile,
  logs: DailyLogs,
  year: number,
  month: number,
  today = todayStr(),
): StreakHistoryDay[] {
  const activeDates = getStreakActiveDates(profile, logs, today)
  const frozenDates = new Set(profile.frozenDates ?? [])
  const trackingStart = getStreakTrackingStart(profile, logs, today)
  return Array.from({ length: getDaysInMonth(year, month) }, (_, index) => {
    const date = dateStr(new Date(year, month, index + 1))
    return { date, state: getStreakDayState(date, today, trackingStart, activeDates, frozenDates) }
  })
}
