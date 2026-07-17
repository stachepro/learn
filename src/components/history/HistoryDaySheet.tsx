import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import type { Category } from '../../types'
import { formatMinutes } from '../../utils/date'
import type { HistoryDayRecord, HistoryHabitStatus } from '../../utils/history'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import { formatWaterAmount } from '../../utils/water'
import AppButton from '../ui/AppButton'
import LuupiIcon from '../ui/LuupiIcon'
import type { IconName } from '../../utils/icons'

const STATUS_COPY: Record<HistoryHabitStatus, { label: string; mark: string }> = {
  completed: { label: 'Tamamlandı', mark: '✓' },
  'explicit-skip': { label: 'Bilinçli atlandı', mark: '×' },
  missed: { label: 'Kaçırıldı', mark: '／' },
  pending: { label: 'Karar bekliyor', mark: '•' },
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`))
}

function formatDecisionTime(value?: string): string | null {
  if (!value) return null
  return new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export default function HistoryDaySheet({
  record,
  categories,
  onClose,
}: {
  record: HistoryDayRecord
  categories: Category[]
  onClose: () => void
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(frame)
      previous?.focus()
    }
  }, [])

  const toolRows = [
    record.sessions.length ? { icon: 'timer' as const, title: 'Pomodoro', value: `${record.sessions.length} seans · ${formatMinutes(record.focusMinutes)}` } : null,
    record.justStartCount ? { icon: 'bolt' as const, title: 'Just Start', value: `${record.justStartCount} yolculuk` } : null,
    record.todos.length ? { icon: 'list-check' as const, title: 'To-do', value: `${record.todos.length} görev · ${record.todos.map((todo) => todo.text).join(', ')}` } : null,
    record.noRush.length ? { icon: 'coffee' as const, title: 'Acele Yok', value: `${record.noRush.length} akış · ${record.noRush.map((item) => item.title).join(', ')}` } : null,
  ].filter(Boolean) as { icon: IconName; title: string; value: string }[]

  return createPortal(
    <div
      className="history-day-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-day-title"
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
      <button type="button" className="history-day__scrim" onClick={close} aria-label="Kapat" />
      <section style={sheetDrag.surfaceStyle} className={`history-day-sheet history-day-sheet--${record.tone} ${sheetDrag.surfaceClassName} ${isExiting ? 'history-day-sheet--exit' : 'history-day-sheet--enter'}`}>
        <span className="history-day-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="history-day-sheet__header">
          <div><span>GÜN ARŞİVİ</span><h2 id="history-day-title">{formatDate(record.date)}</h2></div>
          <AppButton ref={closeRef} tone="quiet" size="sm" haptic="light" onClick={close} aria-label="Kapat">×</AppButton>
        </header>

        <div className="history-day-sheet__scroll">
          <section className="history-day-score">
            <div><span><LuupiIcon name={record.score.icon} size={32} /></span><strong>{record.score.score?.toLocaleString('tr-TR') ?? '—'}</strong><small>/10</small></div>
            <div><span>GÜNÜN RİTMİ</span><h3>{record.score.label}</h3><p>{record.completed} tamamlandı · {record.explicitSkipped + record.missed} atlandı/kaçırıldı</p></div>
          </section>

          {record.habits.length > 0 && (
            <section className="history-day-section">
              <header><span>HABİT KARARLARI</span><strong>{record.habits.length} planlı kayıt</strong></header>
              <div className="history-day-habits">
                {record.habits.map((entry) => {
                  const status = STATUS_COPY[entry.status]
                  const category = categories.find((item) => item.id === entry.categoryId)
                  const decisionTime = formatDecisionTime(entry.log.completedAt ?? entry.log.skippedAt)
                  const focusMinutes = entry.log.pomodoroSessions.reduce((sum, session) => sum + session.workDuration, 0)
                  return (
                    <article key={entry.habitId} className={`history-day-habit history-day-habit--${entry.status}`}>
                      <span className="history-day-habit__emoji"><LuupiIcon name={entry.icon} /></span>
                      <div>
                        <strong>{entry.name}</strong>
                        <small>{category && <LuupiIcon name={category.icon} size={14} />} {category?.name ?? (entry.archived ? 'Arşivlenmiş kayıt' : 'Alışkanlık')}</small>
                        {(entry.log.notes || entry.log.pomodoroSessions.length > 0 || (entry.log.completionCount ?? 0) > 0) && (
                          <p>
                            {(entry.log.completionCount ?? 0) > 0 && `${entry.log.completionCount} tekrar`}
                            {(entry.log.completionCount ?? 0) > 0 && entry.log.pomodoroSessions.length > 0 && ' · '}
                            {entry.log.pomodoroSessions.length > 0 && `${entry.log.pomodoroSessions.length} odak · ${formatMinutes(focusMinutes)}`}
                            {entry.log.notes && <em>“{entry.log.notes}”</em>}
                          </p>
                        )}
                      </div>
                      <div className="history-day-habit__status"><i>{status.mark}</i><span>{status.label}</span>{decisionTime && <time>{decisionTime}</time>}</div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {(record.water || record.wake) && (
            <section className="history-day-section">
              <header><span>GÜNLÜK HEDEFLER</span><strong>Beden ritmi</strong></header>
              <div className="history-day-goals">
                {record.water && <article><span><LuupiIcon name="water" size={18} /> Su</span><strong>{formatWaterAmount(record.water.actual)}</strong><small>Hedef {formatWaterAmount(record.water.goal)}</small></article>}
                {record.wake && <article><span><LuupiIcon name="sunrise" size={18} /> Uyanma</span><strong>{record.wake.actualTime}</strong><small>{record.wake.goal ? `Hedef ${record.wake.goal}` : 'Hedef kaydı yok'}</small></article>}
              </div>
            </section>
          )}

          {toolRows.length > 0 && (
            <section className="history-day-section">
              <header><span>ARAÇ SONUÇLARI</span><strong>{record.activeToolCount} araç</strong></header>
              <div className="history-day-tools">
                {toolRows.map((tool) => <article key={tool.title}><span><LuupiIcon name={tool.icon} /></span><div><strong>{tool.title}</strong><small>{tool.value}</small></div></article>)}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>,
    document.body,
  )
}
