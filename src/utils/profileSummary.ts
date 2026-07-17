import type { Badge, DailyLogs, PomodoroSession, UserProfile } from '../types'
import { migrateHabitLog } from './habitLog'

export interface ProfileSummary {
  totalCompleted: number
  totalPomodoros: number
  totalFocusMinutes: number
  totalBoostUsed: number
  activeDays: number
  averageFocusMinutes: number
  bestFocusMinutes: number
}

export function buildProfileSummary(logs: DailyLogs, freeSessions: PomodoroSession[]): ProfileSummary {
  const minutesByDay = new Map<string, number>()
  const activeDates = new Set<string>()
  let totalCompleted = 0
  let totalPomodoros = 0
  let totalFocusMinutes = 0
  let totalBoostUsed = 0

  for (const [date, day] of Object.entries(logs)) {
    for (const rawLog of Object.values(day.habits)) {
      const log = migrateHabitLog(rawLog)
      const focusMinutes = log.pomodoroSessions.reduce((sum, session) => sum + session.workDuration, 0)
      totalCompleted += log.completed ? 1 : 0
      totalBoostUsed += log.boostUsed ? 1 : 0
      totalPomodoros += log.pomodoroSessions.length
      totalFocusMinutes += focusMinutes
      minutesByDay.set(date, (minutesByDay.get(date) ?? 0) + focusMinutes)
      if (log.completed || log.pomodoroSessions.length > 0) activeDates.add(date)
    }
  }

  for (const session of freeSessions) {
    totalPomodoros += 1
    totalFocusMinutes += session.workDuration
    minutesByDay.set(session.date, (minutesByDay.get(session.date) ?? 0) + session.workDuration)
    activeDates.add(session.date)
  }

  const activeFocusDays = [...minutesByDay.values()].filter((minutes) => minutes > 0)
  return {
    totalCompleted,
    totalPomodoros,
    totalFocusMinutes,
    totalBoostUsed,
    activeDays: activeDates.size,
    averageFocusMinutes: activeFocusDays.length
      ? Math.round(activeFocusDays.reduce((sum, minutes) => sum + minutes, 0) / activeFocusDays.length)
      : 0,
    bestFocusMinutes: activeFocusDays.length ? Math.max(...activeFocusDays) : 0,
  }
}

export interface AchievementMetrics {
  totalCompleted: number
  totalPomodoros: number
  totalFocusMinutes: number
  totalBoostUsed: number
  longestStreak: number
  level: number
  totalExp: number
  waterEntries: number
  waterGoalDays: number
  waterBestDayMl: number
  waterTotalMl: number
  wakeRecords: number
  wakeGoalDays: number
  todoCompleted: number
  noRushCompleted: number
  noRushSeconds: number
}

type MetricKey = keyof AchievementMetrics

const BADGE_TARGETS: Record<string, { metric: MetricKey; target: number }> = {
  first_step: { metric: 'totalCompleted', target: 1 },
  total_10: { metric: 'totalCompleted', target: 10 },
  total_50: { metric: 'totalCompleted', target: 50 },
  total_250: { metric: 'totalCompleted', target: 250 },
  streak_3: { metric: 'longestStreak', target: 3 },
  on_fire: { metric: 'longestStreak', target: 7 },
  consistent: { metric: 'longestStreak', target: 14 },
  unstoppable: { metric: 'longestStreak', target: 30 },
  century: { metric: 'longestStreak', target: 100 },
  hard_worker: { metric: 'totalBoostUsed', target: 10 },
  first_pomodoro: { metric: 'totalPomodoros', target: 1 },
  pomodoro_10: { metric: 'totalPomodoros', target: 10 },
  pomodoro_addict: { metric: 'totalPomodoros', target: 50 },
  pomodoro_200: { metric: 'totalPomodoros', target: 200 },
  deep_focus: { metric: 'totalFocusMinutes', target: 600 },
  focus_50h: { metric: 'totalFocusMinutes', target: 3000 },
  water_first: { metric: 'waterEntries', target: 1 },
  water_goal_1: { metric: 'waterGoalDays', target: 1 },
  water_goal_7: { metric: 'waterGoalDays', target: 7 },
  water_goal_30: { metric: 'waterGoalDays', target: 30 },
  water_3l_day: { metric: 'waterBestDayMl', target: 3000 },
  water_100l: { metric: 'waterTotalMl', target: 100_000 },
  wake_first: { metric: 'wakeRecords', target: 1 },
  wake_7: { metric: 'wakeRecords', target: 7 },
  wake_30: { metric: 'wakeRecords', target: 30 },
  wake_on_goal_5: { metric: 'wakeGoalDays', target: 5 },
  todo_5: { metric: 'todoCompleted', target: 5 },
  todo_25: { metric: 'todoCompleted', target: 25 },
  norush_first: { metric: 'noRushCompleted', target: 1 },
  norush_10: { metric: 'noRushCompleted', target: 10 },
  norush_5h: { metric: 'noRushSeconds', target: 18_000 },
  level_5: { metric: 'level', target: 5 },
  level_10: { metric: 'level', target: 10 },
  level_20: { metric: 'level', target: 20 },
  exp_1000: { metric: 'totalExp', target: 1000 },
  exp_5000: { metric: 'totalExp', target: 5000 },
}

export interface BadgeTarget {
  badge: Badge
  current: number
  target: number
  percentage: number
}

export function getNextBadgeTargets(
  badges: Badge[],
  earnedBadgeIds: string[],
  metrics: AchievementMetrics,
  limit = 3,
): BadgeTarget[] {
  const earned = new Set(earnedBadgeIds)
  return badges
    .map((badge, index) => {
      const definition = BADGE_TARGETS[badge.id]
      if (!definition || earned.has(badge.id)) return null
      const current = Math.max(0, metrics[definition.metric])
      return {
        badge,
        current,
        target: definition.target,
        percentage: Math.min(100, (current / definition.target) * 100),
        index,
      }
    })
    .filter((target): target is BadgeTarget & { index: number } => target !== null)
    .sort((a, b) => b.percentage - a.percentage || a.index - b.index)
    .slice(0, limit)
    .map(({ index: _index, ...target }) => target)
}

export function badgeCategory(badgeId: string): string {
  if (badgeId.startsWith('water_')) return 'Su ritmi'
  if (badgeId.startsWith('wake_')) return 'Sabah ritmi'
  if (badgeId.startsWith('todo_')) return 'Görevler'
  if (badgeId.startsWith('norush_')) return 'Acele Yok'
  if (['streak_3', 'on_fire', 'consistent', 'unstoppable', 'century'].includes(badgeId)) return 'Seri'
  if (badgeId.startsWith('pomodoro_') || badgeId === 'first_pomodoro' || badgeId === 'deep_focus' || badgeId === 'focus_50h') return 'Odak'
  if (badgeId.startsWith('level_') || badgeId.startsWith('exp_')) return 'Seviye'
  return 'Alışkanlıklar'
}

export function profileDisplayName(profile: UserProfile): string {
  const name = profile.username.trim()
  return !name || name === 'Luupi Kullanıcısı' ? 'Luupi yolculuğu' : name
}
