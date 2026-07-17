import {
  useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type RefObject,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { usePomodoro } from '../../context/PomodoroContext'
import { formatSeconds, todayStr } from '../../utils/date'
import { hapticEvent } from '../../utils/haptics'
import { MOTION } from '../../utils/motion'
import { storage } from '../../utils/storage'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import ToolGlyph from './ToolGlyph'
import {
  FEATURED_TOOLS, SUPPORT_TOOLS, findToolByPath,
  type ToolDefinition, type ToolId,
} from './toolsCatalog'

interface Props {
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}

type StatusMap = Record<ToolId, string>

const CLOSE_MS = MOTION.sheetExit

function readJustStartStatus(): string {
  const state = storage.getJustStartState()
  if (!state || state.date !== todayStr()) return '1 dakikayla başla'
  const completed = state.done.filter(Boolean).length
  if (typeof state.active === 'number') {
    const remaining = state.paused
      ? state.pausedRemaining ?? 0
      : state.endAt === null ? 0 : Math.max(0, (state.endAt - Date.now()) / 1000)
    const stateLabel = state.paused ? 'Duraklatıldı' : `${state.active + 1}. adım sürüyor`
    return `${stateLabel} · ${formatSeconds(Math.ceil(remaining))}`
  }
  return completed > 0 ? `Bugün ${completed}/10 adım` : '1 dakikayla başla'
}

function phaseLabel(phase: ReturnType<typeof usePomodoro>['phase'], paused: boolean, time: string): string {
  if (phase === 'idle') return ''
  if (phase === 'work-done') return 'Mola vermeye hazır'
  if (phase === 'break-done') return 'Yeni tura hazır'
  if (paused) return `Duraklatıldı · ${time}`
  return phase === 'break' ? `Mola · ${time}` : `Odak sürüyor · ${time}`
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function FeatureCard({ tool, status, index, selected, onSelect }: {
  tool: ToolDefinition
  status: string
  index: number
  selected: boolean
  onSelect: (tool: ToolDefinition) => void
}) {
  return (
    <button
      type="button"
      className={`tools-feature-card tools-accent--${tool.accent} ${selected ? 'tools-item--selected' : ''}`}
      style={{ '--tools-item-index': index } as CSSProperties}
      onClick={() => onSelect(tool)}
      aria-label={`${tool.title}: ${status}`}
    >
      <span className="tools-feature-card__glyph"><ToolGlyph name={tool.icon} size={27} /></span>
      <span className="tools-feature-card__copy">
        <strong>{tool.title}</strong>
        <small>{status}</small>
      </span>
      <span className="tools-feature-card__arrow"><ArrowIcon /></span>
    </button>
  )
}

function LaunchRow({ tool, status, index, selected, onSelect }: {
  tool: ToolDefinition
  status: string
  index: number
  selected: boolean
  onSelect: (tool: ToolDefinition) => void
}) {
  return (
    <button
      type="button"
      className={`tools-launch-row tools-accent--${tool.accent} ${selected ? 'tools-item--selected' : ''}`}
      style={{ '--tools-item-index': index } as CSSProperties}
      onClick={() => onSelect(tool)}
      disabled={!tool.available}
      aria-label={tool.available ? `${tool.title}: ${status}` : `${tool.title}: Yenileniyor`}
    >
      <span className="tools-launch-row__glyph"><ToolGlyph name={tool.icon} size={22} /></span>
      <span className="tools-launch-row__copy">
        <strong>{tool.title}</strong>
        <small>{status}</small>
      </span>
      {tool.available
        ? <span className="tools-launch-row__arrow"><ArrowIcon /></span>
        : <span className="tools-launch-row__state">Yenileniyor</span>}
    </button>
  )
}

export default function ToolsHub({ onClose, returnFocusRef }: Props) {
  const navigate = useNavigate()
  const { logs, pomodoroSettings } = useApp()
  const pomodoro = usePomodoro()
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitingRef = useRef(false)
  const [exiting, setExiting] = useState(false)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const statuses = useMemo<StatusMap>(() => {
    const today = todayStr()
    const openTodos = storage.getTodos().filter((todo) => !todo.done && !todo.archivedAt).length
    const waterTotal = storage.getWaterEntries()
      .filter((entry) => entry.date === today)
      .reduce((sum, entry) => sum + entry.ml, 0)
    const waterGoal = storage.getWaterGoalForDate(today)
    const wake = storage.getWakeRecords().find((record) => record.date === today)
    const wakeGoal = storage.getWakeGoal()
    const monthPrefix = today.slice(0, 7)
    let monthCompletions = 0
    for (const [date, day] of Object.entries(logs)) {
      if (!date.startsWith(monthPrefix)) continue
      monthCompletions += Object.values(day.habits).filter((habit) => habit.completed).length
    }
    const pomodoroStatus = phaseLabel(pomodoro.phase, pomodoro.isPaused, pomodoro.displayTime)

    return {
      pomodoro: pomodoroStatus || `${pomodoroSettings.workDuration} dk odak seansı`,
      'just-start': readJustStartStatus(),
      todo: openTodos === 0 ? 'Liste temiz' : `${openTodos} açık görev`,
      water: `${waterTotal.toLocaleString('tr-TR')} / ${waterGoal.toLocaleString('tr-TR')} ml`,
      wake: wake ? `Bugün ${wake.time}` : wakeGoal ? `Hedef ${wakeGoal}` : 'Bugün kaydedilmedi',
      stats: monthCompletions === 0 ? 'Bu ayın ritmini gör' : `Bu ay ${monthCompletions} tamamlama`,
      'no-rush': 'Yeni deneyim hazırlanıyor',
    }
  }, [logs, pomodoro.displayTime, pomodoro.isPaused, pomodoro.phase, pomodoroSettings.workDuration])

  const recentTool = useMemo(() => {
    if (pomodoro.phase !== 'idle') return FEATURED_TOOLS[0]
    const saved = findToolByPath(storage.getLastToolPath())
    return saved?.available ? saved : null
  }, [pomodoro.phase])

  const completeClose = useCallback((afterClose?: () => void) => {
    if (exitingRef.current) return
    exitingRef.current = true
    setExiting(true)
    closeTimerRef.current = setTimeout(() => {
      afterClose?.()
      onClose()
    }, CLOSE_MS)
  }, [onClose])

  const handleClose = useCallback(() => {
    void hapticEvent('control')
    completeClose()
  }, [completeClose])
  const closeFromDrag = useCallback(() => completeClose(), [completeClose])
  const sheetDrag = useSheetDragDismiss(closeFromDrag)

  const handleSelect = useCallback((tool: ToolDefinition) => {
    if (!tool.available || exiting) return
    void hapticEvent('selection')
    setSelectedPath(tool.path)
    completeClose(() => {
      storage.setLastToolPath(tool.path)
      navigate(tool.path)
    })
  }, [completeClose, exiting, navigate])

  useEffect(() => {
    const scrollRoot = document.getElementById('app-scroll')
    const returnFocusTarget = returnFocusRef.current
    const previousOverflow = scrollRoot?.style.overflow ?? ''
    if (scrollRoot) scrollRoot.style.overflow = 'hidden'
    requestAnimationFrame(() => closeRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [])
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

    const onNavClose = () => handleClose()
    const onNavNavigate = (event: Event) => {
      const path = (event as CustomEvent<{ path?: string }>).detail?.path
      if (!path) {
        handleClose()
        return
      }
      completeClose(() => navigate(path))
    }

    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('luupi-tools-close', onNavClose)
    window.addEventListener('luupi-tools-navigate', onNavNavigate)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('luupi-tools-close', onNavClose)
      window.removeEventListener('luupi-tools-navigate', onNavNavigate)
      if (scrollRoot) scrollRoot.style.overflow = previousOverflow
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      requestAnimationFrame(() => returnFocusTarget?.focus())
    }
  }, [completeClose, handleClose, navigate, returnFocusRef])

  const continueLabel = recentTool?.id === 'pomodoro' && pomodoro.phase !== 'idle'
    ? 'Odak seansına dön'
    : recentTool ? `${recentTool.title} aracına dön` : ''

  return (
    <div className={`tools-hub-layer ${exiting ? 'tools-hub-layer--exit' : 'tools-hub-layer--enter'}`}>
      <button type="button" tabIndex={-1} className="tools-hub-scrim" onClick={handleClose} aria-label="Araçları kapat" />
      <section
        ref={panelRef}
        className={`tools-hub-panel ${sheetDrag.surfaceClassName} ${exiting ? 'tools-hub-panel--exit' : 'tools-hub-panel--enter'}`}
        style={sheetDrag.surfaceStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tools-hub-title"
      >
        <div
          className="tools-hub-grabber-zone"
          {...sheetDrag.handleProps}
        >
          <span className="tools-hub-grabber" />
        </div>

        <header className="tools-hub-header">
          <div className="tools-hub-title-wrap">
            <span className="tools-hub-title-mark" aria-hidden />
            <h2 id="tools-hub-title" className="type-page-title">Araçlar</h2>
          </div>
          <button ref={closeRef} type="button" className="app-icon-button tools-hub-close" onClick={handleClose} aria-label="Araçları kapat">
            <CloseIcon />
          </button>
        </header>

        <div className="tools-hub-content">
          {recentTool && (
            <button
              type="button"
              className={`tools-continue-card tools-accent--${recentTool.accent} ${selectedPath === recentTool.path ? 'tools-item--selected' : ''}`}
              onClick={() => handleSelect(recentTool)}
            >
              <span className="tools-continue-card__glyph"><ToolGlyph name={recentTool.icon} size={26} /></span>
              <span className="tools-continue-card__copy">
                <small>{pomodoro.phase !== 'idle' && recentTool.id === 'pomodoro' ? 'AKTİF ARAÇ' : 'SON KULLANILAN'}</small>
                <strong>{continueLabel}</strong>
                <span>{statuses[recentTool.id]}</span>
              </span>
              <span className="tools-continue-card__arrow"><ArrowIcon /></span>
            </button>
          )}

          <section className="tools-hub-section" aria-labelledby="quick-tools-title">
            <div className="tools-hub-section__header">
              <h3 id="quick-tools-title">Hızlı başlat</h3>
              <span>Odağını şimdi kur</span>
            </div>
            <div className="tools-feature-grid">
              {FEATURED_TOOLS.map((tool, index) => (
                <FeatureCard
                  key={tool.id}
                  tool={tool}
                  status={statuses[tool.id]}
                  index={index}
                  selected={selectedPath === tool.path}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </section>

          <section className="tools-hub-section" aria-labelledby="support-tools-title">
            <div className="tools-hub-section__header">
              <h3 id="support-tools-title">Günlük destek</h3>
              <span>Takip et, toparla, ilerle</span>
            </div>
            <div className="tools-launch-list">
              {SUPPORT_TOOLS.map((tool, index) => (
                <LaunchRow
                  key={tool.id}
                  tool={tool}
                  status={statuses[tool.id]}
                  index={index + FEATURED_TOOLS.length}
                  selected={selectedPath === tool.path}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
