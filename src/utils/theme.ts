// Uygulama teması. 'system' cihaz tercihini izler; 'light'/'dark' sabittir.
// Seçim localStorage'da tutulur ve <html data-theme="..."> olarak uygulanır.
// theme.ts hiçbir modüle bağımlı değil (storage'a da) — böylece render'dan önce,
// döngüsel import riski olmadan main.tsx içinde güvenle çağrılabilir.
import { persistNative } from './nativeStorage'

export const THEME_KEY = 'luupi_theme'

export type ThemePref = 'light' | 'dark' | 'system'

export function getThemePref(): ThemePref {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    return raw === 'dark' || raw === 'light' || raw === 'system' ? raw : 'system'
  } catch { return 'system' }
}

function systemPrefersDark(): boolean {
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches } catch { return false }
}

// Tercihi gerçek 'light'/'dark' değerine çözer (system → cihaz tercihi).
export function resolveTheme(pref: ThemePref = getThemePref()): 'light' | 'dark' {
  return pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref
}

// Çözülen temayı kök öğeye uygular.
export function applyTheme(pref: ThemePref = getThemePref()): void {
  document.documentElement.setAttribute('data-theme', resolveTheme(pref))
}

// Tercihi kaydeder ve hemen uygular.
export function setThemePref(pref: ThemePref): void {
  try { localStorage.setItem(THEME_KEY, pref) } catch { /* ignore */ }
  persistNative(THEME_KEY, pref)
  applyTheme(pref)
}

// Açılışta bir kez çağrılır: kayıtlı tercihi uygular ve 'system' seçiliyken
// cihaz teması değişirse canlı olarak güncellenmesi için dinleyici kurar.
export function initTheme(): void {
  applyTheme()
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getThemePref() === 'system') applyTheme('system')
    })
  } catch { /* ignore */ }
}
