import { Capacitor } from '@capacitor/core'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { StatusBar } from '@capacitor/status-bar'

const isNative = Capacitor.isNativePlatform()

// ── Ekranı uyanık tut (masa saati modu) ──
// Wake lock sekme arka plana geçince otomatik düşer; görünür olunca
// tekrar alınır. wantWakeLock bayrağı "hâlâ odak modundayız" demek.
let wakeLock: WakeLockSentinel | null = null
let wantWakeLock = false

async function acquireWakeLock() {
  if (!wantWakeLock || document.hidden) return
  try {
    wakeLock = (await navigator.wakeLock?.request('screen')) ?? null
  } catch {
    wakeLock = null
  }
}

function onVisibilityChange() {
  if (!document.hidden) void acquireWakeLock()
}

/** Odak moduna gir: ekran uyanık, durum çubuğu gizli, rotasyon serbest. */
export async function enterFocusNative() {
  wantWakeLock = true
  document.addEventListener('visibilitychange', onVisibilityChange)
  void acquireWakeLock()
  if (!isNative) return
  try { await StatusBar.hide() } catch { /* platform desteklemiyor */ }
  try { await ScreenOrientation.unlock() } catch { /* platform desteklemiyor */ }
}

/** Odak modundan çık: wake lock bırak, durum çubuğu geri, dikey kilit geri. */
export async function exitFocusNative() {
  wantWakeLock = false
  document.removeEventListener('visibilitychange', onVisibilityChange)
  try { await wakeLock?.release() } catch { /* zaten düşmüş */ }
  wakeLock = null
  if (!isNative) return
  try { await StatusBar.show() } catch { /* platform desteklemiyor */ }
  try { await ScreenOrientation.lock({ orientation: 'portrait' }) } catch { /* platform desteklemiyor */ }
}

/** Uygulama açılışında dikey kilit. iOS Info.plist artık yataya izin
 *  veriyor (odak modu için); normal kullanımda kilit runtime'da kurulur. */
export async function lockPortrait() {
  if (!isNative) return
  try { await ScreenOrientation.lock({ orientation: 'portrait' }) } catch { /* platform desteklemiyor */ }
}
