import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type Weekday } from '@capacitor/local-notifications'
import type { Habit } from '../types'
import { storage } from './storage'
import { getDayEndHour } from './date'

// Ayarlar sayfası için: mevcut bildirim izni durumu ve izin isteme.
export type NotifPermission = 'granted' | 'denied' | 'prompt' | 'unavailable'

export async function getNotificationStatus(): Promise<NotifPermission> {
  if (!isNative) return 'unavailable'
  try {
    const status = await LocalNotifications.checkPermissions()
    if (status.display === 'granted') return 'granted'
    if (status.display === 'denied') return 'denied'
    return 'prompt'
  } catch { return 'unavailable' }
}

export async function requestNotificationPermission(): Promise<boolean> {
  return ensurePermission()
}

export function openNotificationSettings(): boolean {
  if (!isNative || Capacitor.getPlatform() !== 'ios') return false
  try {
    window.location.href = 'app-settings:'
    return true
  } catch { return false }
}

export async function cancelAllPendingNotifications(): Promise<void> {
  if (!isNative) return
  try {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) })
    }
  } catch { /* reset must continue even when notification cleanup fails */ }
}

// Alışkanlık hatırlatmaları ve "Uyandım" hedef saati için gerçek mobil bildirimler.
// Web'de sessizce devre dışı (timerNotifications.ts ile aynı desen).
const isNative = Capacitor.isNativePlatform()

let permissionAsked = false
async function ensurePermission(): Promise<boolean> {
  if (!isNative) return false
  try {
    const status = await LocalNotifications.checkPermissions()
    if (status.display === 'granted') return true
    if (permissionAsked) return false
    permissionAsked = true
    const req = await LocalNotifications.requestPermissions()
    return req.display === 'granted'
  } catch { return false }
}

function hash32(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Habit bildirim id'leri: hash(habitId)*10 + slot
// slot 0-6 = haftanın günü (Pazar=0…Cumartesi=6), 7 = her gün, 8 = tek seferlik
const HABIT_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

function habitNotifId(habitId: string, slot: number): number {
  return (hash32(habitId) % 1_000_000) * 10 + slot
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  if (!isNative) return
  const notifications = HABIT_SLOTS.map((slot) => ({ id: habitNotifId(habitId, slot) }))
  await LocalNotifications.cancel({ notifications }).catch(() => { /* ignore */ })
}

export async function scheduleHabitReminder(habit: Habit): Promise<void> {
  await cancelHabitReminder(habit.id)
  const start = habit.timeWindow?.start
  if (!isNative || !start) return

  const [hourStr, minuteStr] = start.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return
  if (!(await ensurePermission())) return

  const title = habit.name
  const body = 'Hatırlatma: bu alışkanlığı tamamlamayı unutma!'

  try {
    if (habit.recurrence === 'custom' && habit.recurrenceDays?.length) {
      await LocalNotifications.schedule({
        notifications: habit.recurrenceDays.map((day) => ({
          id: habitNotifId(habit.id, day),
          title, body,
          schedule: { on: { weekday: (day + 1) as Weekday, hour, minute }, allowWhileIdle: true },
          sound: 'default',
        })),
      })
    } else if (habit.recurrence === 'weekly' && (habit.recurrenceDays?.length || habit.createdDate)) {
      const weekday = habit.recurrenceDays?.[0] ?? new Date(`${habit.createdDate}T00:00:00`).getDay()
      await LocalNotifications.schedule({
        notifications: [{
          id: habitNotifId(habit.id, weekday),
          title, body,
          schedule: { on: { weekday: (weekday + 1) as Weekday, hour, minute }, allowWhileIdle: true },
          sound: 'default',
        }],
      })
    } else if (habit.recurrence === 'once' && habit.createdDate) {
      const at = new Date(`${habit.createdDate}T${start}:00`)
      if (at.getTime() > Date.now()) {
        await LocalNotifications.schedule({
          notifications: [{ id: habitNotifId(habit.id, 8), title, body, schedule: { at }, sound: 'default' }],
        })
      }
    } else {
      await LocalNotifications.schedule({
        notifications: [{
          id: habitNotifId(habit.id, 7),
          title, body,
          schedule: { on: { hour, minute }, allowWhileIdle: true },
          sound: 'default',
        }],
      })
    }
  } catch { /* ignore */ }
}

export function syncHabitReminders(habits: Habit[]): void {
  if (!isNative) return
  for (const habit of habits) void scheduleHabitReminder(habit)
}

// "Uyandım" hedef saati bildirimi
const NOTIF_WAKE_GOAL = 20_000_001

export async function scheduleWakeGoalReminder(time: string | null): Promise<void> {
  if (!isNative) return
  await LocalNotifications.cancel({ notifications: [{ id: NOTIF_WAKE_GOAL }] }).catch(() => { /* ignore */ })
  if (!time) return

  const [hourStr, minuteStr] = time.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return
  if (!(await ensurePermission())) return

  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIF_WAKE_GOAL,
        title: 'Uyanma vakti',
        body: `Hedef saatin ${time}. Uyandıysan işaretlemeyi unutma!`,
        schedule: { on: { hour, minute }, allowWhileIdle: true },
        sound: 'default',
      }],
    })
  } catch { /* ignore */ }
}

// Her gece 00:00'da tekrarlayan "günün özeti hazır" bildirimi. `on` takvimi
// Capacitor'da kendiliğinden tekrarlar; bir kez kurulur, açılışta tazelenir.
// extra.route: bildirime dokununca NotificationRouter bu sayfaya götürür.
const NOTIF_DAILY_SUMMARY = 20_000_003

export async function scheduleDailySummaryNotification(): Promise<void> {
  if (!isNative) return
  await LocalNotifications.cancel({ notifications: [{ id: NOTIF_DAILY_SUMMARY }] }).catch(() => { /* ignore */ })
  if (!storage.getNotifPrefs().dailySummary) return
  if (!(await ensurePermission())) return

  // Gün, kullanıcının seçtiği bitiş saatinde döner; özet bildirimi de o an gelir.
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIF_DAILY_SUMMARY,
        title: 'Günün özeti hazır',
        body: 'Bugünün hikayesi seni bekliyor — izlemek için dokun.',
        schedule: { on: { hour: getDayEndHour(), minute: 0 }, allowWhileIdle: true },
        sound: 'default',
        extra: { route: '/ozet' },
      }],
    })
  } catch { /* ignore */ }
}

// Gün bitmeden streak uyarısı: o gün hiç alışkanlık tamamlanmadıysa akşam saatinde
// tek seferlik bildirim gönderilir; tamamlanınca o günkü bildirim iptal edilir.
const NOTIF_STREAK_RISK = 20_000_002
const STREAK_RISK_HOUR = 21

export async function scheduleStreakRiskReminder(hasCompletedToday: boolean): Promise<void> {
  if (!isNative) return
  await LocalNotifications.cancel({ notifications: [{ id: NOTIF_STREAK_RISK }] }).catch(() => { /* ignore */ })
  if (hasCompletedToday) return
  if (!storage.getNotifPrefs().streakRisk) return

  const now = new Date()
  const at = new Date(now)
  at.setHours(STREAK_RISK_HOUR, 0, 0, 0)
  if (at.getTime() <= now.getTime()) return
  if (!(await ensurePermission())) return

  try {
    const dayEndHour = getDayEndHour()
    const deadline = dayEndHour === 0 ? 'gece yarısına' : `${String(dayEndHour).padStart(2, '0')}:00'a`
    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIF_STREAK_RISK,
        title: 'Streak tehlikede!',
        body: `Bugün henüz bir alışkanlık tamamlamadın. ${deadline} kadar bir tanesini bitirmezsen streak'in sıfırlanacak.`,
        schedule: { at },
        sound: 'default',
      }],
    })
  } catch { /* ignore */ }
}
