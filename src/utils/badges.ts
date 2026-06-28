import type { Badge, DailyLogs, UserProfile } from '../types'

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_step',
    name: 'İlk Adım',
    description: 'İlk alışkanlığını tamamla',
    condition: '1 alışkanlık tamamla',
  },
  {
    id: 'on_fire',
    name: 'Ateşte',
    description: '7 günlük seri',
    condition: '7 günlük seriye ulaş',
  },
  {
    id: 'consistent',
    name: 'Tutarlı',
    description: '14 günlük seri',
    condition: '14 günlük seriye ulaş',
  },
  {
    id: 'unstoppable',
    name: 'Durdurulamaz',
    description: '30 günlük seri',
    condition: '30 günlük seriye ulaş',
  },
  {
    id: 'century',
    name: 'Efsane',
    description: '100 günlük seri',
    condition: '100 günlük seriye ulaş',
  },
  {
    id: 'hard_worker',
    name: 'Çalışkan',
    description: 'Sert modda 10 alışkanlık tamamla',
    condition: '10 sert mod tamamlaması',
  },
  {
    id: 'pomodoro_addict',
    name: 'Pomodoro Bağımlısı',
    description: 'Toplam 50 pomodoro tamamla',
    condition: '50 pomodoro tamamla',
  },
  {
    id: 'deep_focus',
    name: 'Derin Odak',
    description: 'Toplam 10 saat çalışma süresi',
    condition: '600 dakika çalışma süresine ulaş',
  },
  {
    id: 'night_owl',
    name: 'Gece Kuşu',
    description: 'Gece 22:00\'dan sonra alışkanlık tamamla',
    condition: 'Gece 10\'dan sonra tamamla',
  },
  {
    id: 'early_bird',
    name: 'Erken Kuş',
    description: 'Sabah 07:00\'dan önce alışkanlık tamamla',
    condition: 'Sabah 7\'den önce tamamla',
  },
]

export function checkBadges(profile: UserProfile, logs: DailyLogs): string[] {
  const earned = new Set(profile.badges)
  const allDays = Object.values(logs)
  const allHabitLogs = allDays.flatMap((d) => Object.values(d.habits))

  const totalCompleted = allHabitLogs.filter((h) => h.completed).length
  const totalHardMode = allHabitLogs.filter((h) => h.completed && h.boostUsed).length
  const totalPomodoros = allHabitLogs.reduce((acc, h) => acc + h.pomodoroSessions.length, 0)
  const totalWorkMinutes = allHabitLogs.reduce(
    (acc, h) => acc + h.pomodoroSessions.reduce((s, p) => s + p.workDuration, 0),
    0,
  )

  if (totalCompleted >= 1) earned.add('first_step')
  if (profile.streak >= 7 || profile.longestStreak >= 7) earned.add('on_fire')
  if (profile.streak >= 14 || profile.longestStreak >= 14) earned.add('consistent')
  if (profile.streak >= 30 || profile.longestStreak >= 30) earned.add('unstoppable')
  if (profile.streak >= 100 || profile.longestStreak >= 100) earned.add('century')
  if (totalHardMode >= 10) earned.add('hard_worker')
  if (totalPomodoros >= 50) earned.add('pomodoro_addict')
  if (totalWorkMinutes >= 600) earned.add('deep_focus')

  for (const day of allDays) {
    for (const h of Object.values(day.habits)) {
      if (h.completed && h.completedAt) {
        const hour = new Date(h.completedAt).getHours()
        if (hour >= 22) earned.add('night_owl')
        if (hour < 7) earned.add('early_bird')
      }
    }
  }

  return Array.from(earned)
}
