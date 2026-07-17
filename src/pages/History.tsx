import { useMemo, useRef, useState, type PointerEvent } from 'react'
import BackBar from '../components/BackBar'
import HistoryDaySheet from '../components/history/HistoryDaySheet'
import AppButton from '../components/ui/AppButton'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import { useApp } from '../context/AppContext'
import { formatMinutes, getFirstDayOfMonth, trMonthName, TR_DAY_SHORTS, todayStr } from '../utils/date'
import { buildHistoryMonth, earliestHistoryDate, type HistoryDayRecord, type HistoryDayTone, type HistorySources } from '../utils/history'
import { hapticEvent } from '../utils/haptics'
import { MOTION } from '../utils/motion'
import {
  beginPointerGesture,
  finishPointerGesture,
  updatePointerGesture,
  type PointerGestureSession,
} from '../utils/pointerGesture'
import { storage } from '../utils/storage'
import LuupiIcon from '../components/ui/LuupiIcon'
import type { IconName } from '../utils/icons'

const TONE_COPY: Record<HistoryDayTone, string> = {
  success: 'Tamamlanan gün',
  mixed: 'Karışık kararlar',
  missed: 'Atlanan veya kaçırılan gün',
  tools: 'Araç aktivitesi',
  empty: 'Kayıt yok',
}

const TONE_MARK: Record<HistoryDayTone, string> = {
  success: '✓',
  mixed: '◐',
  missed: '×',
  tools: '✦',
  empty: '',
}

function monthIndex(year: number, month: number): number {
  return year * 12 + month
}

function formatDay(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date(`${date}T12:00:00`))
}

function formatAriaDay(day: HistoryDayRecord): string {
  const decisions = `${day.completed} tamamlandı, ${day.explicitSkipped} atlandı, ${day.missed} kaçırıldı`
  return `${formatDay(day.date)}. ${TONE_COPY[day.tone]}. ${decisions}.`
}

function feedSummary(day: HistoryDayRecord): string {
  const parts: string[] = []
  if (day.completed > 0) parts.push(`${day.completed} tamamlandı`)
  if (day.explicitSkipped > 0) parts.push(`${day.explicitSkipped} atlandı`)
  if (day.sessions.length > 0) parts.push(formatMinutes(day.focusMinutes))
  if (day.activeToolCount > 0) parts.push(`${day.activeToolCount} araç`)
  if (day.water) parts.push('su kaydı')
  if (day.wake) parts.push('uyanma')
  return parts.join(' · ') || 'Gün kaydı'
}

function toolMarks(day: HistoryDayRecord): IconName[] {
  return [
    day.sessions.length ? 'timer' : null,
    day.justStartCount ? 'bolt' : null,
    day.todos.length ? 'list-check' : null,
    day.noRush.length ? 'coffee' : null,
    day.water ? 'water' : null,
    day.wake ? 'sunrise' : null,
  ].filter((icon): icon is IconName => icon !== null)
}

export default function History() {
  const { logs, habits, categories, freeSessions } = useApp()
  const today = todayStr()
  const [todayYear, todayMonth] = today.split('-').map(Number)
  const [viewYear, setViewYear] = useState(todayYear)
  const [viewMonth, setViewMonth] = useState(todayMonth - 1)
  const [direction, setDirection] = useState<'previous' | 'next'>('next')
  const [selectedDay, setSelectedDay] = useState<HistoryDayRecord | null>(null)
  const pointerRef = useRef<PointerGestureSession | null>(null)
  const suppressClickRef = useRef(false)
  const [archive] = useState(() => ({
    noRush: storage.getNoRushHistory(),
    todos: storage.getTodos(),
    waterEntries: storage.getWaterEntries(),
    wakeRecords: storage.getWakeRecords(),
    wakeGoal: storage.getWakeGoal(),
    justStartDailyCounts: storage.getJustStartStats().dailyCounts,
  }))


  const sources = useMemo<HistorySources>(() => ({
    habits,
    logs,
    freeSessions,
    ...archive,
    waterGoalForDate: storage.getWaterGoalForDate,
  }), [archive, freeSessions, habits, logs])
  const month = useMemo(
    () => buildHistoryMonth(sources, viewYear, viewMonth, today),
    [sources, today, viewMonth, viewYear],
  )
  const earliest = useMemo(() => earliestHistoryDate(sources, today), [sources, today])
  const [earliestYear, earliestMonth] = earliest.split('-').map(Number)
  const viewedIndex = monthIndex(viewYear, viewMonth)
  const canGoPrevious = viewedIndex > monthIndex(earliestYear, earliestMonth - 1)
  const canGoNext = viewedIndex < monthIndex(todayYear, todayMonth - 1)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const changeMonth = (delta: -1 | 1) => {
    if ((delta < 0 && !canGoPrevious) || (delta > 0 && !canGoNext)) return
    const next = new Date(viewYear, viewMonth + delta, 1)
    setDirection(delta < 0 ? 'previous' : 'next')
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
    setSelectedDay(null)
    void hapticEvent('selection')
  }

  const openDay = (day: HistoryDayRecord) => {
    if (suppressClickRef.current || !day.hasHistory || day.date > today) return
    setSelectedDay(day)
    void hapticEvent('selection')
  }

  const onCalendarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const captureTarget = event.target instanceof HTMLElement ? event.target : event.currentTarget
    pointerRef.current = beginPointerGesture(event, captureTarget)
  }

  const onCalendarPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId) return
    const update = updatePointerGesture(pointer, event, 1.2)
    if (update?.axis === 'vertical') pointerRef.current = null
  }

  const onCalendarPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    pointerRef.current = null
    if (!pointer || pointer.pointerId !== event.pointerId) return
    finishPointerGesture(pointer)
    const deltaX = event.clientX - pointer.startX
    if (pointer.axis !== 'horizontal' || Math.abs(deltaX) < 48) return
    suppressClickRef.current = true
    changeMonth(deltaX > 0 ? -1 : 1)
    window.setTimeout(() => { suppressClickRef.current = false }, MOTION.standard)
  }

  return (
    <>
      {selectedDay && <HistoryDaySheet record={selectedDay} categories={categories} onClose={() => setSelectedDay(null)} />}

      <div className="history-page max-w-xl mx-auto px-4 pt-5">
        <BackBar title="Profil" />
        <PageHeader title="Geçmiş" subtitle="Ritminin gün gün büyüyen arşivi." />

        <SurfaceCard variant="hero" className="history-hero">
          <div className="history-hero__heading"><span>AYLIK RİTİM</span><h2>{trMonthName(viewMonth)} {viewYear}</h2><p>Kararların ve kullandığın araçlar aynı hikâyede.</p></div>
          <div className="history-hero__metrics">
            <div><span>Başarı</span><strong>{month.completionRate === null ? '—' : `%${month.completionRate}`}</strong></div>
            <div><span>Aktif gün</span><strong>{month.activeDays}</strong></div>
            <div><span>Odak</span><strong>{formatMinutes(month.focusMinutes)}</strong></div>
          </div>
          <span className="history-hero__orb" aria-hidden>✦</span>
        </SurfaceCard>

        <SurfaceCard
          variant="raised"
          className="history-calendar"
          onPointerDown={onCalendarPointerDown}
          onPointerMove={onCalendarPointerMove}
          onPointerUp={onCalendarPointerUp}
          onPointerCancel={() => {
            finishPointerGesture(pointerRef.current)
            pointerRef.current = null
          }}
          onLostPointerCapture={(event) => {
            if (pointerRef.current?.pointerId === event.pointerId) pointerRef.current = null
          }}
        >
          <header className="history-calendar__header">
            <AppButton tone="quiet" size="sm" haptic="none" onClick={() => changeMonth(-1)} disabled={!canGoPrevious} aria-label="Önceki ay">←</AppButton>
            <div><span>AYLIK ARŞİV</span><h2>{trMonthName(viewMonth)} {viewYear}</h2></div>
            <AppButton tone="quiet" size="sm" haptic="none" onClick={() => changeMonth(1)} disabled={!canGoNext} aria-label="Sonraki ay">→</AppButton>
          </header>

          <div key={`${viewYear}-${viewMonth}`} className={`history-calendar__body history-calendar__body--${direction}`}>
            <div className="history-calendar__weekdays" aria-hidden>{TR_DAY_SHORTS.map((day) => <span key={day}>{day}</span>)}</div>
            <div className="history-calendar__grid" aria-label={`${trMonthName(viewMonth)} ${viewYear} geçmiş takvimi`}>
              {Array.from({ length: firstDay }).map((_, index) => <span key={`empty-${index}`} className="history-calendar__placeholder" />)}
              {month.days.map((day) => {
                const isFuture = day.date > today
                const isToday = day.date === today
                return (
                  <button
                    key={day.date}
                    type="button"
                    className={`history-calendar-day history-calendar-day--${day.tone} ${isToday ? 'is-today' : ''}`}
                    onClick={() => openDay(day)}
                    disabled={isFuture || !day.hasHistory}
                    aria-label={formatAriaDay(day)}
                  >
                    <span>{Number(day.date.slice(-2))}</span>
                    <i aria-hidden>{TONE_MARK[day.tone]}</i>
                    {day.activeToolCount > 0 && day.tone !== 'tools' && <b aria-hidden />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="history-calendar__legend" aria-label="Takvim açıklaması">
            <span><i className="is-success" />Tamam</span>
            <span><i className="is-mixed" />Karışık</span>
            <span><i className="is-missed" />Kaçırıldı</span>
            <span><i className="is-tools" />Araç</span>
          </div>
          <p className="history-calendar__gesture">Aylar arasında geçmek için takvimi yana kaydırabilirsin.</p>
        </SurfaceCard>

        <section className="history-feed">
          <header className="history-feed__header"><div><span>KAYIT AKIŞI</span><h2>{trMonthName(viewMonth)} günleri</h2></div><small>{month.feed.length} kayıtlı gün</small></header>
          {month.feed.length === 0 ? (
            <SurfaceCard variant="tinted" className="history-feed__empty"><span>◌</span><h3>Bu ay henüz kayıt yok.</h3><p>Kararların ve araç sonuçların burada birikmeye başlayacak.</p></SurfaceCard>
          ) : (
            <div className="history-feed__list">
              {month.feed.map((day) => {
                const marks = toolMarks(day)
                return (
                  <button key={day.date} type="button" className={`history-feed-row history-feed-row--${day.tone}`} onClick={() => openDay(day)}>
                    <span className="history-feed-row__status" aria-hidden>{TONE_MARK[day.tone]}</span>
                    <div className="history-feed-row__copy"><strong>{formatDay(day.date)}</strong><small>{feedSummary(day)}</small></div>
                    {marks.length > 0 && <div className="history-feed-row__tools" aria-label="Kullanılan araçlar">{marks.slice(0, 4).map((mark, index) => <i key={`${mark}-${index}`}><LuupiIcon name={mark} size={14} /></i>)}</div>}
                    <div className="history-feed-row__score"><strong>{day.score.score?.toLocaleString('tr-TR') ?? '—'}</strong><small>/10</small></div>
                    <span className="history-feed-row__chevron" aria-hidden>›</span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
