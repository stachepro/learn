import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { ALL_BADGES } from '../../utils/badges'
import { runHaptic, type HapticFeedback } from '../../utils/haptics'
import { capturePointer, releasePointer } from '../../utils/pointerGesture'
import {
  enqueueToast,
  resolveToastDuration,
  TOAST_STALE_AFTER,
  ToastContext,
  type ToastOptions,
  type ToastQueueItem,
  type ToastTone,
} from '../../utils/toast'
import LuupiIcon from './LuupiIcon'

interface StreakEvent {
  type: 'freeze-used' | 'freeze-earned' | 'streak-lost'
  count?: number
  left?: number
}

interface ToastPointer {
  id: number
  startY: number
}

let toastSequence = 0

const toneDefaults: Record<ToastTone, { label: string; haptic: HapticFeedback }> = {
  success: { label: 'Başarılı', haptic: 'success' },
  info: { label: 'Bilgi', haptic: 'light' },
  warning: { label: 'Dikkat', haptic: 'warning' },
  reward: { label: 'Ödül', haptic: 'success' },
  error: { label: 'Hata', haptic: 'error' },
}

function FeedbackGlyph({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.4 3.4 7.7-8" /></svg>
  if (tone === 'info') return <svg viewBox="0 0 24 24"><path d="M12 10.8v6.1M12 7.1h.01" /><circle cx="12" cy="12" r="8.5" /></svg>
  if (tone === 'warning') return <svg viewBox="0 0 24 24"><path d="M12 8.2v5.2M12 16.8h.01M4.7 18.2 10.5 6a1.7 1.7 0 0 1 3 0l5.8 12.2a1.3 1.3 0 0 1-1.2 1.8H5.9a1.3 1.3 0 0 1-1.2-1.8Z" /></svg>
  if (tone === 'reward') return <svg viewBox="0 0 24 24"><path d="m12 3 1.7 5.2L19 10l-5.3 1.8L12 17l-1.7-5.2L5 10l5.3-1.8L12 3Z" /><path d="m18.5 15 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" /></svg>
  return <svg viewBox="0 0 24 24"><path d="M12 7.2v6.2M12 17h.01" /><circle cx="12" cy="12" r="8.5" /></svg>
}

function streakToast(event: StreakEvent): ToastOptions | null {
  if (event.type === 'freeze-used') {
    return {
      tone: 'info',
      contextIcon: <LuupiIcon name="snowflake" size={16} />,
      title: 'Serin korundu',
      message: `Kaçırdığın ${event.count === 1 ? 'gün' : `${event.count ?? 0} gün`} donduruldu · Kalan hak: ${event.left ?? 0}`,
      dedupeKey: 'streak-freeze-used',
    }
  }
  if (event.type === 'freeze-earned') {
    return {
      tone: 'reward',
      contextIcon: <LuupiIcon name="snowflake" size={16} />,
      title: 'Dondurma hakkı kazandın',
      message: `7 günlük istikrar ödülü · Toplam hak: ${event.left ?? 0}/3`,
      dedupeKey: 'streak-freeze-earned',
    }
  }
  if (event.type === 'streak-lost') {
    return {
      tone: 'warning',
      contextIcon: <LuupiIcon name="fog" size={16} />,
      title: 'Seri sıfırlandı',
      message: 'Bugün bir alışkanlık tamamlayarak alevi yeniden yakabilirsin.',
      dedupeKey: 'streak-lost',
    }
  }
  return null
}

function contextIcon(item: ToastQueueItem): ReactNode | null {
  const icon = item.contextIcon ?? item.icon
  if (typeof icon === 'string' && ['✓', '×', '!', 'i', '✦'].includes(icon)) return null
  return icon ?? null
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastQueueItem[]>([])
  const [leaving, setLeaving] = useState(false)
  const [paused, setPaused] = useState(false)
  const [dragY, setDragY] = useState(0)
  const current = queue[0]
  const currentRef = useRef<ToastQueueItem | undefined>(current)
  const exitTimerRef = useRef<number | null>(null)
  const removeTimerRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const remainingRef = useRef(0)
  const leavingRef = useRef(false)
  const pointerRef = useRef<ToastPointer | null>(null)
  const dragYRef = useRef(0)
  const draggedRef = useRef(false)
  const hoveredRef = useRef(false)
  const focusedRef = useRef(false)
  currentRef.current = current

  const clearExitTimer = () => {
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current)
    exitTimerRef.current = null
  }

  const dismiss = useCallback((id: string) => {
    if (leavingRef.current || currentRef.current?.id !== id) return
    leavingRef.current = true
    clearExitTimer()
    setPaused(false)
    setLeaving(true)
    removeTimerRef.current = window.setTimeout(() => {
      setQueue((existing) => existing.filter((toast) => toast.id !== id && Date.now() - toast.createdAt <= TOAST_STALE_AFTER))
      leavingRef.current = false
      setLeaving(false)
      setDragY(0)
      dragYRef.current = 0
      removeTimerRef.current = null
    }, 200)
  }, [])

  const startTimer = useCallback((id: string, duration: number) => {
    clearExitTimer()
    remainingRef.current = duration
    startedAtRef.current = Date.now()
    exitTimerRef.current = window.setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const pauseTimer = () => {
    if (!current || paused || leavingRef.current || exitTimerRef.current === null) return
    const elapsed = Date.now() - startedAtRef.current
    remainingRef.current = Math.max(120, remainingRef.current - elapsed)
    clearExitTimer()
    setPaused(true)
  }

  const resumeTimer = () => {
    if (!current || !paused || leavingRef.current || hoveredRef.current || focusedRef.current || pointerRef.current) return
    setPaused(false)
    startTimer(current.id, remainingRef.current)
  }

  const push = useCallback((options: ToastOptions) => {
    const tone = options.tone ?? 'success'
    const createdAt = Date.now()
    const id = options.id ?? `toast-${createdAt}-${toastSequence++}`
    const item: ToastQueueItem = {
      ...options,
      id,
      tone,
      createdAt,
      duration: resolveToastDuration({ ...options, tone }),
      dedupeKey: options.dedupeKey ?? options.id ?? `${tone}:${options.title}`,
    }
    setQueue((existing) => enqueueToast(existing, item, createdAt))
  }, [])

  useEffect(() => {
    if (!current) return
    leavingRef.current = false
    setLeaving(false)
    setPaused(false)
    setDragY(0)
    const defaults = toneDefaults[current.tone]
    if (current.haptic !== 'none') void runHaptic(current.haptic ?? defaults.haptic)
    startTimer(current.id, current.duration)
    return clearExitTimer
  }, [current, startTimer])

  useEffect(() => () => {
    clearExitTimer()
    if (removeTimerRef.current !== null) window.clearTimeout(removeTimerRef.current)
  }, [])

  useEffect(() => {
    const onToast = (event: Event) => push((event as CustomEvent<ToastOptions>).detail)
    const onBadge = (event: Event) => {
      const badge = ALL_BADGES.find((item) => item.id === (event as CustomEvent<string>).detail)
      if (!badge) return
      push({
        id: `badge-${badge.id}`,
        tone: 'reward',
        contextIcon: <LuupiIcon name={badge.icon} size={16} />,
        title: badge.name,
        message: badge.description,
      })
    }
    const onStreak = (event: Event) => {
      const options = streakToast((event as CustomEvent<StreakEvent>).detail)
      if (options) push(options)
    }

    window.addEventListener('luupi-toast', onToast)
    window.addEventListener('luupi-badge', onBadge)
    window.addEventListener('luupi-streak', onStreak)
    return () => {
      window.removeEventListener('luupi-toast', onToast)
      window.removeEventListener('luupi-badge', onBadge)
      window.removeEventListener('luupi-streak', onStreak)
    }
  }, [push])

  const value = useMemo(() => ({ showToast: push }), [push])
  const defaults = current ? toneDefaults[current.tone] : null

  const runAction = () => {
    if (!current?.action) return
    void runHaptic('light')
    current.action.onPress()
    dismiss(current.id)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary || (event.target as HTMLElement).closest('button')) return
    if (!capturePointer(event.currentTarget, event.pointerId)) return
    pointerRef.current = { id: event.pointerId, startY: event.clientY }
    draggedRef.current = false
    pauseTimer()
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    const distance = Math.min(0, event.clientY - pointer.startY)
    if (distance < 0) event.preventDefault()
    if (Math.abs(distance) > 6) draggedRef.current = true
    dragYRef.current = distance * 0.72
    setDragY(dragYRef.current)
  }

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId || !current) return
    pointerRef.current = null
    releasePointer(event.currentTarget, event.pointerId)
    if (dragYRef.current <= -38) {
      dismiss(current.id)
      return
    }
    dragYRef.current = 0
    setDragY(0)
    resumeTimer()
  }

  const cancelPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.id !== event.pointerId) return
    pointerRef.current = null
    releasePointer(event.currentTarget, event.pointerId)
    dragYRef.current = 0
    draggedRef.current = false
    setDragY(0)
    resumeTimer()
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {current && defaults && (
        <div className="luupi-toast-viewport">
          <div
            key={current.id}
            className={`luupi-toast luupi-toast--${current.tone} ${leaving ? 'luupi-toast-exit' : 'luupi-toast-enter'} ${paused ? 'luupi-toast--paused' : ''}`}
            style={{ '--toast-duration': `${current.duration}ms`, '--toast-drag-y': `${dragY}px` } as CSSProperties}
            role={current.tone === 'error' ? 'alert' : 'status'}
            aria-live={current.tone === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={cancelPointer}
            onLostPointerCapture={(event) => {
              if (pointerRef.current?.id === event.pointerId) cancelPointer(event)
            }}
            onMouseEnter={() => { hoveredRef.current = true; pauseTimer() }}
            onMouseLeave={() => { hoveredRef.current = false; resumeTimer() }}
            onFocusCapture={() => { focusedRef.current = true; pauseTimer() }}
            onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { focusedRef.current = false; resumeTimer() } }}
            onClick={(event) => {
              if (draggedRef.current || (event.target as HTMLElement).closest('button')) return
              dismiss(current.id)
            }}
          >
            <span className="luupi-toast__accent" aria-hidden />
            <span className="luupi-toast__icon" aria-hidden>
              <FeedbackGlyph tone={current.tone} />
              {contextIcon(current) && <span className="luupi-toast__context">{contextIcon(current)}</span>}
            </span>
            <span className="luupi-toast__copy">
              <span className="luupi-toast__eyebrow">{defaults.label}</span>
              <strong>{current.title}</strong>
              {current.message && <span>{current.message}</span>}
            </span>
            {current.action && <button type="button" className="luupi-toast__action" onClick={runAction}>{current.action.label}</button>}
            <button type="button" className="luupi-toast__dismiss" onClick={() => dismiss(current.id)} aria-label="Bildirimi kapat"><span aria-hidden>×</span></button>
            <span className="luupi-toast__timer" aria-hidden><i /></span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
