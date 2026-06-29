export interface Category {
  id: string
  name: string
  emoji: string
  color: string
  isCustom?: boolean
}

export type CompletionMode = 'single' | 'multi' | 'pomodoro'
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'custom'

export interface ScheduleOptions {
  recurrence?: RecurrenceType
  recurrenceDays?: number[]              // 0=Sun…6=Sat; used when recurrence='custom'
  timeWindow?: { start: string; end: string }  // "HH:MM" local time
}

export interface Habit {
  id: string
  name: string
  emoji: string
  categoryId: string
  createdAt: string
  createdDate?: string               // YYYY-MM-DD; for 'once' and 'weekly' recurrence
  completionMode?: CompletionMode
  completionGoal?: number            // target count for 'multi'; pomodoro count for 'pomodoro'
  // Legacy fields — kept for backward compatibility
  pomodoroEnabled?: boolean
  pomodoroGoal?: number
  // Scheduling
  recurrence?: RecurrenceType        // undefined = 'daily' (backward compat)
  recurrenceDays?: number[]
  timeWindow?: { start: string; end: string }
}

export function getHabitMode(habit: Habit): CompletionMode {
  if (habit.completionMode) return habit.completionMode
  if (habit.pomodoroEnabled) return 'pomodoro'
  return 'single'
}

export function getHabitGoal(habit: Habit): number {
  return habit.completionGoal ?? habit.pomodoroGoal ?? 0
}

export interface PomodoroSession {
  id: string
  habitId: string
  date: string
  workDuration: number
  breakDuration: number
  timestamp: string
  xp?: number // XP awarded for this session (15 = boost success, 10 = normal, 0 = boost fail)
}

export interface HabitLog {
  completed: boolean
  boostMode: boolean    // was hardMode
  boostUsed: boolean    // locked true after a successful boost pomodoro
  notes: string
  pomodoroSessions: PomodoroSession[]
  completedAt?: string
  completionCount?: number  // for 'multi' mode — how many times tapped today
}

export interface DayLog {
  date: string
  habits: Record<string, HabitLog>
}

export type DailyLogs = Record<string, DayLog>

export interface UserProfile {
  username: string
  streak: number
  longestStreak: number
  totalExp: number
  justStartXP?: number
  level: number
  badges: string[]
  lastActiveDate: string
}

export interface PomodoroSettings {
  workDuration: number
  breakDuration: number
}

export interface Badge {
  id: string
  name: string
  description: string
  condition: string
}
