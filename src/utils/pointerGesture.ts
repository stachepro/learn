import type { PointerEvent as ReactPointerEvent } from 'react'
import { MOTION } from './motion'

export type GestureAxis = 'pending' | 'horizontal' | 'vertical'

export interface PointerGestureSession {
  pointerId: number
  startX: number
  startY: number
  lastX: number
  lastY: number
  lastTime: number
  velocityX: number
  velocityY: number
  axis: GestureAxis
  target: HTMLElement
}

export interface PointerGestureUpdate {
  deltaX: number
  deltaY: number
  previousAxis: GestureAxis
  axis: GestureAxis
}

export const EDGE_BACK = {
  startWidth: 24,
  commitRatio: 0.33,
  flickDistance: 56,
  flickVelocity: 0.55,
  resistanceLimit: 28,
} as const

export function isEdgeBackPointer(
  clientX: number,
  pointerType: string,
  isPrimary = true,
  button = 0,
): boolean {
  return isPrimary
    && button === 0
    && (pointerType === 'touch' || pointerType === 'pen')
    && clientX >= 0
    && clientX <= EDGE_BACK.startWidth
}

export function edgeBackResistance(deltaX: number): number {
  if (deltaX <= 0) return 0
  return Math.min(EDGE_BACK.resistanceLimit, EDGE_BACK.resistanceLimit * (1 - Math.exp(-deltaX / 72)))
}

export function shouldCommitEdgeBack(
  deltaX: number,
  velocityX: number,
  viewportWidth: number,
): boolean {
  if (deltaX <= 0 || viewportWidth <= 0) return false
  if (deltaX >= viewportWidth * EDGE_BACK.commitRatio) return true
  return deltaX >= EDGE_BACK.flickDistance && velocityX >= EDGE_BACK.flickVelocity
}

export function resolveGestureAxis(
  deltaX: number,
  deltaY: number,
  currentAxis: GestureAxis = 'pending',
  lockDistance: number = MOTION.axisLock,
  dominanceRatio = 1.08,
): GestureAxis {
  if (currentAxis !== 'pending') return currentAxis
  if (Math.hypot(deltaX, deltaY) < lockDistance) return 'pending'
  if (Math.abs(deltaY) > Math.abs(deltaX) * dominanceRatio) return 'vertical'
  if (Math.abs(deltaX) > Math.abs(deltaY) * dominanceRatio) return 'horizontal'
  return 'pending'
}

export function capturePointer(target: HTMLElement, pointerId: number): boolean {
  try {
    if (!target.hasPointerCapture(pointerId)) target.setPointerCapture(pointerId)
    return target.hasPointerCapture(pointerId)
  } catch {
    // A native gesture may have claimed the pointer before capture completed.
    return false
  }
}

export function releasePointer(target: HTMLElement, pointerId: number): void {
  try {
    if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId)
  } catch {
    // Pointer capture can already be gone after native cancellation.
  }
}

export function beginPointerGesture<T extends HTMLElement>(
  event: ReactPointerEvent<T>,
  captureTarget: HTMLElement = event.currentTarget,
): PointerGestureSession | null {
  if (event.button !== 0 || !event.isPrimary) return null
  const target = captureTarget
  if (!capturePointer(target, event.pointerId)) return null
  return {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    lastTime: event.timeStamp,
    velocityX: 0,
    velocityY: 0,
    axis: 'pending',
    target,
  }
}

export function updatePointerGesture<T extends HTMLElement>(
  session: PointerGestureSession,
  event: ReactPointerEvent<T>,
  dominanceRatio = 1.08,
): PointerGestureUpdate | null {
  if (session.pointerId !== event.pointerId) return null

  const deltaX = event.clientX - session.startX
  const deltaY = event.clientY - session.startY
  const previousAxis = session.axis
  session.axis = resolveGestureAxis(deltaX, deltaY, session.axis, MOTION.axisLock, dominanceRatio)

  const elapsed = Math.max(1, event.timeStamp - session.lastTime)
  const instantaneousX = (event.clientX - session.lastX) / elapsed
  const instantaneousY = (event.clientY - session.lastY) / elapsed
  session.velocityX = session.velocityX * 0.55 + instantaneousX * 0.45
  session.velocityY = session.velocityY * 0.55 + instantaneousY * 0.45
  session.lastX = event.clientX
  session.lastY = event.clientY
  session.lastTime = event.timeStamp

  if (session.axis === 'horizontal') event.preventDefault()
  if (previousAxis === 'pending' && session.axis === 'vertical') {
    releasePointer(session.target, session.pointerId)
  }

  return { deltaX, deltaY, previousAxis, axis: session.axis }
}

export function finishPointerGesture(session: PointerGestureSession | null): void {
  if (!session) return
  releasePointer(session.target, session.pointerId)
}
