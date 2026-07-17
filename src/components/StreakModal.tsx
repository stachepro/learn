import { createPortal } from 'react-dom'
import { useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useApp } from '../context/AppContext'
import {
  FREEZE_EARN_DAYS,
  getFlameState,
  getFreezes,
  getFreezeProgress,
  MAX_STREAK_FREEZES,
  type FlameState,
} from '../utils/streak'
import {
  buildStreakMonth,
  buildStreakWeek,
  getStreakActiveDates,
  getStreakTrackingStart,
  type StreakDayState,
} from '../utils/streakHistory'
import { getFirstDayOfMonth, trMonthName, TR_DAY_SHORTS, todayStr, yesterdayStr } from '../utils/date'
import { hapticEvent } from '../utils/haptics'
import {
  beginPointerGesture,
  finishPointerGesture,
  updatePointerGesture,
  type PointerGestureSession,
} from '../utils/pointerGesture'
import { useCountUp } from '../utils/useCountUp'
import { useModalDismiss } from '../utils/useModalDismiss'
import { useSheetDragDismiss } from '../utils/useSheetDragDismiss'
import AppButton from './ui/AppButton'
import SurfaceCard from './ui/SurfaceCard'
import StreakFlame from './StreakFlame'
import LuupiIcon from './ui/LuupiIcon'

const HERO_COPY: Record<FlameState, { eyebrow: string; message: string }> = {
  lit: { eyebrow: 'Alev yanıyor', message: 'Bugünkü ritmini tamamladın. Serin güvende.' },
  pending: { eyebrow: 'Bugün seni bekliyor', message: 'Bir alışkanlık tamamla ve alevi yarına taşı.' },
  frozen: { eyebrow: 'Seri korundu', message: 'Dondurma hakkın devreye girdi. Bugün alevi yeniden yak.' },
  out: { eyebrow: 'Yeni bir başlangıç', message: 'Bugün bir alışkanlık tamamla ve ilk kıvılcımı yak.' },
}

const DAY_LABELS: Record<StreakDayState, string> = {
  done: 'aktif',
  frozen: 'donduruldu',
  missed: 'kaçırıldı',
  pending: 'bugün bekliyor',
  future: 'gelecek gün',
  'before-tracking': 'takip başlamamıştı',
}

function monthIndex(year: number, month: number): number {
  return year * 12 + month
}

function dayParts(date: string): { dayNumber: number; weekday: string } {
  const [year, month, day] = date.split('-').map(Number)
  const weekdayIndex = (new Date(year, month - 1, day).getDay() + 6) % 7
  return { dayNumber: day, weekday: TR_DAY_SHORTS[weekdayIndex] }
}

export default function StreakModal({ onClose }: { onClose: () => void }) {
  const { profile, logs } = useApp()
  const { isExiting, close } = useModalDismiss(onClose)
  const today = todayStr()
  const yesterday = yesterdayStr()
  const [todayYear, todayMonth] = today.split('-').map(Number)
  const [viewYear, setViewYear] = useState(todayYear)
  const [viewMonth, setViewMonth] = useState(todayMonth - 1)
  const [monthDirection, setMonthDirection] = useState<'previous' | 'next'>('next')
  const [showRules, setShowRules] = useState(false)
  const [rulesExiting, setRulesExiting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const rulesCloseRef = useRef<HTMLButtonElement>(null)
  const pointerRef = useRef<PointerGestureSession | null>(null)
  const rulesTimerRef = useRef<number | null>(null)

  const flame = getFlameState(profile, today, yesterday)
  const shownStreak = useCountUp(profile.streak, 800)
  const freezes = getFreezes(profile)
  const progress = getFreezeProgress(profile)
  const heroCopy = HERO_COPY[flame]
  const activeDates = useMemo(() => getStreakActiveDates(profile, logs, today), [profile, logs, today])
  const trackingStart = useMemo(() => getStreakTrackingStart(profile, logs, today), [profile, logs, today])
  const week = useMemo(() => buildStreakWeek(profile, logs, today), [profile, logs, today])
  const monthDays = useMemo(
    () => buildStreakMonth(profile, logs, viewYear, viewMonth, today),
    [profile, logs, viewYear, viewMonth, today],
  )

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => {
      setMounted(true)
      closeRef.current?.focus()
      void hapticEvent('control')
    })
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusScope = panelRef.current?.querySelector<HTMLElement>('.streak-rules__panel') ?? panelRef.current
      const focusable = Array.from(focusScope?.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]') ?? [])
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
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      window.cancelAnimationFrame(frame)
      if (rulesTimerRef.current !== null) window.clearTimeout(rulesTimerRef.current)
      document.removeEventListener('keydown', trapFocus)
      previous?.focus()
    }
  }, [])

  useEffect(() => {
    if (showRules) window.requestAnimationFrame(() => rulesCloseRef.current?.focus())
  }, [showRules])

  const [trackingYear, trackingMonth] = trackingStart.split('-').map(Number)
  const viewedIndex = monthIndex(viewYear, viewMonth)
  const firstIndex = monthIndex(trackingYear, trackingMonth - 1)
  const currentIndex = monthIndex(todayYear, todayMonth - 1)
  const canGoPrevious = viewedIndex > firstIndex
  const canGoNext = viewedIndex < currentIndex

  const changeMonth = (delta: -1 | 1) => {
    if ((delta < 0 && !canGoPrevious) || (delta > 0 && !canGoNext)) return
    const next = new Date(viewYear, viewMonth + delta, 1)
    setMonthDirection(delta < 0 ? 'previous' : 'next')
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
    void hapticEvent('selection')
  }

  const onMonthPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const captureTarget = event.target instanceof HTMLElement ? event.target : event.currentTarget
    pointerRef.current = beginPointerGesture(event, captureTarget)
  }

  const onMonthPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId) return
    const update = updatePointerGesture(pointer, event, 1.2)
    if (update?.axis === 'vertical') pointerRef.current = null
  }

  const onMonthPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    pointerRef.current = null
    if (!pointer || pointer.pointerId !== event.pointerId) return
    finishPointerGesture(pointer)
    const deltaX = event.clientX - pointer.startX
    if (pointer.axis !== 'horizontal' || Math.abs(deltaX) < 48) return
    changeMonth(deltaX > 0 ? -1 : 1)
  }

  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const totalActiveDays = [...activeDates].filter((date) => date <= today).length
  const activeThisMonth = monthDays.filter((day) => day.state === 'done').length
  const protectedThisMonth = monthDays.filter((day) => day.state === 'frozen').length
  const progressPct = freezes >= MAX_STREAK_FREEZES ? 100 : (progress / FREEZE_EARN_DAYS) * 100
  const openRules = () => {
    setRulesExiting(false)
    setShowRules(true)
    void hapticEvent('control')
  }
  const closeRules = () => {
    if (rulesExiting) return
    setRulesExiting(true)
    rulesTimerRef.current = window.setTimeout(() => {
      setShowRules(false)
      setRulesExiting(false)
      rulesTimerRef.current = null
      panelRef.current?.querySelector<HTMLElement>('.streak-freeze-card')?.focus()
    }, 220)
  }
  const rulesDrag = useSheetDragDismiss(closeRules)
  const closeRulesFromEffect = useEffectEvent(closeRules)

  useEffect(() => {
    if (!showRules) return
    const closeRulesOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      closeRulesFromEffect()
    }
    document.addEventListener('keydown', closeRulesOnEscape, true)
    return () => document.removeEventListener('keydown', closeRulesOnEscape, true)
  }, [showRules])

  return createPortal(
    <div className={`streak-experience streak-experience--${flame}`} role="dialog" aria-modal="true" aria-labelledby="streak-experience-title">
      <button type="button" className={`streak-experience__scrim ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={close} aria-label="Seri ekranını kapat" />
      <section ref={panelRef} className={`streak-experience__panel ${isExiting ? 'streak-experience__panel--exit' : 'streak-experience__panel--enter'}`}>
        <header className="streak-experience__topbar">
          <div>
            <span>Luupi ritmi</span>
            <h1 id="streak-experience-title">Seri merkezi</h1>
          </div>
          <AppButton ref={closeRef} tone="quiet" size="sm" haptic="light" className="streak-experience__close" onClick={close} aria-label="Kapat">×</AppButton>
        </header>

        <div className="streak-experience__scroll">
          <section className="streak-hero">
            <span className="streak-hero__halo" aria-hidden />
            <span className="streak-hero__spark streak-hero__spark--one" aria-hidden />
            <span className="streak-hero__spark streak-hero__spark--two" aria-hidden />
            <span className="streak-hero__spark streak-hero__spark--three" aria-hidden />
            <div className="streak-hero__flame" aria-hidden>
              <StreakFlame state={flame} size={126} />
            </div>
            <div className="streak-hero__number">
              <strong>{shownStreak}</strong>
              <span>günlük seri</span>
            </div>
            <div className="streak-hero__message">
              <strong>{heroCopy.eyebrow}</strong>
              <p>{heroCopy.message}</p>
            </div>

            <div className="streak-week" aria-label="Son 7 günün seri durumu">
              {week.map((day) => {
                const parts = dayParts(day.date)
                return (
                  <div key={day.date} className={`streak-week__day streak-week__day--${day.state} ${day.date === today ? 'is-today' : ''}`} aria-label={`${parts.weekday} ${parts.dayNumber}: ${DAY_LABELS[day.state]}`}>
                    <span>{parts.weekday}</span>
                  <i aria-hidden>{day.state === 'done' ? <LuupiIcon name="flame" size={18} /> : day.state === 'frozen' ? <LuupiIcon name="snowflake" size={18} /> : day.state === 'missed' ? '×' : parts.dayNumber}</i>
                  </div>
                )
              })}
            </div>
          </section>

          <SurfaceCard variant="raised" className="streak-metrics" aria-label="Seri istatistikleri">
            <div><span>En uzun seri</span><strong>{profile.longestStreak}<small> gün</small></strong></div>
            <div><span>Toplam aktif</span><strong>{totalActiveDays}<small> gün</small></strong></div>
            <div><span>{trMonthName(viewMonth)}</span><strong>{activeThisMonth}<small> aktif</small></strong></div>
          </SurfaceCard>

          <SurfaceCard
            variant="raised"
            interactive
            className="streak-freeze-card"
            onClick={openRules}
            aria-expanded={showRules}
            aria-label={`Seri dondurma. ${freezes}/${MAX_STREAK_FREEZES} hakkın var. Kuralları aç.`}
          >
            <div className="streak-freeze-card__heading">
              <div>
                <span>Koruma kasası</span>
                <h2>Seri Dondurma</h2>
              </div>
              <strong>{freezes}/{MAX_STREAK_FREEZES}</strong>
            </div>
            <div className="streak-freeze-card__slots" aria-hidden>
              {Array.from({ length: MAX_STREAK_FREEZES }, (_, index) => (
                <span key={index} className={index < freezes ? 'is-filled' : ''}>{index < freezes ? <LuupiIcon name="snowflake" size={16} /> : ''}</span>
              ))}
            </div>
            <div className="streak-freeze-card__progress-copy">
              <span>{freezes >= MAX_STREAK_FREEZES ? 'Kasan dolu, ilerlemen bekliyor' : 'Yeni hakka ilerleme'}</span>
              <strong>{freezes >= MAX_STREAK_FREEZES ? 'Hazır' : `${progress}/${FREEZE_EARN_DAYS} gün`}</strong>
            </div>
            <div className="streak-freeze-card__track" aria-hidden>
              <span style={{ '--freeze-progress': mounted ? `${progressPct}%` : '0%' } as CSSProperties} />
            </div>
            <p>{protectedThisMonth > 0 ? `Bu ay ${protectedThisMonth} günün otomatik korundu.` : 'Bir günü kaçırdığında uygun hakkın serini otomatik korur.'}</p>
            <small>Nasıl çalıştığını gör <b>→</b></small>
          </SurfaceCard>

          <SurfaceCard variant="raised" className="streak-month">
            <header className="streak-month__header">
              <AppButton tone="quiet" size="sm" haptic="none" onClick={() => changeMonth(-1)} disabled={!canGoPrevious} aria-label="Önceki ay">←</AppButton>
              <div><span>Aylık ritim</span><h2>{trMonthName(viewMonth)} {viewYear}</h2></div>
              <AppButton tone="quiet" size="sm" haptic="none" onClick={() => changeMonth(1)} disabled={!canGoNext} aria-label="Sonraki ay">→</AppButton>
            </header>
            <div
              className="streak-month__viewport"
              onPointerDown={onMonthPointerDown}
              onPointerMove={onMonthPointerMove}
              onPointerUp={onMonthPointerUp}
              onPointerCancel={() => {
                finishPointerGesture(pointerRef.current)
                pointerRef.current = null
              }}
              onLostPointerCapture={(event) => {
                if (pointerRef.current?.pointerId === event.pointerId) pointerRef.current = null
              }}
            >
              <div key={`${viewYear}-${viewMonth}`} className={`streak-month__body streak-month__body--${monthDirection}`}>
                <div className="streak-month__weekdays" aria-hidden>{TR_DAY_SHORTS.map((day) => <span key={day}>{day}</span>)}</div>
                <div className="streak-month__grid" aria-label={`${trMonthName(viewMonth)} ${viewYear} seri takvimi`}>
                  {Array.from({ length: firstDay }).map((_, index) => <span key={`empty-${index}`} />)}
                  {monthDays.map((day) => {
                    const dayNumber = Number(day.date.slice(-2))
                    return (
                      <span key={day.date} className={`streak-month__day streak-month__day--${day.state} ${day.date === today ? 'is-today' : ''}`} role="img" aria-label={`${dayNumber} ${trMonthName(viewMonth)}: ${DAY_LABELS[day.state]}`}>
                    {day.state === 'done' ? <b><LuupiIcon name="flame" size={16} /></b> : day.state === 'frozen' ? <b><LuupiIcon name="snowflake" size={16} /></b> : day.state === 'missed' ? <b>×</b> : dayNumber}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="streak-month__legend">
              <span><i className="is-active" />Aktif</span>
              <span><i className="is-frozen" />Korundu</span>
              <span><i className="is-missed" />Kaçırıldı</span>
              <span><i className="is-pending" />Bugün</span>
            </div>
            <p>Aylar arasında geçmek için takvimi yana kaydırabilirsin.</p>
          </SurfaceCard>
        </div>

        {showRules && (
          <div className={`streak-rules ${rulesExiting ? 'is-exiting' : ''}`} role="dialog" aria-labelledby="streak-rules-title">
            <button type="button" className="streak-rules__scrim" onClick={closeRules} aria-label="Kuralları kapat" />
            <section style={rulesDrag.surfaceStyle} className={`streak-rules__panel ${rulesDrag.surfaceClassName}`}>
              <span className="streak-rules__handle sheet-drag-handle" {...rulesDrag.handleProps} />
              <header><div><span>Koruma sistemi</span><h2 id="streak-rules-title">Seri Dondurma nasıl çalışır?</h2></div><AppButton ref={rulesCloseRef} tone="quiet" size="sm" haptic="light" onClick={closeRules} aria-label="Kapat">×</AppButton></header>
              <div className="streak-rules__list">
              <div><i><LuupiIcon name="flame" size={18} /></i><p>Günün ilk alışkanlık tamamlaması seriyi bir gün ilerletir.</p></div>
              <div><i><LuupiIcon name="snowflake" size={18} /></i><p>Kaçırılan bir gün için bir hak otomatik harcanır ve seri korunur.</p></div>
                <div><i>7</i><p>Her {FREEZE_EARN_DAYS} kesintisiz aktif günde yeni bir dondurma hakkı kazanırsın.</p></div>
                <div><i>3</i><p>Kasanda en fazla {MAX_STREAK_FREEZES} hak tutabilirsin. Kasa doluyken ilerleme bekler.</p></div>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>,
    document.body,
  )
}
