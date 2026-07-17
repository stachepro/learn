import type { DailyLogs, Habit } from '../types'
import { addDaysStr, dateStr, getDaysInMonth, todayStr } from './date'
import { migrateHabitLog } from './habitLog'
import { isHabitScheduledFor } from './habitSchedule'

export type HabitHistoryStatus =
  | 'completed'
  | 'explicit-skip'
  | 'missed'
  | 'pending'
  | 'off'
  | 'future'
  | 'before-created'

export interface HabitHistoryDay {
  date: string
  status: HabitHistoryStatus
}

export interface HabitHistorySummary {
  completed: number
  explicitSkipped: number
  missed: number
  skipped: number
  eligibleTotal: number
  successPct: number | null
}

export function habitCreatedDate(habit: Habit): string {
  return habit.createdDate ?? habit.createdAt.slice(0, 10)
}

export function getHabitHistoryStatus(
  habit: Habit,
  logs: DailyLogs,
  date: string,
  today = todayStr(),
): HabitHistoryStatus {
  if (date < habitCreatedDate(habit)) return 'before-created'
  if (date > today) return 'future'
  if (!isHabitScheduledFor(habit, date)) return 'off'

  const rawLog = logs[date]?.habits[habit.id]
  const log = rawLog ? migrateHabitLog(rawLog) : null
  if (log?.completed) return 'completed'
  if (log?.skippedAt) return 'explicit-skip'
  if (date === today) return 'pending'
  return 'missed'
}

export function summarizeHabitHistory(days: HabitHistoryDay[]): HabitHistorySummary {
  const completed = days.filter((day) => day.status === 'completed').length
  const explicitSkipped = days.filter((day) => day.status === 'explicit-skip').length
  const missed = days.filter((day) => day.status === 'missed').length
  const skipped = explicitSkipped + missed
  const eligibleTotal = completed + skipped

  return {
    completed,
    explicitSkipped,
    missed,
    skipped,
    eligibleTotal,
    successPct: eligibleTotal === 0 ? null : Math.round((completed / eligibleTotal) * 100),
  }
}

export function buildHabitMonthHistory(
  habit: Habit,
  logs: DailyLogs,
  year: number,
  month: number,
  today = todayStr(),
): { days: HabitHistoryDay[]; summary: HabitHistorySummary } {
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, index): HabitHistoryDay => {
    const date = dateStr(new Date(year, month, index + 1))
    return { date, status: getHabitHistoryStatus(habit, logs, date, today) }
  })
  return { days, summary: summarizeHabitHistory(days) }
}

export function buildHabitAllTimeHistory(
  habit: Habit,
  logs: DailyLogs,
  today = todayStr(),
): { days: HabitHistoryDay[]; summary: HabitHistorySummary } {
  const createdDate = habitCreatedDate(habit)
  if (createdDate > today) return { days: [], summary: summarizeHabitHistory([]) }

  const days: HabitHistoryDay[] = []
  for (let date = createdDate; date <= today; date = addDaysStr(date, 1)) {
    days.push({ date, status: getHabitHistoryStatus(habit, logs, date, today) })
  }
  return { days, summary: summarizeHabitHistory(days) }
}
