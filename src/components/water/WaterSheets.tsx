import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { WaterEntry } from '../../types'
import { dateStr, formatShortDate, getDaysInMonth, getFirstDayOfMonth, TR_DAY_SHORTS, trMonthName, todayStr } from '../../utils/date'
import { useLongPressGesture } from '../../utils/useLongPressGesture'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import {
  bestDay,
  daysGoalMet,
  entriesForDate,
  formatWaterAmount,
  totalsForMonth,
  waterMonthSummary,
  yearsAvailable,
  type WaterGoalResolver,
} from '../../utils/water'
import AppButton from '../ui/AppButton'
import { ConfirmActionSheet } from '../ui/ManagementSheet'
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

function SheetShell({ title, eyebrow, icon, onClose, children, className = '' }: {
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
  const titleId = `water-sheet-${title.replaceAll(' ', '-').toLocaleLowerCase('tr-TR')}`
  return createPortal(
    <div className="water-sheet-layer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="water-sheet__scrim" onClick={close} aria-label="Kapat" />
      <section ref={ref} style={sheetDrag.surfaceStyle} className={`water-sheet ${className} ${sheetDrag.surfaceClassName} ${isExiting ? 'water-sheet--exit' : 'water-sheet--enter'}`}>
        <span className="water-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="water-sheet__header">
          <span className="water-sheet__glyph" aria-hidden>{icon}</span>
          <div><span>{eyebrow}</span><h2 id={titleId}>{title}</h2></div>
          <button type="button" className="water-sheet__close" onClick={close} aria-label="Kapat">×</button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  )
}

const AMOUNT_PRESETS = [200, 300, 500, 750]
const GOAL_PRESETS = [2000, 2500, 3000, 4000]

export function WaterAmountSheet({ initialValue, mode, onClose, onConfirm }: {
  initialValue: number
  mode: 'bottle' | 'custom'
  onClose: () => void
  onConfirm: (ml: number) => void
}) {
  const [value, setValue] = useState(initialValue)
  const clamp = (next: number) => setValue(Math.max(50, Math.min(3000, Math.round(next / 50) * 50)))
  return (
    <SheetShell title={mode === 'bottle' ? 'Hızlı ekleme miktarı' : 'Özel miktar'} eyebrow={mode === 'bottle' ? 'ŞİŞENİ AYARLA' : 'TEK SEFERLİK KAYIT'} icon={<LuupiIcon name="water" />} onClose={onClose}>
      <div className="water-stepper">
        <button type="button" onClick={() => clamp(value - 50)} aria-label="50 mililitre azalt">−</button>
        <label><span>MİKTAR</span><input type="number" inputMode="numeric" min="50" max="3000" step="50" value={value} onChange={(event) => clamp(Number(event.target.value) || 50)} /><strong>ml</strong></label>
        <button type="button" onClick={() => clamp(value + 50)} aria-label="50 mililitre artır">+</button>
      </div>
      <div className="water-preset-grid">
        {AMOUNT_PRESETS.map((amount) => <button type="button" key={amount} className={value === amount ? 'is-active' : ''} onClick={() => setValue(amount)}>{formatWaterAmount(amount)}</button>)}
      </div>
      <p className="water-sheet__hint">{mode === 'bottle' ? 'Ana ekrandaki büyük ekleme butonu bu miktarı kullanır.' : 'Bu miktar yalnızca bu kayıt için geçerlidir.'}</p>
      <AppButton tone="primary" size="lg" block haptic="none" onClick={() => onConfirm(value)}>{mode === 'bottle' ? 'Miktarı Kaydet' : `${formatWaterAmount(value)} Ekle`}</AppButton>
    </SheetShell>
  )
}

export function WaterGoalSheet({ initialValue, onClose, onConfirm }: { initialValue: number; onClose: () => void; onConfirm: (ml: number) => void }) {
  const [value, setValue] = useState(initialValue)
  const clamp = (next: number) => setValue(Math.max(500, Math.min(6000, Math.round(next / 250) * 250)))
  return (
    <SheetShell title="Günlük su hedefi" eyebrow="ÖLÇÜLEBİLİR RİTİM" icon="◎" onClose={onClose}>
      <div className="water-stepper water-stepper--goal">
        <button type="button" onClick={() => clamp(value - 250)} aria-label="250 mililitre azalt">−</button>
        <label><span>GÜNLÜK HEDEF</span><input type="number" inputMode="numeric" min="500" max="6000" step="250" value={value} onChange={(event) => clamp(Number(event.target.value) || 500)} /><strong>ml</strong></label>
        <button type="button" onClick={() => clamp(value + 250)} aria-label="250 mililitre artır">+</button>
      </div>
      <div className="water-preset-grid">
        {GOAL_PRESETS.map((amount) => <button type="button" key={amount} className={value === amount ? 'is-active' : ''} onClick={() => setValue(amount)}>{formatWaterAmount(amount)}</button>)}
      </div>
      <p className="water-sheet__hint">Değişiklik bugünden itibaren geçerli olur; geçmiş başarıların korunur.</p>
      <AppButton tone="primary" size="lg" block haptic="none" onClick={() => onConfirm(value)}>Hedefi Kaydet</AppButton>
    </SheetShell>
  )
}

function HistoryRow({ entry, onManage }: { entry: WaterEntry; onManage: () => void }) {
  const longPress = useLongPressGesture({ onLongPress: onManage })
  return (
    <button
      type="button"
      className={`water-history-row long-press-surface ${longPress.isPressing ? 'water-history-row--pressing' : ''}`}
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
      aria-label={`${entry.time}, ${formatWaterAmount(entry.ml)}. Yönetmek için basılı tut.`}
    >
      <span className="long-press-progress" aria-hidden />
      <span className="water-history-row__drop" aria-hidden>◆</span>
      <div><strong>{formatWaterAmount(entry.ml)}</strong><small>{entry.time}</small></div>
      <span className="water-history-row__hold">Basılı tut</span>
    </button>
  )
}

export function WaterHistorySheet({ entries, total, onClose, onManage }: {
  entries: WaterEntry[]
  total: number
  onClose: () => void
  onManage: (entry: WaterEntry) => void
}) {
  const groups = [...entries]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .reduce<Map<string, WaterEntry[]>>((map, entry) => {
      map.set(entry.date, [...(map.get(entry.date) ?? []), entry])
      return map
    }, new Map())
  return (
    <SheetShell title="Su geçmişi" eyebrow={`${entries.length} KAYIT · ${formatWaterAmount(total)}`} icon="≋" onClose={onClose}>
      <div className="water-history-list">
        {[...groups].map(([date, dateEntries]) => (
          <section className="water-history-group" key={date}>
            <header><strong>{date === todayStr() ? 'Bugün' : formatShortDate(new Date(`${date}T12:00:00`))}</strong><span>{formatWaterAmount(dateEntries.reduce((sum, entry) => sum + entry.ml, 0))}</span></header>
            {dateEntries.map((entry) => <HistoryRow key={entry.id} entry={entry} onManage={() => onManage(entry)} />)}
          </section>
        ))}
      </div>
      <p className="water-sheet__hint">Bir kaydı silmek için satıra basılı tut.</p>
    </SheetShell>
  )
}

export function WaterDeleteDialog({ entry, onClose, onConfirm }: { entry: WaterEntry; onClose: () => void; onConfirm: () => void }) {
  return (
    <ConfirmActionSheet
      title="Su kaydı silinsin mi?"
      description={`${entry.time} saatindeki ${formatWaterAmount(entry.ml)} kaydı günlük ritminden kaldırılacak.`}
      icon={<LuupiIcon name="water" />}
      confirmLabel="Kaydı Sil"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}

type InsightTab = 'day' | 'month' | 'year'

export function WaterInsightsSheet({ entries, goal, onClose }: { entries: WaterEntry[]; goal: WaterGoalResolver; onClose: () => void }) {
  const today = todayStr()
  const now = new Date(`${today}T12:00:00`)
  const [tab, setTab] = useState<InsightTab>('month')
  const [day, setDay] = useState(today)
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [year, setYear] = useState(now.getFullYear())
  const years = yearsAvailable(entries)
  const recordedAverage = entries.length > 0
    ? Math.round(entries.reduce((sum, entry) => sum + entry.ml, 0) / new Set(entries.map((entry) => entry.date)).size)
    : 0
  const globalBest = bestDay(entries)
  const goalDays = daysGoalMet(entries, goal)

  const changeDay = (delta: number) => {
    const next = new Date(`${day}T12:00:00`); next.setDate(next.getDate() + delta)
    const value = dateStr(next); if (value <= today) setDay(value)
  }
  const changeMonth = (delta: number) => {
    const next = new Date(period.year, period.month + delta, 1)
    if (next > new Date(now.getFullYear(), now.getMonth(), 1)) return
    setPeriod({ year: next.getFullYear(), month: next.getMonth() })
  }

  const monthDays = totalsForMonth(entries, period.year, period.month)
  const monthMap = new Map(monthDays.map((item) => [item.date, item.ml]))
  const monthSummary = waterMonthSummary(entries, period.year, period.month, today, goal)
  const monthCount = getDaysInMonth(period.year, period.month)
  const firstColumn = getFirstDayOfMonth(period.year, period.month)
  const currentMonth = period.year === now.getFullYear() && period.month === now.getMonth()
  const dayEntries = entriesForDate(entries, day)
  const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.ml, 0)
  const dayGoal = typeof goal === 'function' ? goal(day) : goal
  const monthModels = Array.from({ length: 12 }, (_, month) => ({ month, ...waterMonthSummary(entries, year, month, today, goal) }))
  const maxAverage = Math.max(1, ...monthModels.map((item) => item.average))

  return (
    <SheetShell title="Su içgörüleri" eyebrow="RİTMİNİN BÜYÜK RESMİ" icon={<LuupiIcon name="chart-line" />} onClose={onClose} className="water-insights-sheet">
      <div className="water-insights__summary">
        <div><span>KAYITLI GÜN ORT.</span><strong>{formatWaterAmount(recordedAverage)}</strong></div>
        <div><span>EN İYİ GÜN</span><strong>{globalBest ? formatWaterAmount(globalBest.ml) : '—'}</strong></div>
        <div><span>HEDEF GÜNÜ</span><strong>{goalDays}</strong></div>
      </div>
      <div className="water-insights__tabs" role="tablist" aria-label="İstatistik aralığı">
        {([['day', 'Gün'], ['month', 'Ay'], ['year', 'Yıl']] as [InsightTab, string][]).map(([key, label]) => <button type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} key={key} onClick={() => setTab(key)}>{label}</button>)}
      </div>

      {tab === 'day' && <div className="water-insight-panel">
        <div className="water-period-nav"><button type="button" onClick={() => changeDay(-1)}>‹</button><strong>{formatShortDate(new Date(`${day}T12:00:00`))}</strong><button type="button" onClick={() => changeDay(1)} disabled={day >= today}>›</button></div>
        <div className="water-day-focus"><span>{dayTotal >= dayGoal ? 'HEDEF TAMAM' : 'GÜNLÜK İLERLEME'}</span><strong>{formatWaterAmount(dayTotal)}</strong><p>{dayTotal >= dayGoal ? `${formatWaterAmount(dayTotal - dayGoal)} hedef üstü` : `${formatWaterAmount(dayGoal - dayTotal)} kaldı`}</p><i><b style={{ width: `${Math.min(100, dayTotal / dayGoal * 100)}%` }} /></i></div>
        <div className="water-day-log">{dayEntries.length === 0 ? <p>Bu güne ait su kaydı yok.</p> : dayEntries.map((entry) => <div key={entry.id}><span>{entry.time}</span><strong>{formatWaterAmount(entry.ml)}</strong></div>)}</div>
      </div>}

      {tab === 'month' && <div className="water-insight-panel">
        <div className="water-period-nav"><button type="button" onClick={() => changeMonth(-1)}>‹</button><strong>{trMonthName(period.month)} {period.year}</strong><button type="button" onClick={() => changeMonth(1)} disabled={currentMonth}>›</button></div>
        <div className="water-month-weekdays">{TR_DAY_SHORTS.map((label) => <span key={label}>{label}</span>)}</div>
        <div className="water-month-grid">
          {Array.from({ length: firstColumn }, (_, index) => <span key={`empty-${index}`} />)}
          {Array.from({ length: monthCount }, (_, index) => {
            const date = `${period.year}-${String(period.month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`
            const amount = monthMap.get(date) ?? 0
            const target = typeof goal === 'function' ? goal(date) : goal
            const future = date > today
            const state = future ? 'future' : amount >= target ? 'goal' : amount > 0 ? 'partial' : 'empty'
            return <span key={date} className={`is-${state}`} title={`${index + 1} ${trMonthName(period.month)}: ${formatWaterAmount(amount)}`}><b>{index + 1}</b>{state === 'goal' && <i>✓</i>}</span>
          })}
        </div>
        <div className="water-month-metrics"><div><span>GÜNLÜK ORT.</span><strong>{formatWaterAmount(monthSummary.average)}</strong></div><div><span>HEDEF GÜNÜ</span><strong>{monthSummary.goalDays}/{monthSummary.elapsedDays}</strong></div><div><span>EN İYİ</span><strong>{monthSummary.best ? formatWaterAmount(monthSummary.best.ml) : '—'}</strong></div></div>
        <div className="water-month-legend"><span><i className="is-goal" /> Hedef</span><span><i className="is-partial" /> Kısmi</span><span><i className="is-empty" /> Kayıt yok</span></div>
      </div>}

      {tab === 'year' && <div className="water-insight-panel">
        <div className="water-period-nav"><button type="button" onClick={() => setYear((value) => value - 1)}>‹</button><select value={year} onChange={(event) => setYear(Number(event.target.value))}>{years.map((item) => <option key={item}>{item}</option>)}</select><button type="button" onClick={() => setYear((value) => value + 1)} disabled={year >= now.getFullYear()}>›</button></div>
        <div className="water-year-chart">{monthModels.map((item) => <div key={item.month}><i><b style={{ height: `${Math.max(item.average > 0 ? 5 : 0, item.average / maxAverage * 100)}%` }} /></i><span>{trMonthName(item.month).slice(0, 3)}</span></div>)}</div>
        <div className="water-year-list">{monthModels.filter((item) => item.elapsedDays > 0).map((item) => <div key={item.month}><span>{trMonthName(item.month)}<small>{item.goalDays}/{item.elapsedDays} hedef günü</small></span><strong>{formatWaterAmount(item.average)}<small>günlük ort.</small></strong></div>)}</div>
      </div>}
    </SheetShell>
  )
}
