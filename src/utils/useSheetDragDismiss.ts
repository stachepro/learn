import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type PointerEvent as ReactPointerEvent } from 'react'
import { hapticEvent } from './haptics'
import { motionMs } from './motion'
import { capturePointer, releasePointer } from './pointerGesture'
import { useReducedMotion } from './useReducedMotion'

export const SHEET_DISMISS_DISTANCE = 92
export const SHEET_DISMISS_VELOCITY = 0.65
const SHEET_FLICK_MIN_DISTANCE = 24

export function shouldDismissSheet(distance: number, velocity: number): boolean {
  return distance >= SHEET_DISMISS_DISTANCE
    || (distance >= SHEET_FLICK_MIN_DISTANCE && velocity >= SHEET_DISMISS_VELOCITY)
}

function resistedDistance(distance: number): number {
  const positiveDistance = Math.max(0, distance)
  const resistanceStartsAt = 280
  if (positiveDistance <= resistanceStartsAt) return positiveDistance
  return resistanceStartsAt + (positiveDistance - resistanceStartsAt) * 0.32
}

interface DragState {
  pointerId: number
  startY: number
  lastY: number
  lastTime: number
  velocity: number
}

export function useSheetDragDismiss(close: () => boolean | void) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const dragRef = useRef<DragState | null>(null)
  const thresholdFeedbackRef = useRef(false)
  const settleTimerRef = useRef<number | null>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => () => {
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
  }, [])

  const dismiss = () => {
    if (isDismissing) return
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
    if (close() === false) {
      reset()
      return
    }
    setIsDismissing(true)
    void hapticEvent('control')
  }

  const reset = () => {
    dragRef.current = null
    thresholdFeedbackRef.current = false
    setIsDragging(false)
    setIsSettling(true)
    setDragY(0)
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
    settleTimerRef.current = window.setTimeout(() => {
      setIsSettling(false)
      settleTimerRef.current = null
    }, motionMs('standard', reducedMotion))
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (isDismissing || event.button !== 0 || !event.isPrimary || dragRef.current) return
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
    settleTimerRef.current = null
    setIsSettling(false)
    if (!capturePointer(event.currentTarget, event.pointerId)) return
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
    }
    thresholdFeedbackRef.current = false
    setIsDragging(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || isDismissing) return
    event.preventDefault()

    const elapsed = Math.max(1, event.timeStamp - drag.lastTime)
    const instantaneousVelocity = (event.clientY - drag.lastY) / elapsed
    drag.velocity = drag.velocity * 0.6 + instantaneousVelocity * 0.4
    drag.lastY = event.clientY
    drag.lastTime = event.timeStamp

    const nextDistance = resistedDistance(event.clientY - drag.startY)
    setDragY(nextDistance)
    if (nextDistance >= SHEET_DISMISS_DISTANCE && !thresholdFeedbackRef.current) {
      thresholdFeedbackRef.current = true
      void hapticEvent('gesture-threshold')
    }
  }

  const finishDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || isDismissing) return
    dragRef.current = null
    releasePointer(event.currentTarget, event.pointerId)
    const distance = resistedDistance(event.clientY - drag.startY)
    const velocity = Math.max(drag.velocity, (event.clientY - drag.lastY) / Math.max(1, event.timeStamp - drag.lastTime))
    setIsDragging(false)

    if (shouldDismissSheet(distance, velocity)) {
      if (close() === false) {
        reset()
        return
      }
      setIsDismissing(true)
      if (!thresholdFeedbackRef.current) void hapticEvent('gesture-threshold')
      return
    }

    reset()
  }

  const cancelDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || isDismissing) return
    dragRef.current = null
    releasePointer(event.currentTarget, event.pointerId)
    reset()
  }

  const handleProps: HTMLAttributes<HTMLElement> = {
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Aşağı çekerek kapat',
    onPointerDown,
    onPointerMove,
    onPointerUp: finishDrag,
    onPointerCancel: cancelDrag,
    onLostPointerCapture: (event) => {
      if (dragRef.current?.pointerId === event.pointerId) reset()
    },
    onKeyDown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      dismiss()
    },
  }

  const surfaceStyle = {
    '--sheet-drag-y': `${dragY}px`,
    '--sheet-drag-progress': Math.min(1, dragY / SHEET_DISMISS_DISTANCE),
  } as CSSProperties

  return {
    handleProps,
    surfaceClassName: `sheet-drag-surface${isDragging ? ' sheet-drag-surface--dragging' : ''}${isSettling ? ' sheet-drag-surface--settling' : ''}${isDismissing ? ' sheet-drag-surface--dismissing' : ''}`,
    surfaceStyle,
  }
}
