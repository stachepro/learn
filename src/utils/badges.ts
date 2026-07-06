import type { Badge, DailyLogs, UserProfile } from '../types'
import { storage } from './storage'

/* ════════════════════════════════════════════════════════
   Başarımlar — uygulamanın tüm özelliklerini kapsar:
   alışkanlık/seri, pomodoro, su takibi, uyanma, to-do,
   Acele Yok ve seviye/XP kilometre taşları.

   Yeni kazanılan her rozet için 'luupi-badge' penceresi
   olayı yayınlanır; AchievementToast bunu dinleyip ekranın
   üstünden inen bildirimi gösterir.
   ════════════════════════════════════════════════════════ */

export const ALL_BADGES: Badge[] = [
  /* ── Alışkanlık & seri ── */
  { id: 'first_step', name: 'İlk Adım', emoji: '🌱', description: 'İlk alışkanlığını tamamla', condition: '1 alışkanlık tamamla' },
  { id: 'total_10', name: 'Azimli', emoji: '✅', description: 'Toplam 10 alışkanlık tamamla', condition: '10 tamamlama' },
  { id: 'total_50', name: 'Alışkanlık Ustası', emoji: '🏆', description: 'Toplam 50 alışkanlık tamamla', condition: '50 tamamlama' },
  { id: 'total_250', name: 'Yaşam Tarzı', emoji: '🌟', description: 'Toplam 250 alışkanlık tamamla', condition: '250 tamamlama' },
  { id: 'streak_3', name: 'Isınma Turları', emoji: '⚡', description: '3 günlük seri', condition: '3 günlük seriye ulaş' },
  { id: 'on_fire', name: 'Ateşte', emoji: '🔥', description: '7 günlük seri', condition: '7 günlük seriye ulaş' },
  { id: 'consistent', name: 'Tutarlı', emoji: '📆', description: '14 günlük seri', condition: '14 günlük seriye ulaş' },
  { id: 'unstoppable', name: 'Durdurulamaz', emoji: '🚀', description: '30 günlük seri', condition: '30 günlük seriye ulaş' },
  { id: 'century', name: 'Efsane', emoji: '👑', description: '100 günlük seri', condition: '100 günlük seriye ulaş' },
  { id: 'hard_worker', name: 'Çalışkan', emoji: '💪', description: 'Boost modda 10 alışkanlık tamamla', condition: '10 boost tamamlaması' },
  { id: 'night_owl', name: 'Gece Kuşu', emoji: '🦉', description: "Gece 22:00'dan sonra alışkanlık tamamla", condition: "Gece 10'dan sonra tamamla" },
  { id: 'early_bird', name: 'Erken Kuş', emoji: '🐦', description: "Sabah 07:00'dan önce alışkanlık tamamla", condition: "Sabah 7'den önce tamamla" },

  /* ── Pomodoro & odak ── */
  { id: 'first_pomodoro', name: 'İlk Domates', emoji: '🍅', description: 'İlk pomodoronu tamamla', condition: '1 pomodoro tamamla' },
  { id: 'pomodoro_10', name: 'Odaklanıyor', emoji: '⏱️', description: 'Toplam 10 pomodoro tamamla', condition: '10 pomodoro tamamla' },
  { id: 'pomodoro_addict', name: 'Pomodoro Bağımlısı', emoji: '🔴', description: 'Toplam 50 pomodoro tamamla', condition: '50 pomodoro tamamla' },
  { id: 'pomodoro_200', name: 'Domates Çiftçisi', emoji: '🧑‍🌾', description: 'Toplam 200 pomodoro tamamla', condition: '200 pomodoro tamamla' },
  { id: 'deep_focus', name: 'Derin Odak', emoji: '🧠', description: 'Toplam 10 saat çalışma süresi', condition: '600 dakika çalışmaya ulaş' },
  { id: 'focus_50h', name: 'Odak Canavarı', emoji: '🎯', description: 'Toplam 50 saat çalışma süresi', condition: '3000 dakika çalışmaya ulaş' },

  /* ── Su takibi ── */
  { id: 'water_first', name: 'İlk Yudum', emoji: '💧', description: 'İlk su kaydını ekle', condition: '1 su kaydı ekle' },
  { id: 'water_goal_1', name: 'Hedef Tamam', emoji: '🥤', description: 'Bir gün su hedefini tuttur', condition: '1 gün hedefe ulaş' },
  { id: 'water_goal_7', name: 'Su Haftası', emoji: '🌊', description: '7 gün su hedefini tuttur', condition: '7 gün hedefe ulaş' },
  { id: 'water_goal_30', name: 'Yunus', emoji: '🐬', description: '30 gün su hedefini tuttur', condition: '30 gün hedefe ulaş' },
  { id: 'water_3l_day', name: 'Derin Deniz', emoji: '🤿', description: 'Bir günde 3 litre su iç', condition: 'Tek günde 3L iç' },
  { id: 'water_100l', name: 'Balina', emoji: '🐳', description: 'Toplam 100 litre su iç', condition: 'Toplam 100L suya ulaş' },

  /* ── Uyanma ── */
  { id: 'wake_first', name: 'Günaydın', emoji: '🌅', description: 'İlk uyanma kaydını yap', condition: '1 kez "Uyandım" de' },
  { id: 'wake_7', name: 'Sabahçı', emoji: '☀️', description: '7 gün uyanma kaydı yap', condition: '7 uyanma kaydı' },
  { id: 'wake_30', name: 'Şafak Ustası', emoji: '🌞', description: '30 gün uyanma kaydı yap', condition: '30 uyanma kaydı' },
  { id: 'wake_before_6', name: 'Şafaktan Önce', emoji: '🌄', description: "Sabah 06:00'dan önce uyan", condition: "06:00'dan önce kayıt yap" },
  { id: 'wake_on_goal_5', name: 'Sözünün Eri', emoji: '⏰', description: '5 kez hedef saatinde veya öncesinde uyan', condition: '5 kez hedefi tuttur' },

  /* ── To-do ── */
  { id: 'todo_5', name: 'Listeci', emoji: '📝', description: '5 görevi tamamla', condition: '5 görev işaretle' },
  { id: 'todo_25', name: 'Görev Avcısı', emoji: '🗂️', description: '25 görevi tamamla', condition: '25 görev işaretle' },

  /* ── Acele Yok ── */
  { id: 'norush_first', name: 'Sakin Başlangıç', emoji: '☕', description: 'İlk Acele Yok kaydını bitir', condition: '1 Acele Yok tamamla' },
  { id: 'norush_10', name: 'Sükûnet', emoji: '🧘', description: '10 Acele Yok kaydı bitir', condition: '10 Acele Yok tamamla' },
  { id: 'norush_5h', name: 'Kaplumbağa Bilgeliği', emoji: '🐢', description: "Acele Yok'ta toplam 5 saat geçir", condition: 'Toplam 5 saate ulaş' },

  /* ── Seviye & XP ── */
  { id: 'level_5', name: 'Çaylak Değilsin', emoji: '🎖️', description: "Seviye 5'e ulaş", condition: 'Seviye 5 ol' },
  { id: 'level_10', name: 'Tecrübeli', emoji: '🏅', description: "Seviye 10'a ulaş", condition: 'Seviye 10 ol' },
  { id: 'level_20', name: 'Elmas Disiplin', emoji: '💎', description: "Seviye 20'ye ulaş", condition: 'Seviye 20 ol' },
  { id: 'exp_1000', name: 'Bin Puan', emoji: '⭐', description: 'Toplam 1000 XP topla', condition: '1000 XP kazan' },
  { id: 'exp_5000', name: 'Yıldız Tozu', emoji: '🌠', description: 'Toplam 5000 XP topla', condition: '5000 XP kazan' },
]

export function checkBadges(profile: UserProfile, logs: DailyLogs): string[] {
  const earned = new Set(profile.badges)
  const allDays = Object.values(logs)
  const allHabitLogs = allDays.flatMap((d) => Object.values(d.habits))

  const totalCompleted = allHabitLogs.filter((h) => h.completed).length
  const totalHardMode = allHabitLogs.filter((h) => h.completed && h.boostUsed).length

  const freeSessions = storage.getFreeSessions()
  const totalPomodoros = allHabitLogs.reduce((acc, h) => acc + h.pomodoroSessions.length, 0) + freeSessions.length
  const totalWorkMinutes =
    allHabitLogs.reduce((acc, h) => acc + h.pomodoroSessions.reduce((s, p) => s + p.workDuration, 0), 0) +
    freeSessions.reduce((s, p) => s + p.workDuration, 0)

  /* Alışkanlık & seri */
  if (totalCompleted >= 1) earned.add('first_step')
  if (totalCompleted >= 10) earned.add('total_10')
  if (totalCompleted >= 50) earned.add('total_50')
  if (totalCompleted >= 250) earned.add('total_250')
  const bestStreak = Math.max(profile.streak, profile.longestStreak)
  if (bestStreak >= 3) earned.add('streak_3')
  if (bestStreak >= 7) earned.add('on_fire')
  if (bestStreak >= 14) earned.add('consistent')
  if (bestStreak >= 30) earned.add('unstoppable')
  if (bestStreak >= 100) earned.add('century')
  if (totalHardMode >= 10) earned.add('hard_worker')

  for (const day of allDays) {
    for (const h of Object.values(day.habits)) {
      if (h.completed && h.completedAt) {
        const hour = new Date(h.completedAt).getHours()
        if (hour >= 22) earned.add('night_owl')
        if (hour < 7) earned.add('early_bird')
      }
    }
  }

  /* Pomodoro & odak */
  if (totalPomodoros >= 1) earned.add('first_pomodoro')
  if (totalPomodoros >= 10) earned.add('pomodoro_10')
  if (totalPomodoros >= 50) earned.add('pomodoro_addict')
  if (totalPomodoros >= 200) earned.add('pomodoro_200')
  if (totalWorkMinutes >= 600) earned.add('deep_focus')
  if (totalWorkMinutes >= 3000) earned.add('focus_50h')

  /* Su takibi */
  const water = storage.getWaterEntries()
  if (water.length >= 1) earned.add('water_first')
  if (water.length > 0) {
    const waterGoal = storage.getWaterGoalMl()
    const dayTotals = new Map<string, number>()
    for (const e of water) dayTotals.set(e.date, (dayTotals.get(e.date) ?? 0) + e.ml)
    let goalDays = 0
    let maxDay = 0
    let totalMl = 0
    for (const ml of dayTotals.values()) {
      if (ml >= waterGoal) goalDays++
      if (ml > maxDay) maxDay = ml
      totalMl += ml
    }
    if (goalDays >= 1) earned.add('water_goal_1')
    if (goalDays >= 7) earned.add('water_goal_7')
    if (goalDays >= 30) earned.add('water_goal_30')
    if (maxDay >= 3000) earned.add('water_3l_day')
    if (totalMl >= 100_000) earned.add('water_100l')
  }

  /* Uyanma */
  const wakes = storage.getWakeRecords()
  if (wakes.length >= 1) earned.add('wake_first')
  if (wakes.length >= 7) earned.add('wake_7')
  if (wakes.length >= 30) earned.add('wake_30')
  if (wakes.some((r) => r.time < '06:00')) earned.add('wake_before_6')
  const wakeGoal = storage.getWakeGoal()
  if (wakeGoal && wakes.filter((r) => r.time <= wakeGoal).length >= 5) earned.add('wake_on_goal_5')

  /* To-do */
  const todosDone = storage.getTodos().filter((t) => t.done).length
  if (todosDone >= 5) earned.add('todo_5')
  if (todosDone >= 25) earned.add('todo_25')

  /* Acele Yok */
  const noRush = storage.getNoRushHistory()
  if (noRush.length >= 1) earned.add('norush_first')
  if (noRush.length >= 10) earned.add('norush_10')
  if (noRush.reduce((s, r) => s + r.totalSeconds, 0) >= 5 * 3600) earned.add('norush_5h')

  /* Seviye & XP */
  if (profile.level >= 5) earned.add('level_5')
  if (profile.level >= 10) earned.add('level_10')
  if (profile.level >= 20) earned.add('level_20')
  if (profile.totalExp >= 1000) earned.add('exp_1000')
  if (profile.totalExp >= 5000) earned.add('exp_5000')

  return Array.from(earned)
}

/* Eski listeye göre yeni kazanılan rozetleri bildirim olarak duyurur */
export function announceNewBadges(oldBadges: string[], newBadges: string[]): void {
  for (const id of newBadges) {
    if (!oldBadges.includes(id)) {
      window.dispatchEvent(new CustomEvent('luupi-badge', { detail: id }))
    }
  }
}

/* AppContext dışındaki sayfalardan (su, uyanma, to-do, Acele Yok) veri
   yazıldıktan hemen sonra çağrılır: rozetleri yeniden hesaplar, kalıcılaştırır
   ve yeni kazanılanları duyurur. */
export function awardStandaloneBadges(): void {
  const profile = storage.getUserProfile()
  const earned = checkBadges(profile, storage.getDailyLogs())
  const fresh = earned.filter((id) => !profile.badges.includes(id))
  if (fresh.length === 0) return
  storage.setUserProfile({ ...profile, badges: earned })
  announceNewBadges(profile.badges, earned)
}
