import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PomodoroSettings } from '../../types'
import { scheduleAfterMotion } from '../../utils/motion'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import { showToast } from '../../utils/toast'
import AppButton from '../ui/AppButton'

function SheetShell({ title, subtitle, onClose, children }: {
  title: string
  subtitle: string
  onClose: () => void
  children: (close: () => void) => React.ReactNode
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      cancelAnimationFrame(frame)
      previous?.focus()
    }
  }, [])

  return createPortal(
    <div
      className="pomodoro-sheet-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pomodoro-sheet-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]') ?? [])
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <button type="button" className={`pomodoro-sheet__scrim ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={close} aria-label="Kapat" />
      <section ref={panelRef} style={sheetDrag.surfaceStyle} className={`pomodoro-sheet ${sheetDrag.surfaceClassName} ${isExiting ? 'pomodoro-sheet--exit' : 'pomodoro-sheet--enter'}`}>
        <span className="pomodoro-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="pomodoro-sheet__header">
          <div>
            <h2 id="pomodoro-sheet-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button ref={closeRef} type="button" className="app-icon-button" onClick={close} aria-label="Kapat">×</button>
        </header>
        <div className="pomodoro-sheet__content">{children(close)}</div>
      </section>
    </div>,
    document.body,
  )
}

export function PomodoroSettingsSheet({ settings, onClose, onSave }: {
  settings: PomodoroSettings
  onClose: () => void
  onSave: (settings: PomodoroSettings) => void
}) {
  const [workDuration, setWorkDuration] = useState(settings.workDuration)
  const [breakDuration, setBreakDuration] = useState(settings.breakDuration)
  const [autoLoop, setAutoLoop] = useState(settings.autoLoop ?? false)

  const save = (close: () => void) => {
    onSave({ workDuration, breakDuration, autoLoop })
    showToast({ tone: 'success', title: 'Pomodoro ayarları güncellendi', message: `${workDuration} dk odak · ${breakDuration} dk mola` })
    close()
  }

  return (
    <SheetShell title="Oturum ritmi" subtitle="Değişiklikler bir sonraki turda uygulanır." onClose={onClose}>{(close) => (
      <div className="pomodoro-setting-stack">
        <label className="pomodoro-range">
          <span><b>Odak süresi</b><strong>{workDuration} dk</strong></span>
          <input type="range" min="5" max="90" step="5" value={workDuration} onChange={(event) => setWorkDuration(Number(event.target.value))} />
        </label>
        <label className="pomodoro-range">
          <span><b>Mola süresi</b><strong>{breakDuration} dk</strong></span>
          <input type="range" min="1" max="30" step="1" value={breakDuration} onChange={(event) => setBreakDuration(Number(event.target.value))} />
        </label>
        <button type="button" className="pomodoro-auto-loop" role="switch" aria-checked={autoLoop} onClick={() => setAutoLoop((value) => !value)}>
          <span><b>Otomatik döngü</b><small>Odak ve mola turları kendiliğinden başlar.</small></span>
          <i className={autoLoop ? 'is-on' : ''} aria-hidden><span /></i>
        </button>
        <AppButton tone="primary" size="lg" block onClick={() => save(close)}>Ritmi Kaydet</AppButton>
      </div>
    )}</SheetShell>
  )
}

export function PomodoroStopSheet({ elapsedLabel, onClose, onConfirm }: {
  elapsedLabel: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <SheetShell title="Seans sonlandırılsın mı?" subtitle={`${elapsedLabel} odak henüz tamamlanmadı.`} onClose={onClose}>{(close) => (
      <>
      <div className="pomodoro-stop-copy">
        <span aria-hidden>■</span>
        <p>Bu turun ilerlemesi ve ödülü kaydedilmeyecek. Daha sonra yeni bir seans başlatabilirsin.</p>
      </div>
      <div className="pomodoro-sheet__actions">
        <AppButton tone="secondary" size="lg" block onClick={close}>Odakta Kal</AppButton>
        <AppButton tone="destructive" size="lg" block onClick={() => { close(); scheduleAfterMotion(onConfirm) }}>Seansı Sonlandır</AppButton>
      </div>
      </>
    )}</SheetShell>
  )
}
