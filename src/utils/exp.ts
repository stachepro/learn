import type { DailyLogs, PomodoroSession, UserProfile } from '../types'
import { migrateHabitLog } from './habitLog'

const BASE_EXP_PER_LEVEL = 200
const LEVEL_MULTIPLIER = 1.2

export function expRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0
  for (let i = 1; i < level; i++) {
    total += Math.round(BASE_EXP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, i - 1))
  }
  return total
}

export function expForNextLevel(level: number): number {
  return Math.round(BASE_EXP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1))
}

export function getLevelFromExp(totalExp: number): number {
  let level = 1
  while (totalExp >= expRequiredForLevel(level + 1)) {
    level++
  }
  return level
}

export function expProgressInCurrentLevel(totalExp: number): {
  current: number
  needed: number
  percentage: number
} {
  const level = getLevelFromExp(totalExp)
  const expAtCurrentLevel = expRequiredForLevel(level)
  const needed = expForNextLevel(level)
  const current = totalExp - expAtCurrentLevel
  return { current, needed, percentage: Math.min(100, (current / needed) * 100) }
}

export const HABIT_COMPLETION_EXP = 50
export const DEFAULT_SESSION_EXP = 10

export function calcSessionsExp(sessions: PomodoroSession[]): number {
  return sessions.reduce((acc, s) => acc + (s.xp ?? DEFAULT_SESSION_EXP), 0)
}

// Tamamlama bonusu + oturum XP'leri. Oturum XP'si tamamlamadan bağımsızdır:
// pomodoro çevirdiysen alışkanlığı o gün bitirmesen de o XP hakkındır.
export function calcHabitExp(log: { completed: boolean; pomodoroSessions: PomodoroSession[] }): number {
  return (log.completed ? HABIT_COMPLETION_EXP : 0) + calcSessionsExp(log.pomodoroSessions)
}

// totalExp tek bir kaynaktan türetilir: kalıcı kovalar (Just Start + silinen
// alışkanlıklardan bankaya alınan) + günlük kayıtlar + serbest pomodoro oturumları.
// XP veren her yol bu formülde temsil edildiği için hiçbir kazanç sonraki hesapta
// kaybolmaz; silinen alışkanlığın XP'si de bankedExp üzerinden korunur.
export function calcTotalExp(
  logs: DailyLogs,
  base: Pick<UserProfile, 'justStartXP' | 'bankedExp'>,
  freeSessions: PomodoroSession[],
): number {
  let total = (base.justStartXP ?? 0) + (base.bankedExp ?? 0)
  for (const day of Object.values(logs))
    for (const log of Object.values(day.habits))
      total += calcHabitExp(migrateHabitLog(log))
  return total + calcSessionsExp(freeSessions)
}
