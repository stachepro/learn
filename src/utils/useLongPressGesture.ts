import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { hapticEvent } from './haptics'
import { MOTION } from './motion'
import { capturePointer as capturePointerSafely, releasePointer } from './pointerGesture'

interface LongPressOptions {
  onLongPress: () => void
  disabled?: boolean
  duration?: number
  movementTolerance?: number
  capturePointer?: boolean
}

interface PressOrigin {
  pointerId: number
  x: number
  y: number
  target: HTMLElement
}

export function exceedsLongPressMovement(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  tolerance: number = MOTION.longPressSlop,
): boolean {
  return Math.hypot(currentX - startX, currentY - startY) > tolerance
}

export function hasReachedLongPressDuration(elapsed: number, duration: number = MOTION.longPress): boolean {
  return elapsed >= duration
}

export function useLongPressGesture({
  onLongPress,
  disabled = false,
  duration = MOTION.longPress,
  movementTolerance = MOTION.longPressSlop,
  capturePointer = true,
}: LongPressOptions) {
  const [isPressing, setIsPressing] = useState(false)
  const originRef = useRef<PressOrigin | null>(null)
  const timerRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)
  const lastTriggerRef = useRef(0)
  const callbackRef = useRef(onLongPress)
  const disabledRef = useRef(disabled)
  callbackRef.current = onLongPress
  disabledRef.current = disabled

  const clearTimer = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const cancel = () => {
    const origin = originRef.current
    originRef.current = null
    if (origin && capturePointer) releasePointer(origin.target, origin.pointerId)
    clearTimer()
    setIsPressing(false)
  }

  const trigger = (suppressNextClick = true) => {
    const now = Date.now()
    if (disabledRef.current || now - lastTriggerRef.current < MOTION.longPressCooldown) {
      cancel()
      return false
    }
    lastTriggerRef.current = now
    suppressClickRef.current = suppressNextClick
    cancel()
    void hapticEvent('long-press')
    callbackRef.current()
    return true
  }

  const start = (event: ReactPointerEvent<HTMLElement>) => {
    if (disabledRef.current || event.button !== 0 || !event.isPrimary || originRef.current) return
    clearTimer()
    suppressClickRef.current = false
    if (capturePointer) {
      if (!capturePointerSafely(event.currentTarget, event.pointerId)) return
    }
    originRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      target: event.currentTarget,
    }
    setIsPressing(true)
    timerRef.current = window.setTimeout(() => trigger(true), duration)
  }

  const move = (event: ReactPointerEvent<HTMLElement>) => {
    const origin = originRef.current
    if (!origin || origin.pointerId !== event.pointerId) return
    if (exceedsLongPressMovement(origin.x, origin.y, event.clientX, event.clientY, movementTolerance)) cancel()
  }

  const end = (event?: ReactPointerEvent<HTMLElement>) => {
    if (event && originRef.current && originRef.current.pointerId !== event.pointerId) return
    cancel()
  }

  const consumeClick = () => {
    if (!suppressClickRef.current) return false
    suppressClickRef.current = false
    return true
  }

  useEffect(() => {
    if (disabled) cancel()
  }, [disabled])

  useEffect(() => {
    const stopPendingGesture = () => cancel()
    const stopWhenHidden = () => { if (document.hidden) cancel() }
    window.addEventListener('blur', stopPendingGesture)
    document.addEventListener('visibilitychange', stopWhenHidden)
    return () => {
      clearTimer()
      window.removeEventListener('blur', stopPendingGesture)
      document.removeEventListener('visibilitychange', stopWhenHidden)
    }
  }, [])

  const lostCapture = (event: ReactPointerEvent<HTMLElement>) => {
    if (originRef.current?.pointerId === event.pointerId) cancel()
  }

  return { isPressing, start, move, end, cancel, lostCapture, trigger, consumeClick }
}
