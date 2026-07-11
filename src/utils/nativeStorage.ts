import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

export const isNative = Capacitor.isNativePlatform()

// iOS/Android WebView localStorage'ı disk baskısında silebilir;
// native platformlarda veriler Capacitor Preferences'a yansıtılır
// ve açılışta localStorage'a geri yüklenir.
export async function hydrateNativeStorage(): Promise<void> {
  if (!isNative) return
  const { keys } = await Preferences.keys()
  for (const key of keys) {
    if (!key.startsWith('luupi_')) continue
    const { value } = await Preferences.get({ key })
    if (value != null) {
      try { localStorage.setItem(key, value) } catch { /* ignore */ }
    }
  }
}

export function persistNative(key: string, value: string): void {
  if (!isNative) return
  void Preferences.set({ key, value })
}

export function removeNative(key: string): void {
  if (!isNative) return
  void Preferences.remove({ key })
}
