import type {
  DailyLogs,
  Habit,
  HabitLog,
  NoRushRecord,
  PomodoroSession,
  TodoItem,
  WakeRecord,
  WaterEntry,
} from '../types'
import { calcDayScore, type DayScore, type DaySummary } from './daySummary'
import { dateStr, getDaysInMonth } from './date'
import { getHabitHistoryStatus } from './habitHistory'
import { migrateHabitLog } from './habitLog'
import { isWakeOnGoal, wakeGoalForRecord } from './wake'
import type { IconName } from './icons'

export type HistoryHabitStatus = 'completed' | 'explicit-skip' | 'missed' | 'pending'
export type HistoryDayTone = 'success' | 'mixed' | 'missed' | 'tools' | 'empty'

export interface HistoryHabitEntry {
  habit?: Habit
  habitId: string
  name: string
  icon: IconName
  categoryId?: string
  status: HistoryHabitStatus
  log: HabitLog
  archived: boolean
}

export interface HistorySources {
  habits: Habit[]
  logs: DailyLogs
  freeSessions: PomodoroSession[]
  noRush: NoRushRecord[]
  todos: TodoItem[]
  waterEntries: WaterEntry[]
  waterGoalForDate: (date: string) => number
  wakeRecords: WakeRecord[]
  wakeGoal: string | null
  justStartDailyCounts: Record<string, number>
}

export interface HistoryDayRecord {
  date: string
  habits: HistoryHabitEntry[]
  completed: number
  explicitSkipped: number
  missed: number
  pending: number
  sessions: PomodoroSession[]
  focusMinutes: number
  noRush: NoRushRecord[]
  todos: TodoItem[]
  justStartCount: number
  water: { actual: number; goal: number } | null
  wake: { actualTime: string; goal: string | null; onTime: boolean | null } | null
  activeToolCount: number
  hasRecordedActivity: boolean
  hasHistory: boolean
  tone: HistoryDayTone
  score: DayScore
}

export interface HistoryMonth {
  days: HistoryDayRecord[]
  feed: HistoryDayRecord[]
  completionRate: number | null
  activeDays: number
  focusMinutes: number
}

function rawHasSignal(log: HabitLog): boolean {
  return log.completed || Boolean(log.skippedAt) || log.pomodoroSessions.length > 0 ||
    Boolean(log.notes.trim()) || (log.completionCount ?? 0) > 0
}

function historyTone(completed: number, skipped: number, toolActivity: boolean): HistoryDayTone {
  if (completed > 0 && skipped > 0) return 'mixed'
  if (completed > 0) return 'success'
  if (skipped > 0) return 'missed'
  if (toolActivity) return 'tools'
  return 'empty'
}

function toScore(record: Omit<HistoryDayRecord, 'score'>): DayScore {
  const currentHabits = record.habits.filter((entry): entry is HistoryHabitEntry & { habit: Habit } => Boolean(entry.habit))
  const summary: DaySummary = {
    date: record.date,
    habitEntries: currentHabits.map((entry) => ({
      habit: entry.habit,
      log: entry.log,
      status: entry.status === 'completed' ? 'completed' : entry.status === 'pending' ? 'pending' : 'skipped',
    })),
    doneCount: currentHabits.filter((entry) => entry.status === 'completed').length,
    skippedCount: currentHabits.filter((entry) => entry.status === 'explicit-skip' || entry.status === 'missed').length,
    pendingCount: currentHabits.filter((entry) => entry.status === 'pending').length,
    water: record.water,
    wake: record.wake?.goal ? {
      goal: record.wake.goal,
      actualTime: record.wake.actualTime,
      onTime: record.wake.onTime === true,
    } : null,
    sessions: record.sessions,
    totalPomMin: record.focusMinutes,
    noRush: record.noRush,
    todos: record.todos,
    justStartCount: record.justStartCount,
  }
  return calcDayScore(summary)
}

export function buildHistoryDay(sources: HistorySources, date: string, today: string): HistoryDayRecord {
  const rawDay = sources.logs[date] ?? { date, habits: {} }
  const included = new Set<string>()
  const habits: HistoryHabitEntry[] = []

  for (const habit of sources.habits) {
    const status = getHabitHistoryStatus(habit, sources.logs, date, today)
    if (status !== 'completed' && status !== 'explicit-skip' && status !== 'missed' && status !== 'pending') continue
    const log = migrateHabitLog(rawDay.habits[habit.id] ?? {})
    included.add(habit.id)
    habits.push({
      habit,
      habitId: habit.id,
      name: habit.name,
      icon: habit.icon,
      categoryId: habit.categoryId,
      status,
      log,
      archived: false,
    })
  }

  // Legacy/orphan logs can survive old app versions. Keep their facts readable.
  for (const [habitId, rawLog] of Object.entries(rawDay.habits)) {
    if (included.has(habitId)) continue
    const log = migrateHabitLog(rawLog)
    if (!rawHasSignal(log)) continue
    const knownHabit = sources.habits.find((habit) => habit.id === habitId)
    habits.push({
      habit: knownHabit,
      habitId,
      name: knownHabit?.name ?? 'Silinmiş alışkanlık',
      icon: knownHabit?.icon ?? 'sparkles',
      categoryId: knownHabit?.categoryId,
      status: log.completed ? 'completed' : log.skippedAt ? 'explicit-skip' : date < today ? 'missed' : 'pending',
      log,
      archived: !knownHabit,
    })
  }

  const sessions = [
    ...Object.values(rawDay.habits).flatMap((rawLog) => migrateHabitLog(rawLog).pomodoroSessions),
    ...sources.freeSessions.filter((session) => session.date === date),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const noRush = sources.noRush.filter((record) => record.completedAt.startsWith(date))
  const todos = sources.todos.filter((todo) => todo.done && todo.completedAt?.startsWith(date))
  const justStartCount = sources.justStartDailyCounts[date] ?? 0
  const actualWater = sources.waterEntries.filter((entry) => entry.date === date).reduce((sum, entry) => sum + entry.ml, 0)
  const water = actualWater > 0 ? { actual: actualWater, goal: sources.waterGoalForDate(date) } : null
  const wakeRecord = sources.wakeRecords.find((record) => record.date === date)
  const wakeRecordGoal = wakeRecord ? wakeGoalForRecord(wakeRecord, sources.wakeGoal) : null
  const wake = wakeRecord ? {
    actualTime: wakeRecord.time,
    goal: wakeRecordGoal,
    onTime: isWakeOnGoal(wakeRecord, sources.wakeGoal),
  } : null

  const completed = habits.filter((entry) => entry.status === 'completed').length
  const explicitSkipped = habits.filter((entry) => entry.status === 'explicit-skip').length
  const missed = habits.filter((entry) => entry.status === 'missed').length
  const pending = habits.filter((entry) => entry.status === 'pending').length
  const hasHabitSignal = habits.some((entry) => rawHasSignal(entry.log) || entry.status === 'completed' || entry.status === 'explicit-skip')
  const toolSignals = [sessions.length, justStartCount, noRush.length, todos.length].filter((count) => count > 0).length
  const hasRecordedActivity = hasHabitSignal || toolSignals > 0 || actualWater > 0 || Boolean(wake)
  const base: Omit<HistoryDayRecord, 'score'> = {
    date,
    habits,
    completed,
    explicitSkipped,
    missed,
    pending,
    sessions,
    focusMinutes: sessions.reduce((sum, session) => sum + session.workDuration, 0),
    noRush,
    todos,
    justStartCount,
    water,
    wake,
    activeToolCount: toolSignals,
    hasRecordedActivity,
    hasHistory: habits.length > 0 || hasRecordedActivity,
    tone: historyTone(completed, explicitSkipped + missed, toolSignals > 0 || actualWater > 0 || Boolean(wake)),
  }
  return { ...base, score: toScore(base) }
}

export function buildHistoryMonth(sources: HistorySources, year: number, month: number, today: string): HistoryMonth {
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, index) =>
    buildHistoryDay(sources, dateStr(new Date(year, month, index + 1)), today))
  const decisions = days.reduce((sum, day) => sum + day.completed + day.explicitSkipped + day.missed, 0)
  const completed = days.reduce((sum, day) => sum + day.completed, 0)
  return {
    days,
    feed: days.filter((day) => day.hasRecordedActivity).reverse(),
    completionRate: decisions === 0 ? null : Math.round(completed / decisions * 100),
    activeDays: days.filter((day) => day.hasRecordedActivity).length,
    focusMinutes: days.reduce((sum, day) => sum + day.focusMinutes, 0),
  }
}

export function earliestHistoryDate(sources: HistorySources, fallback: string): string {
  const dates = [
    ...sources.habits.map((habit) => habit.createdDate ?? habit.createdAt.slice(0, 10)),
    ...Object.keys(sources.logs),
    ...sources.freeSessions.map((session) => session.date),
    ...sources.noRush.map((record) => record.completedAt.slice(0, 10)),
    ...sources.todos.flatMap((todo) => todo.completedAt ? [todo.completedAt.slice(0, 10)] : []),
    ...sources.waterEntries.map((entry) => entry.date),
    ...sources.wakeRecords.map((record) => record.date),
    ...Object.keys(sources.justStartDailyCounts),
  ].filter(Boolean).sort()
  return dates[0] ?? fallback
}
