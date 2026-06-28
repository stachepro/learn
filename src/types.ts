export interface Category {
  id: string
  name: string
  emoji: string
  color: string
  isCustom?: boolean
}

export interface Habit {
  id: string
  name: string
  emoji: string
  categoryId: string
  createdAt: string
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
