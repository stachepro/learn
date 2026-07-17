import type { DailyLogs, Habit } from '../types'
import { addDaysStr, todayStr } from './date'
import { getHabitHistoryStatus } from './habitHistory'

export type HabitOverviewDayStatus = 'completed' | 'skipped' | 'pending' | 'off' | 'before-created'

export interface HabitOverviewDay {
  date: string
  status: HabitOverviewDayStatus
  explicitlySkipped: boolean
}

export interface HabitOverview {
  days: HabitOverviewDay[]
  completed: number
  skipped: number
}

export function buildHabitOverview(
  habit: Habit,
  logs: DailyLogs,
  today = todayStr(),
  dayCount = 30,
): HabitOverview {
  const safeDayCount = Math.max(1, Math.floor(dayCount))
  const days = Array.from({ length: safeDayCount }, (_, index): HabitOverviewDay => {
    const date = addDaysStr(today, index - safeDayCount + 1)
    const historyStatus = getHabitHistoryStatus(habit, logs, date, today)
    if (historyStatus === 'completed') return { date, status: 'completed', explicitlySkipped: false }
    if (historyStatus === 'explicit-skip') return { date, status: 'skipped', explicitlySkipped: true }
    if (historyStatus === 'missed') return { date, status: 'skipped', explicitlySkipped: false }
    if (historyStatus === 'pending') return { date, status: 'pending', explicitlySkipped: false }
    if (historyStatus === 'off') return { date, status: 'off', explicitlySkipped: false }
    return { date, status: 'before-created', explicitlySkipped: false }
  })

  return {
    days,
    completed: days.filter((day) => day.status === 'completed').length,
    skipped: days.filter((day) => day.status === 'skipped').length,
  }
}
