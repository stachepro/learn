import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as CapApp } from '@capacitor/app'
import './index.css'
import './styles/design-system.css'
import App from './App.tsx'
import { hydrateNativeStorage, isNative } from './utils/nativeStorage'
import { lockPortrait } from './utils/focusMode'
import { installGlobalErrorHandlers, captureError } from './utils/errorReporting'
import { runMigrations } from './utils/storage'
import { initTheme, applyTheme } from './utils/theme'

installGlobalErrorHandlers()
initTheme()

if (isNative) {
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else CapApp.exitApp()
  })
  // Uygulama normalde hep dikey; yatay sadece Pomodoro odak modunda açılır
  void lockPortrait()
}

hydrateNativeStorage().finally(() => {
  // Hidrasyondan sonra: native taraftan geri yüklenen veri de damgalanmalı.
  // Render'dan önce: bileşenler her zaman güncel biçimi okur.
  // Geçiş çökerse uygulama yine de açılsın; hata kaydedilir.
  try { runMigrations() } catch (err) { captureError(err, 'manual') }
  // Native'de tema tercihi Preferences'tan localStorage'a hidrasyonla gelir;
  // hidrasyon sonrası yeniden uygula ki kayıtlı tema render'da doğru olsun.
  applyTheme()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
