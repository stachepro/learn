import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import type { Habit, HabitLog } from '../../types'
import type { HabitHistoryDay, HabitHistoryStatus } from '../../utils/habitHistory'
import { migrateHabitLog } from '../../utils/habitLog'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import AppButton from '../ui/AppButton'
import LuupiIcon from '../ui/LuupiIcon'

const STATUS_COPY: Record<HabitHistoryStatus, { label: string; detail: string }> = {
  completed: { label: 'Tamamlandı', detail: 'Hedef o gün başarıyla tamamlandı.' },
  'explicit-skip': { label: 'Atlandı', detail: 'O gün bilinçli olarak atlandı.' },
  missed: { label: 'Kaçırıldı', detail: 'Planlanan hedef gün kapanmadan tamamlanmadı.' },
  pending: { label: 'Bugün bekliyor', detail: 'Bugünkü hedef henüz karara bağlanmadı.' },
  off: { label: 'Plan dışı', detail: 'Bu alışkanlık o gün için planlanmamıştı.' },
  future: { label: 'Gelecek gün', detail: 'Bu gün henüz gelmedi.' },
  'before-created': { label: 'Henüz yoktu', detail: 'Alışkanlık bu tarihte henüz oluşturulmamıştı.' },
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`))
}

function formatTime(value?: string): string | null {
  if (!value) return null
  return new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export default function HabitDayDetailSheet({
  habit,
  day,
  rawLog,
  onClose,
}: {
  habit: Habit
  day: HabitHistoryDay
  rawLog?: HabitLog
  onClose: () => void
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const closeRef = useRef<HTMLButtonElement>(null)
  const log = rawLog ? migrateHabitLog(rawLog) : null
  const status = STATUS_COPY[day.status]
  const decisionTime = formatTime(log?.completedAt ?? log?.skippedAt)
  const focusSessions = log?.pomodoroSessions.length ?? 0
  const focusMinutes = log?.pomodoroSessions.reduce((total, session) => total + session.workDuration, 0) ?? 0

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(frame)
      previous?.focus()
    }
  }, [])

  return createPortal(
    <div
      className="habit-day-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-day-sheet-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'))
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
      <button type="button" className={`habit-day-sheet__scrim ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={close} aria-label="Kapat" />
      <section style={sheetDrag.surfaceStyle} className={`habit-day-sheet__panel habit-day-sheet__panel--${day.status} ${sheetDrag.surfaceClassName} ${isExiting ? 'habit-day-sheet__panel--exit' : 'habit-day-sheet__panel--enter'}`}>
        <span className="habit-day-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="habit-day-sheet__header">
          <div>
            <span>{formatDate(day.date)}</span>
            <h2 id="habit-day-sheet-title"><LuupiIcon name={habit.icon} size={24} /> {habit.name}</h2>
          </div>
          <AppButton ref={closeRef} tone="quiet" size="sm" haptic="light" className="habit-day-sheet__close" onClick={close} aria-label="Kapat">×</AppButton>
        </header>

        <div className="habit-day-sheet__status">
          <span className={`habit-day-sheet__status-mark habit-day-sheet__status-mark--${day.status}`} aria-hidden />
          <div>
            <strong>{status.label}</strong>
            <p>{status.detail}</p>
          </div>
          {decisionTime && <time>{decisionTime}</time>}
        </div>

        {(log?.notes || focusSessions > 0 || (log?.completionCount ?? 0) > 0) && (
          <div className="habit-day-sheet__facts">
            {(log?.completionCount ?? 0) > 0 && (
              <div><span>Tekrar</span><strong>{log?.completionCount}</strong></div>
            )}
            {focusSessions > 0 && (
              <div><span>Odak</span><strong>{focusSessions} seans · {focusMinutes} dk</strong></div>
            )}
            {log?.notes && (
              <div className="habit-day-sheet__note"><span>Not</span><p>“{log.notes}”</p></div>
            )}
          </div>
        )}
      </section>
    </div>,
    document.body,
  )
}
