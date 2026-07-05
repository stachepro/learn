import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

// Sayaç arka plandayken/uygulama kapalıyken bitince kullanıcıyı uyarır.
// Web'de sessizce devre dışı.
const isNative = Capacitor.isNativePlatform()

export const NOTIF_POMODORO = 1
export const NOTIF_JUSTSTART = 2

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

export function scheduleTimerNotification(id: number, atMs: number, title: string, body: string): void {
  if (!isNative || atMs <= Date.now()) return
  void (async () => {
    if (!(await ensurePermission())) return
    try {
      await LocalNotifications.schedule({
        notifications: [{ id, title, body, schedule: { at: new Date(atMs) }, sound: 'default' }],
      })
    } catch { /* ignore */ }
  })()
}

export function cancelTimerNotification(id: number): void {
  if (!isNative) return
  void LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => { /* ignore */ })
}
