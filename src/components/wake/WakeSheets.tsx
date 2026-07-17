import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { WakeRecord } from '../../types'
import { addDaysStr, formatShortDate } from '../../utils/date'
import { useLongPressGesture } from '../../utils/useLongPressGesture'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import {
  averageWakeTime,
  earliestWakeTime,
  formatWakeDifference,
  isWakeOnGoal,
  wakeGoalDifference,
  wakeGoalForRecord,
  wakeGoalRate,
} from '../../utils/wake'
import AppButton from '../ui/AppButton'
import ManagementSheet, { ConfirmActionSheet } from '../ui/ManagementSheet'
import LuupiIcon from '../ui/LuupiIcon'

function useSheetFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('button, input')?.focus())
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !ref.current) return
      const nodes = Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]'))
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', trap); previous?.focus() }
  }, [])
  return ref
}

function WakeSheet({ title, eyebrow, icon, onClose, children, className = '' }: {
  title: string
  eyebrow: string
  icon: ReactNode
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const ref = useSheetFocus<HTMLElement>()
  const id = `wake-sheet-${title.replaceAll(' ', '-').toLocaleLowerCase('tr-TR')}`
  return createPortal(
    <div className="wake-sheet-layer" role="dialog" aria-modal="true" aria-labelledby={id}>
      <button type="button" className="wake-sheet__scrim" onClick={close} aria-label="Kapat" />
      <section ref={ref} style={sheetDrag.surfaceStyle} className={`wake-sheet ${className} ${sheetDrag.surfaceClassName} ${isExiting ? 'wake-sheet--exit' : 'wake-sheet--enter'}`}>
        <span className="wake-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="wake-sheet__header">
          <span className="wake-sheet__glyph" aria-hidden>{icon}</span>
          <div><span>{eyebrow}</span><h2 id={id}>{title}</h2></div>
          <button type="button" className="wake-sheet__close" onClick={close} aria-label="Kapat">×</button>
        </header>
        {children}
      </section>
    </div>, document.body,
  )
}

const GOAL_PRESETS = ['06:30', '07:00', '07:30', '08:00']

export function WakeGoalSheet({ goal, onClose, onSave }: { goal: string | null; onClose: () => void; onSave: (goal: string) => void }) {
  const [value, setValue] = useState(goal ?? '07:00')
  return (
    <WakeSheet title="Hedef uyanma saati" eyebrow="SABAH NİYETİ" icon="◎" onClose={onClose}>
      <label className="wake-time-picker"><span>HER GÜN</span><input type="time" value={value} onChange={(event) => setValue(event.target.value)} /></label>
      <div className="wake-goal-presets">{GOAL_PRESETS.map((time) => <button type="button" key={time} className={value === time ? 'is-active' : ''} onClick={() => setValue(time)}>{time}</button>)}</div>
      <p className="wake-sheet__hint">Hedef değişikliği yeni kayıtları etkiler; geçmiş sonuçların aynı kalır.</p>
      <AppButton tone="primary" size="lg" block haptic="none" onClick={() => onSave(value)}>Hedefi Kaydet</AppButton>
    </WakeSheet>
  )
}

function WakeHistoryRow({ record, currentGoal, onManage }: { record: WakeRecord; currentGoal: string | null; onManage: () => void }) {
  const longPress = useLongPressGesture({ onLongPress: onManage })
  const goal = wakeGoalForRecord(record, currentGoal)
  const difference = goal ? wakeGoalDifference(record.time, goal) : null
  return (
    <button
      type="button"
      className={`wake-history-row long-press-surface ${longPress.isPressing ? 'wake-history-row--pressing' : ''}`}
      data-long-pressing={longPress.isPressing}
      onPointerDown={longPress.start}
      onPointerMove={longPress.move}
      onPointerUp={longPress.end}
      onPointerCancel={longPress.cancel}
      onLostPointerCapture={longPress.lostCapture}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') longPress.cancel() }}
      onContextMenu={(event) => { event.preventDefault(); longPress.trigger(false) }}
      onClick={(event) => { if (event.detail === 0) longPress.trigger(false) }}
      onKeyDown={(event) => { if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') { event.preventDefault(); longPress.trigger(false) } }}
      aria-haspopup="dialog"
      aria-keyshortcuts="Shift+F10"
      aria-label={`${formatShortDate(new Date(`${record.date}T12:00:00`))}, ${record.time}. Yönetmek için basılı tut.`}
    >
      <span className="long-press-progress" aria-hidden />
              <span className={isWakeOnGoal(record, currentGoal) === true ? 'is-on-goal' : ''} aria-hidden>{isWakeOnGoal(record, currentGoal) === true ? '✓' : <LuupiIcon name="sunrise" size={18} />}</span>
      <div><strong>{formatShortDate(new Date(`${record.date}T12:00:00`))}</strong><small>{difference === null ? 'Hedefsiz kayıt' : formatWakeDifference(difference)}</small></div>
      <b>{record.time}</b>
    </button>
  )
}

export function WakeInsightsSheet({ records, today, goal, onClose, onManage, onReset }: {
  records: WakeRecord[]
  today: string
  goal: string | null
  onClose: () => void
  onManage: (record: WakeRecord) => void
  onReset: () => void
}) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))
  const last30Dates = Array.from({ length: 30 }, (_, index) => addDaysStr(today, index - 29))
  const byDate = new Map(records.map((record) => [record.date, record]))
  const average = averageWakeTime(records)
  const rate = wakeGoalRate(records, goal)
  return (
    <WakeSheet title="Sabah içgörüleri" eyebrow="RİTMİNİN BÜYÜK RESMİ" icon={<LuupiIcon name="chart-line" />} onClose={onClose} className="wake-insights-sheet">
      <div className="wake-insights__metrics">
        <div><span>ORTALAMA</span><strong>{average ?? '—'}</strong></div>
        <div><span>HEDEF ORANI</span><strong>{rate === null ? '—' : `%${rate}`}</strong></div>
        <div><span>EN ERKEN</span><strong>{earliestWakeTime(records) ?? '—'}</strong></div>
      </div>

      <section className="wake-insights__rhythm" aria-labelledby="wake-month-title">
        <header><div><span>SON 30 GÜN</span><h3 id="wake-month-title">Sabah haritan</h3></div><small>{last30Dates.filter((date) => byDate.has(date)).length} kayıt</small></header>
        <div>{last30Dates.map((date) => {
          const record = byDate.get(date)
          const onGoal = record ? isWakeOnGoal(record, goal) : null
          return <span key={date} className={record ? onGoal === true ? 'is-on-goal' : 'is-recorded' : ''} title={`${formatShortDate(new Date(`${date}T12:00:00`))}: ${record?.time ?? 'Kayıt yok'}`}><b>{Number(date.slice(8))}</b>{record && <i>{onGoal === true ? '✓' : '●'}</i>}</span>
        })}</div>
        <footer><span><i className="is-on-goal" /> Hedefte</span><span><i className="is-recorded" /> Kaydedildi</span><span><i /> Boş</span></footer>
      </section>

      <section className="wake-insights__history" aria-labelledby="wake-history-title">
        <header><div><span>GEÇMİŞ</span><h3 id="wake-history-title">Son kayıtların</h3></div><small>Yönetmek için basılı tut</small></header>
        {sorted.length === 0 ? <p>İlk sabah kaydın burada görünecek.</p> : sorted.map((record) => <WakeHistoryRow key={record.date} record={record} currentGoal={goal} onManage={() => onManage(record)} />)}
      </section>

      {records.length > 0 && <AppButton className="wake-insights__reset" tone="quiet" size="sm" block haptic="none" onClick={onReset}>Geçmiş verilerini yönet</AppButton>}
    </WakeSheet>
  )
}

export function WakeRecordActionsSheet({ record, currentGoal, onClose, onEdit, onDelete }: {
  record: WakeRecord
  currentGoal: string | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const goal = wakeGoalForRecord(record, currentGoal)
  return (
    <ManagementSheet
      eyebrow={formatShortDate(new Date(`${record.date}T12:00:00`))}
      title={`${record.time} uyanma kaydı`}
      subtitle={goal ? `Kayıt hedefi ${goal}` : 'Hedefsiz kayıt'}
      icon={<LuupiIcon name="sunrise" />}
      accent="amber"
      onClose={onClose}
      actions={[
        { id: 'edit', label: 'Saati Düzenle', icon: '✎', onSelect: onEdit },
        { id: 'delete', label: 'Kaydı Sil', icon: '×', tone: 'destructive', onSelect: onDelete },
      ]}
    />
  )
}

export function WakeRecordSheet({ record, currentGoal, onClose, onSave }: {
  record: WakeRecord
  currentGoal: string | null
  onClose: () => void
  onSave: (record: WakeRecord) => void
}) {
  const [time, setTime] = useState(record.time)
  const goal = wakeGoalForRecord(record, currentGoal)
  return (
    <WakeSheet title="Uyanma kaydını yönet" eyebrow={formatShortDate(new Date(`${record.date}T12:00:00`)).toLocaleUpperCase('tr-TR')} icon={<LuupiIcon name="sunrise" />} onClose={onClose}>
      <label className="wake-time-picker"><span>UYANMA SAATİ</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
      <div className="wake-record-context"><span>Kayıt anındaki hedef</span><strong>{goal ?? 'Hedef yok'}</strong></div>
      <div className="wake-record-actions"><AppButton tone="primary" size="lg" block haptic="none" onClick={() => onSave({ ...record, time })}>Değişikliği Kaydet</AppButton></div>
    </WakeSheet>
  )
}

export function WakeDeleteDialog({ record, all, onClose, onConfirm }: { record?: WakeRecord; all?: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <ConfirmActionSheet
      title={all ? 'Tüm geçmiş silinsin mi?' : 'Kayıt silinsin mi?'}
      description={all ? 'Bütün uyanma kayıtların silinecek. Bu işlem geri alınamaz.' : `${record ? formatShortDate(new Date(`${record.date}T12:00:00`)) : ''} tarihindeki kayıt ritminden kaldırılacak.`}
      icon={<LuupiIcon name="sunrise" />}
      confirmLabel={all ? 'Tümünü Sil' : 'Kaydı Sil'}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
