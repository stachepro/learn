import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackBar from '../components/BackBar'
import HabitDayDetailSheet from '../components/habits/HabitDayDetailSheet'
import AppButton from '../components/ui/AppButton'
import SurfaceCard from '../components/ui/SurfaceCard'
import { useApp } from '../context/AppContext'
import type { HabitHistoryDay, HabitHistoryStatus } from '../utils/habitHistory'
import { buildHabitAllTimeHistory, buildHabitMonthHistory, habitCreatedDate } from '../utils/habitHistory'
import { getHabitCardShape, normalizeHabitCardColor } from '../utils/habitCard'
import { getFirstDayOfMonth, trMonthName, TR_DAY_SHORTS, todayStr } from '../utils/date'
import { hapticEvent } from '../utils/haptics'
import { MOTION } from '../utils/motion'
import {
  beginPointerGesture,
  finishPointerGesture,
  updatePointerGesture,
  type PointerGestureSession,
} from '../utils/pointerGesture'
import { WEEKDAY_NAMES } from '../utils/habitSchedule'
import LuupiIcon from '../components/ui/LuupiIcon'

const STATUS_LABELS: Record<HabitHistoryStatus, string> = {
  completed: 'Tamamlandı',
  'explicit-skip': 'Atlandı',
  missed: 'Kaçırıldı',
  pending: 'Bugün bekliyor',
  off: 'Plan dışı',
  future: 'Gelecek gün',
  'before-created': 'Alışkanlık henüz yoktu',
}

const LEGEND: { status: HabitHistoryStatus; label: string }[] = [
  { status: 'completed', label: 'Tamamlandı' },
  { status: 'explicit-skip', label: 'Atlandı' },
  { status: 'missed', label: 'Kaçırıldı' },
  { status: 'pending', label: 'Bugün bekliyor' },
  { status: 'off', label: 'Plan dışı' },
]

function recurrenceLabel(recurrence: string | undefined, days: number[] | undefined): string {
  if (recurrence === 'once') return 'Tek sefer'
  if (recurrence === 'weekly') return 'Haftalık'
  if (recurrence === 'custom' && days?.length) return days.map((day) => WEEKDAY_NAMES[day]).join(' · ')
  return 'Her gün'
}

function monthIndex(year: number, month: number): number {
  return year * 12 + month
}

function formatAriaDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`))
}

export default function HabitStats() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { habits, logs, categories } = useApp()
  const logicalToday = todayStr()
  const [todayYear, todayMonth] = logicalToday.split('-').map(Number)
  const habit = habits.find((item) => item.id === id)
  const [viewYear, setViewYear] = useState(todayYear)
  const [viewMonth, setViewMonth] = useState(todayMonth - 1)
  const [calendarDirection, setCalendarDirection] = useState<'previous' | 'next'>('next')
  const [selectedDay, setSelectedDay] = useState<HabitHistoryDay | null>(null)
  const pointerRef = useRef<PointerGestureSession | null>(null)
  const suppressDayClickRef = useRef(false)


  const category = categories.find((item) => item.id === habit?.categoryId)
  const shape = habit ? getHabitCardShape(habit.id) : 'pebble'
  const seed = normalizeHabitCardColor(habit?.labelColor || category?.color)
  const created = habit ? habitCreatedDate(habit) : logicalToday
  const [createdYear, createdMonth] = created.split('-').map(Number)
  const currentMonthIndex = monthIndex(todayYear, todayMonth - 1)
  const createdMonthIndex = monthIndex(createdYear, createdMonth - 1)
  const viewedMonthIndex = monthIndex(viewYear, viewMonth)
  const canGoPrevious = viewedMonthIndex > createdMonthIndex
  const canGoNext = viewedMonthIndex < currentMonthIndex

  const monthHistory = useMemo(
    () => habit ? buildHabitMonthHistory(habit, logs, viewYear, viewMonth, logicalToday) : null,
    [habit, logs, viewYear, viewMonth, logicalToday],
  )
  const allTimeHistory = useMemo(
    () => habit ? buildHabitAllTimeHistory(habit, logs, logicalToday) : null,
    [habit, logs, logicalToday],
  )

  if (!habit || !monthHistory || !allTimeHistory) {
    return (
      <div className="habit-detail-not-found max-w-sm mx-auto px-4 py-20">
          <span aria-hidden><LuupiIcon name="search" size={18} /></span>
        <h1>Alışkanlık bulunamadı</h1>
        <AppButton tone="primary" onClick={() => navigate('/habits')}>Alışkanlıklara dön</AppButton>
      </div>
    )
  }

  const changeMonth = (delta: -1 | 1) => {
    if ((delta < 0 && !canGoPrevious) || (delta > 0 && !canGoNext)) return
    const next = new Date(viewYear, viewMonth + delta, 1)
    setCalendarDirection(delta < 0 ? 'previous' : 'next')
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
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
    suppressDayClickRef.current = true
    changeMonth(deltaX > 0 ? -1 : 1)
    window.setTimeout(() => { suppressDayClickRef.current = false }, MOTION.standard)
  }

  const openDay = (day: HabitHistoryDay) => {
    if (suppressDayClickRef.current) return
    setSelectedDay(day)
    void hapticEvent('selection')
  }

  const monthStat = monthHistory.summary
  const allStat = allTimeHistory.summary
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const progressStyle = {
    '--habit-detail-seed': seed,
    '--habit-detail-progress': `${monthStat.successPct ?? 0}%`,
  } as CSSProperties

  return (
    <>
      {selectedDay && (
        <HabitDayDetailSheet
          habit={habit}
          day={selectedDay}
          rawLog={logs[selectedDay.date]?.habits[habit.id]}
          onClose={() => setSelectedDay(null)}
        />
      )}

      <div className="habit-detail-page max-w-xl mx-auto px-4 pt-5" style={progressStyle}>
        <BackBar title="Alışkanlıklar" />

        <SurfaceCard variant="hero" className="habit-detail-identity">
          <span className={`habit-detail-identity__totem habit-detail-identity__totem--${shape}`} aria-hidden><LuupiIcon name={habit.icon} size={48} /></span>
          <div className="habit-detail-identity__copy">
            <span>{category && <LuupiIcon name={category.icon} size={16} />} {category?.name ?? 'Alışkanlık'}</span>
            <h1>{habit.name}</h1>
            <p>{recurrenceLabel(habit.recurrence, habit.recurrenceDays)}</p>
          </div>
          <span className="habit-detail-identity__orbit" aria-hidden />
        </SurfaceCard>

        <SurfaceCard variant="raised" className="habit-detail-performance">
          <div className="habit-detail-performance__heading">
            <div>
              <span>Seçili ay</span>
              <h2>{trMonthName(viewMonth)} performansı</h2>
            </div>
            <small>{monthStat.eligibleTotal > 0 ? `${monthStat.eligibleTotal} planlı gün` : 'Henüz veri yok'}</small>
          </div>

          <div className="habit-detail-performance__stage">
            <div className={`habit-detail-performance__ring ${monthStat.successPct === null ? 'is-empty' : ''}`}>
              <div>
                <strong>{monthStat.successPct === null ? '—' : `%${monthStat.successPct}`}</strong>
                <span>başarı</span>
              </div>
            </div>
            <div className="habit-detail-performance__metrics">
              <div className="habit-detail-performance__metric habit-detail-performance__metric--completed">
                <span aria-hidden>✓</span>
                <div><strong>{monthStat.completed}</strong><small>Tamamlandı</small></div>
              </div>
              <div className="habit-detail-performance__metric habit-detail-performance__metric--missed">
                <span aria-hidden>×</span>
                <div><strong>{monthStat.skipped}</strong><small>Kaçırıldı</small></div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          variant="raised"
          className="habit-detail-calendar"
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
          <header className="habit-detail-calendar__header">
            <AppButton tone="quiet" size="sm" haptic="none" onClick={() => changeMonth(-1)} disabled={!canGoPrevious} aria-label="Önceki ay">←</AppButton>
            <div>
              <span>Aylık ritim</span>
              <h2>{trMonthName(viewMonth)} {viewYear}</h2>
            </div>
            <AppButton tone="quiet" size="sm" haptic="none" onClick={() => changeMonth(1)} disabled={!canGoNext} aria-label="Sonraki ay">→</AppButton>
          </header>

          <div key={`${viewYear}-${viewMonth}`} className={`habit-detail-calendar__body habit-detail-calendar__body--${calendarDirection}`}>
            <div className="habit-detail-calendar__weekdays" aria-hidden>
              {TR_DAY_SHORTS.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="habit-detail-calendar__grid" aria-label={`${trMonthName(viewMonth)} ${viewYear} alışkanlık takvimi`}>
              {Array.from({ length: firstDay }).map((_, index) => <span key={`empty-${index}`} className="habit-detail-calendar__placeholder" />)}
              {monthHistory.days.map((day) => {
                const dayNumber = Number(day.date.slice(-2))
                return (
                  <button
                    key={day.date}
                    type="button"
                    className={`habit-detail-day habit-detail-day--${day.status}`}
                    onClick={() => openDay(day)}
                    aria-label={`${formatAriaDate(day.date)}: ${STATUS_LABELS[day.status]}`}
                  >
                    <span>{dayNumber}</span>
                    <i aria-hidden>{day.status === 'completed' ? '✓' : day.status === 'explicit-skip' ? '×' : day.status === 'missed' ? '／' : day.status === 'pending' ? '•' : ''}</i>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="habit-detail-legend" aria-label="Takvim açıklaması">
            {LEGEND.map((item) => (
              <span key={item.status}>
                <i className={`habit-detail-legend__swatch habit-detail-legend__swatch--${item.status}`} aria-hidden />
                {item.label}
              </span>
            ))}
          </div>
          <p className="habit-detail-calendar__gesture">Aylar arasında geçmek için takvimi yana kaydırabilirsin.</p>
        </SurfaceCard>

        <SurfaceCard variant="tinted" className="habit-detail-lifetime">
          <div>
            <span>Tüm zamanlar</span>
            <strong>{allStat.successPct === null ? '—' : `%${allStat.successPct}`}</strong>
          </div>
          <dl>
            <div><dt>Tamamlanan</dt><dd>{allStat.completed}</dd></div>
            <div><dt>Kaçırılan</dt><dd>{allStat.skipped}</dd></div>
            <div><dt>Planlı gün</dt><dd>{allStat.eligibleTotal}</dd></div>
          </dl>
        </SurfaceCard>
      </div>
    </>
  )
}
