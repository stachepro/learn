import type { PomodoroSession } from '../types'

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

// Base 50 XP for completing a habit + sum of each session's XP (default 10; boost=15)
export function calcHabitExp(sessions: PomodoroSession[]): number {
  return 50 + sessions.reduce((acc, s) => acc + (s.xp ?? 10), 0)
}
