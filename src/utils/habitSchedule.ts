import type { Habit } from '../types'

// Parse YYYY-MM-DD to a local Date (avoids UTC-midnight timezone shifts)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Returns true when the habit is scheduled to appear on the given date string (YYYY-MM-DD)
export function isHabitScheduledFor(habit: Habit, dateStr: string): boolean {
  const recurrence = habit.recurrence ?? 'daily'
  switch (recurrence) {
    case 'once': {
      const created = habit.createdDate ?? habit.createdAt.slice(0, 10)
      return created === dateStr
    }
    case 'daily':
      return true
    case 'weekly': {
      const created = habit.createdDate ?? habit.createdAt.slice(0, 10)
      return parseLocalDate(created).getDay() === parseLocalDate(dateStr).getDay()
    }
    case 'custom': {
      if (!habit.recurrenceDays?.length) return true
      return habit.recurrenceDays.includes(parseLocalDate(dateStr).getDay())
    }
    default:
      return true
  }
}

export type WindowStatus = 'none' | 'open' | 'expired'

// Returns whether the habit's time window is still open, expired, or not set
export function getWindowStatus(habit: Habit, now: Date): WindowStatus {
  if (!habit.timeWindow) return 'none'
  const [eh, em] = habit.timeWindow.end.split(':').map(Number)
  const endMins = eh * 60 + em
  const nowMins = now.getHours() * 60 + now.getMinutes()
  return nowMins >= endMins ? 'expired' : 'open'
}

export const WEEKDAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
export const WEEKDAY_FULL  = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
