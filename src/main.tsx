import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as CapApp } from '@capacitor/app'
import './index.css'
import App from './App.tsx'
import { hydrateNativeStorage, isNative } from './utils/nativeStorage'
import { lockPortrait } from './utils/focusMode'

if (isNative) {
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else CapApp.exitApp()
  })
  // Uygulama normalde hep dikey; yatay sadece Pomodoro odak modunda açılır
  void lockPortrait()
}

hydrateNativeStorage().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
