import { createPortal } from 'react-dom'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type UIEvent,
} from 'react'
import type { DashboardHabitEntry } from './HabitSwipeDeck'
import { clampResultIndex, resultIndexAfterRemoval } from '../../utils/dashboardResults'
import { getHabitCardShape, normalizeHabitCardColor } from '../../utils/habitCard'
import { hapticEvent } from '../../utils/haptics'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import AppButton from '../ui/AppButton'
import LuupiIcon from '../ui/LuupiIcon'

export interface DashboardResultEntry extends DashboardHabitEntry {
  status: 'completed' | 'skipped'
  resolvedAt: string
}

export interface ResultOpenOrigin {
  top: number
  left: number
  width: number
  height: number
}

interface ResultVisualProperties extends CSSProperties {
  '--result-seed': string
}

interface ResultMorphProperties extends CSSProperties {
  '--result-origin-x': string
  '--result-origin-y': string
  '--result-origin-scale-x': number
  '--result-origin-scale-y': number
}

const resultTimeFormatter = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

function resultVisualStyle(entry: DashboardResultEntry): ResultVisualProperties {
  return {
    '--result-seed': normalizeHabitCardColor(entry.habit.labelColor || entry.category?.color),
  }
}

function statusLabel(entry: DashboardResultEntry): string {
  return entry.status === 'completed' ? 'Tamamlandı' : 'Bugün atlandı'
}

function resultTime(entry: DashboardResultEntry): string {
  return resultTimeFormatter.format(new Date(entry.resolvedAt))
}

function ResultStatus({ entry, compact = false }: { entry: DashboardResultEntry; compact?: boolean }) {
  return (
    <span className={`result-status result-status--${entry.status} ${compact ? 'result-status--compact' : ''}`}>
      <span aria-hidden>{entry.status === 'completed' ? '✓' : '×'}</span>
      {!compact && <strong>{statusLabel(entry)}</strong>}
    </span>
  )
}

export function MiniResultDeck({
  entries,
  onOpen,
}: {
  entries: DashboardResultEntry[]
  onOpen: (origin?: ResultOpenOrigin) => void
}) {
  const deckRef = useRef<HTMLButtonElement>(null)
  if (entries.length === 0) return null
  const visible = entries.slice(0, 3)
  const completedCount = entries.filter((entry) => entry.status === 'completed').length
  const skippedCount = entries.length - completedCount

  const open = () => {
    const rect = deckRef.current?.querySelector<HTMLElement>('.result-mini-card--front')?.getBoundingClientRect()
    onOpen(rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : undefined)
  }

  return (
    <section className="dashboard-results-preview">
      <div className="dashboard-results-preview__heading">
        <div>
          <span className="type-caption uppercase tracking-[0.14em]">Bugünün sonuçları</span>
          <p>{completedCount} tamamlandı · {skippedCount} atlandı</p>
        </div>
        <span className="dashboard-results-preview__affordance">Tümünü gör <b>→</b></span>
      </div>

      <button ref={deckRef} type="button" className="result-shelf" onClick={open} aria-label={`Bugünün ${entries.length} sonucunu aç`}>
        <span className="result-shelf__well" aria-hidden />
        {visible.slice().reverse().map((entry, reverseIndex) => {
          const depth = visible.length - 1 - reverseIndex
          const shape = getHabitCardShape(entry.habit.id)
          return (
            <span
              key={entry.habit.id}
              className={`result-mini-card result-mini-card--${entry.status} ${depth === 0 ? 'result-mini-card--front' : ''}`}
              style={{ ...resultVisualStyle(entry), '--result-depth': depth } as CSSProperties}
            >
              <span className="result-mini-card__topline">
                <span><LuupiIcon name={entry.category?.icon ?? 'sparkles'} size={14} /> {entry.category?.name ?? 'Alışkanlık'}</span>
                <ResultStatus entry={entry} compact />
              </span>
              <span className="result-mini-card__body">
                <span className={`result-mini-card__totem result-mini-card__totem--${shape}`} aria-hidden><LuupiIcon name={entry.habit.icon} size={32} /></span>
                <span className="result-mini-card__copy">
                  <strong>{entry.habit.name}</strong>
                  <small>{statusLabel(entry)} · {resultTime(entry)}</small>
                </span>
              </span>
            </span>
          )
        })}
        <span className="result-shelf__summary">
          <span>{entries.length > 3 ? `+${entries.length - 3}` : entries.length}</span>
          <small>kayıt</small>
        </span>
      </button>
    </section>
  )
}

export function DashboardResultsSheet({
  entries,
  origin,
  onClose,
  onUndo,
}: {
  entries: DashboardResultEntry[]
  origin?: ResultOpenOrigin | null
  onClose: () => void
  onUndo: (habitId: string) => void
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const [activeIndex, setActiveIndex] = useState(0)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [morphStyle, setMorphStyle] = useState<ResultMorphProperties | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const activeIndexRef = useRef(0)
  const lastHapticIndexRef = useRef(0)
  const scrollFrameRef = useRef<number | null>(null)
  const settleTimerRef = useRef<number | null>(null)
  const undoTimerRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (!origin || !cardRefs.current[0]) return
    const target = cardRefs.current[0].getBoundingClientRect()
    const originCenterX = origin.left + origin.width / 2
    const originCenterY = origin.top + origin.height / 2
    const targetCenterX = target.left + target.width / 2
    const targetCenterY = target.top + target.height / 2
    setMorphStyle({
      '--result-origin-x': `${originCenterX - targetCenterX}px`,
      '--result-origin-y': `${originCenterY - targetCenterY}px`,
      '--result-origin-scale-x': Math.max(0.25, origin.width / target.width),
      '--result-origin-scale-y': Math.max(0.25, origin.height / target.height),
    })
  }, [origin])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'))
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
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', trapFocus)
      previousFocus?.focus()
    }
  }, [])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    const nextIndex = clampResultIndex(activeIndexRef.current, entries.length)
    activeIndexRef.current = nextIndex
    setActiveIndex(nextIndex)
    window.requestAnimationFrame(() => cardRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }))
  }, [entries.length])

  useEffect(() => {
    const moveWithKeyboard = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const delta = event.key === 'ArrowRight' ? 1 : -1
      const nextIndex = clampResultIndex(activeIndexRef.current + delta, entries.length)
      cardRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
    document.addEventListener('keydown', moveWithKeyboard)
    return () => document.removeEventListener('keydown', moveWithKeyboard)
  }, [entries.length])

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current)
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current)
  }, [])

  const onRailScroll = (event: UIEvent<HTMLDivElement>) => {
    if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current)
    const rail = event.currentTarget
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const center = rail.getBoundingClientRect().left + rail.clientWidth / 2
      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY
      cardRefs.current.forEach((card, index) => {
        if (!card) return
        const rect = card.getBoundingClientRect()
        const distance = Math.abs(rect.left + rect.width / 2 - center)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })
      if (closestIndex !== activeIndexRef.current) {
        activeIndexRef.current = closestIndex
        setActiveIndex(closestIndex)
      }
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = window.setTimeout(() => {
        if (lastHapticIndexRef.current === activeIndexRef.current) return
        lastHapticIndexRef.current = activeIndexRef.current
        void hapticEvent('selection')
      }, 110)
    })
  }

  const scrollToIndex = (index: number) => {
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const undo = (habitId: string) => {
    if (removingId) return
    const removedIndex = entries.findIndex((entry) => entry.habit.id === habitId)
    const nextIndex = resultIndexAfterRemoval(activeIndexRef.current, removedIndex, entries.length)
    setRemovingId(habitId)
    undoTimerRef.current = window.setTimeout(() => {
      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
      onUndo(habitId)
      setRemovingId(null)
    }, 220)
  }

  const activeEntry = entries[activeIndex]

  return createPortal(
    <div className="dashboard-results-sheet" role="dialog" aria-modal="true" aria-labelledby="dashboard-results-title">
      <button type="button" className={`dashboard-results-sheet__scrim ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={close} aria-label="Kapat" />
      <section ref={panelRef} style={sheetDrag.surfaceStyle} className={`dashboard-results-sheet__panel ${sheetDrag.surfaceClassName} ${isExiting ? 'dashboard-results-sheet__panel--exit' : 'dashboard-results-sheet__panel--enter'}`}>
        <span className="dashboard-results-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="dashboard-results-sheet__header">
          <div>
            <span className="type-caption uppercase tracking-[0.14em]">Bugünün ritmi</span>
            <h2 id="dashboard-results-title" className="type-section-title mt-1">Sonuçlar</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="dashboard-results-sheet__close" onClick={close} aria-label="Kapat">×</button>
        </header>

        <div ref={railRef} className="dashboard-results-sheet__rail" onScroll={onRailScroll} aria-label="Sonuç kartları">
          {entries.map((entry, index) => {
            const shape = getHabitCardShape(entry.habit.id)
            const isActive = index === activeIndex
            const isFirst = index === 0
            return (
              <article
                ref={(node) => { cardRefs.current[index] = node }}
                key={entry.habit.id}
                className={`result-detail-card result-detail-card--${entry.status} ${isActive ? 'result-detail-card--active' : 'result-detail-card--neighbor'} ${removingId === entry.habit.id ? 'result-detail-card--removing' : ''} ${isFirst && morphStyle ? isExiting ? 'result-detail-card--returning' : 'result-detail-card--growing' : ''}`}
                style={{ ...resultVisualStyle(entry), ...(isFirst ? morphStyle ?? {} : {}) }}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`${entry.habit.name}, ${statusLabel(entry)}, saat ${resultTime(entry)}`}
              >
                <div className="result-detail-card__topline">
                  <span><LuupiIcon name={entry.category?.icon ?? 'sparkles'} size={14} /> {entry.category?.name ?? 'Alışkanlık'}</span>
                  <ResultStatus entry={entry} />
                </div>
                <div className="result-detail-card__stage" aria-hidden>
                  <span className="result-detail-card__ground" />
                  <span className={`result-detail-card__totem result-detail-card__totem--${shape}`}><LuupiIcon name={entry.habit.icon} size={48} /></span>
                </div>
                <div className="result-detail-card__copy">
                  <h3>{entry.habit.name}</h3>
                  <p>{statusLabel(entry)} · {resultTime(entry)}</p>
                </div>
                <AppButton tone="secondary" size="sm" block disabled={Boolean(removingId)} onClick={() => undo(entry.habit.id)}>
                  Ana desteye geri al
                </AppButton>
              </article>
            )
          })}
        </div>

        <div className="dashboard-results-sheet__pagination" aria-label={`${activeIndex + 1} / ${entries.length}`}>
          {entries.map((entry, index) => (
            <button
              key={entry.habit.id}
              type="button"
              className={index === activeIndex ? 'is-active' : ''}
              onClick={() => scrollToIndex(index)}
              aria-label={`${index + 1}. sonuca git`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
        <div className="dashboard-results-sheet__footer">
          <span>{activeEntry ? statusLabel(activeEntry) : 'Sonuç'}</span>
          <strong>{activeIndex + 1} / {entries.length}</strong>
        </div>
      </section>
    </div>,
    document.body,
  )
}
