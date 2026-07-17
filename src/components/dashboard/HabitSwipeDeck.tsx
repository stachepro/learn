import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import type { Category, Habit, HabitDayStatus, HabitLog } from '../../types'
import { getHabitGoal, getHabitMode, getHabitTimeOfDay } from '../../types'
import {
  applySwipeResistance,
  getHabitCardShape,
  getSwipeThreshold,
  normalizeHabitCardColor,
  resolveSwipeDecision,
  type SwipeDecision,
} from '../../utils/habitCard'
import { hapticEvent } from '../../utils/haptics'
import { motionMs } from '../../utils/motion'
import {
  beginPointerGesture,
  finishPointerGesture,
  updatePointerGesture,
  type PointerGestureSession,
} from '../../utils/pointerGesture'
import { showToast } from '../../utils/toast'
import { useReducedMotion } from '../../utils/useReducedMotion'
import LuupiIcon from '../ui/LuupiIcon'

export interface DashboardHabitEntry {
  habit: Habit
  log: HabitLog
  category?: Category
  windowExpired?: boolean
}

interface Props {
  entries: DashboardHabitEntry[]
  onResolve: (habitId: string, status: HabitDayStatus) => void
}

const TIME_LABELS = {
  morning: 'Sabah',
  afternoon: 'Öğle',
  evening: 'Akşam',
  any: 'Gün içinde',
} as const

function cardMeta(entry: DashboardHabitEntry): string {
  const { habit, log, category } = entry
  const mode = getHabitMode(habit)
  const goal = getHabitGoal(habit)
  if (mode === 'multi' && goal > 0) return `${log.completionCount ?? 0}/${goal} tekrar · ${category?.name ?? TIME_LABELS[getHabitTimeOfDay(habit)]}`
  if (mode === 'pomodoro' && goal > 0) return `${log.pomodoroSessions.length}/${goal} pomodoro · ${category?.name ?? 'Odak'}`
  if (habit.timeWindow) return `${habit.timeWindow.start}–${habit.timeWindow.end} · ${category?.name ?? TIME_LABELS[getHabitTimeOfDay(habit)]}`
  return `${category?.name ?? 'Alışkanlık'} · ${TIME_LABELS[getHabitTimeOfDay(habit)]}`
}

function timingLabel(entry: DashboardHabitEntry): string {
  if (entry.windowExpired) return 'Zamanı geçti'
  if (entry.habit.timeWindow) return `${entry.habit.timeWindow.start}–${entry.habit.timeWindow.end}`
  return TIME_LABELS[getHabitTimeOfDay(entry.habit)]
}

function baseVisualStyle(entry: DashboardHabitEntry): CSSProperties {
  return {
    '--habit-seed': normalizeHabitCardColor(entry.habit.labelColor || entry.category?.color),
  } as CSSProperties
}

function CardFace({ entry }: { entry: DashboardHabitEntry }) {
  const shape = getHabitCardShape(entry.habit.id)
  return (
    <div className="habit-totem-card__content">
      <header className="habit-totem-card__topline">
        <span className="habit-totem-card__category">
          <span aria-hidden><LuupiIcon name={entry.category?.icon ?? 'sparkles'} size={16} /></span>
          {entry.category?.name ?? 'Alışkanlık'}
        </span>
        <span className={`habit-totem-card__timing ${entry.windowExpired ? 'habit-totem-card__timing--late' : ''}`}>
          {timingLabel(entry)}
        </span>
      </header>

      <div className="habit-totem-card__copy">
        <h2>{entry.habit.name}</h2>
        <p>{cardMeta(entry)}</p>
      </div>

      <div className="habit-totem-card__stage" aria-hidden>
        <span className="habit-totem-card__ground" />
        <span className={`habit-totem habit-totem--${shape}`}>
          <span className="habit-totem__shine" />
          <span className="habit-totem__emoji"><LuupiIcon name={entry.habit.icon} size={48} /></span>
          <span className="habit-totem__dot habit-totem__dot--one" />
          <span className="habit-totem__dot habit-totem__dot--two" />
        </span>
      </div>
    </div>
  )
}

function TotemCard({
  entry,
  index,
  total,
  interactionId,
  onResolve,
  onInteractionStart,
  onInteractionEnd,
  reducedMotion,
}: {
  entry: DashboardHabitEntry
  index: number
  total: number
  interactionId: string | null
  onResolve: Props['onResolve']
  onInteractionStart: (habitId: string) => void
  onInteractionEnd: (habitId: string) => void
  reducedMotion: boolean
}) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [committing, setCommitting] = useState<SwipeDecision | null>(null)
  const pointerRef = useRef<PointerGestureSession | null>(null)
  const dragXRef = useRef(0)
  const cardWidthRef = useRef(360)
  const thresholdRef = useRef(getSwipeThreshold(360))
  const thresholdHitRef = useRef(false)
  const commitTimerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current)
  }, [])

  const setPosition = (nextX: number) => {
    dragXRef.current = nextX
    setDragX(nextX)
  }

  const commit = (status: SwipeDecision) => {
    if ((interactionId !== null && interactionId !== entry.habit.id) || committing) return
    onInteractionStart(entry.habit.id)
    const thresholdAlreadySignalled = thresholdHitRef.current
    const direction = status === 'completed' ? 1 : -1
    setCommitting(status)
    setDragging(false)
    setPosition(direction * (cardWidthRef.current + 140))
    commitTimerRef.current = window.setTimeout(() => {
      onInteractionEnd(entry.habit.id)
      onResolve(entry.habit.id, status)
      showToast({
        tone: status === 'completed' ? 'success' : 'warning',
        contextIcon: <LuupiIcon name={entry.habit.icon} size={16} />,
        title: status === 'completed' ? 'Bugün tamamlandı' : 'Bugün atlandı',
        message: entry.habit.name,
        haptic: thresholdAlreadySignalled ? 'none' : undefined,
        action: { label: 'Geri Al', onPress: () => onResolve(entry.habit.id, 'pending') },
      })
    }, motionMs('result', reducedMotion))
  }

  const resetPosition = () => {
    finishPointerGesture(pointerRef.current)
    pointerRef.current = null
    thresholdHitRef.current = false
    setDragging(false)
    setPosition(0)
    onInteractionEnd(entry.habit.id)
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if ((interactionId !== null && interactionId !== entry.habit.id) || committing) return
    const pointer = beginPointerGesture(event)
    if (!pointer) return
    onInteractionStart(entry.habit.id)
    cardWidthRef.current = event.currentTarget.getBoundingClientRect().width
    thresholdRef.current = getSwipeThreshold(cardWidthRef.current)
    pointerRef.current = pointer
    thresholdHitRef.current = false
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId || committing) return
    const update = updatePointerGesture(pointer, event)
    if (!update) return
    if (update.axis === 'vertical') {
      pointerRef.current = null
      thresholdHitRef.current = false
      setDragging(false)
      setPosition(0)
      onInteractionEnd(entry.habit.id)
      return
    }
    if (update.previousAxis === 'pending' && update.axis === 'horizontal') {
      setDragging(true)
    }
    if (update.axis !== 'horizontal') return
    const nextX = applySwipeResistance(update.deltaX, thresholdRef.current, cardWidthRef.current)
    setPosition(nextX)
    if (Math.abs(nextX) >= thresholdRef.current && !thresholdHitRef.current) {
      thresholdHitRef.current = true
      void hapticEvent('gesture-threshold')
    }
  }

  const onPointerEnd = (event: PointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId || committing) return
    pointerRef.current = null
    finishPointerGesture(pointer)
    setDragging(false)
    if (pointer.axis !== 'horizontal') {
      resetPosition()
      return
    }
    const decision = resolveSwipeDecision(dragXRef.current, pointer.velocityX, thresholdRef.current)
    if (decision) commit(decision)
    else resetPosition()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      commit('completed')
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      commit('skipped')
    }
  }

  const progress = Math.min(1, Math.abs(dragX) / thresholdRef.current)
  const direction = Math.sign(dragX)
  const rotation = Math.max(-7, Math.min(7, (dragX / cardWidthRef.current) * 18))

  return (
    <div
      className={`habit-stack__slot ${direction > 0 ? 'habit-stack__slot--done' : direction < 0 ? 'habit-stack__slot--skip' : ''} ${committing ? 'habit-stack__slot--committing' : ''}`}
      style={{
        '--stack-index': index + 1,
        '--deck-progress': progress,
      } as CSSProperties}
    >
      <div className="habit-stack__plane">
        <div className="habit-stack-action-layer" aria-hidden>
          <div className="habit-stack-action habit-stack-action--done">
            <span>✓</span>
            <strong>Tamamla</strong>
          </div>
          <div className="habit-stack-action habit-stack-action--skip">
            <strong>Bugün atla</strong>
            <span>×</span>
          </div>
        </div>

        <article
          className={`habit-totem-card habit-totem-card--active ${dragging ? 'habit-totem-card--dragging' : ''} ${direction > 0 ? 'habit-totem-card--done' : direction < 0 ? 'habit-totem-card--skip' : ''} ${committing ? `habit-totem-card--exit-${committing}` : ''}`}
          style={{
            ...baseVisualStyle(entry),
            '--swipe-x': `${dragX}px`,
            '--swipe-progress': progress,
            '--swipe-direction': direction,
            '--swipe-rotation': `${rotation}deg`,
          } as CSSProperties}
          tabIndex={0}
          role="listitem"
          aria-posinset={index + 1}
          aria-setsize={total}
          aria-keyshortcuts="ArrowLeft ArrowRight"
          aria-label={`${entry.habit.name}. ${index + 1}/${total}. Sağa kaydırarak tamamla, sola kaydırarak bugün atla. Klavyede sağ ve sol ok tuşlarını kullanabilirsin.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={resetPosition}
          onLostPointerCapture={(event) => {
            if (pointerRef.current?.pointerId === event.pointerId) resetPosition()
          }}
          onKeyDown={onKeyDown}
        >
          <span className="habit-totem-card__status-wash" aria-hidden />
          <span className="habit-totem-card__edge" aria-hidden />
          <CardFace entry={entry} />
        </article>
      </div>
    </div>
  )
}

export default function HabitSwipeDeck({ entries, onResolve }: Props) {
  const [interactionId, setInteractionId] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (interactionId && !entries.some(({ habit }) => habit.id === interactionId)) setInteractionId(null)
  }, [entries, interactionId])

  const endInteraction = (habitId: string) => {
    setInteractionId((current) => current === habitId ? null : current)
  }

  return (
    <section
      className="habit-stack"
      aria-label="Bugünün aktif alışkanlıkları"
    >
      <div className="habit-stack__cards" role="list">
        {entries.map((entry, index) => (
          <TotemCard
            key={entry.habit.id}
            entry={entry}
            index={index}
            total={entries.length}
            interactionId={interactionId}
            onResolve={onResolve}
            onInteractionStart={setInteractionId}
            onInteractionEnd={endInteraction}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
      <div className="habit-stack__counter" aria-live="polite">
        <strong>{entries.length}</strong> alışkanlık karar bekliyor
      </div>
    </section>
  )
}
