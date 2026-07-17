export const MOTION = {
  fast: 120,
  standard: 220,
  navigation: 300,
  sheetEnter: 360,
  sheetExit: 240,
  result: 420,
  reward: 520,
  longPress: 450,
  longPressSlop: 10,
  longPressCooldown: 700,
  axisLock: 8,
} as const

export type MotionDuration = keyof Pick<
  typeof MOTION,
  'fast' | 'standard' | 'navigation' | 'sheetEnter' | 'sheetExit' | 'result' | 'reward'
>

export function motionMs(duration: MotionDuration, reducedMotion = false): number {
  return reducedMotion ? 0 : MOTION[duration]
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function scheduleAfterMotion(callback: () => void, duration: MotionDuration = 'sheetExit'): number {
  return window.setTimeout(callback, motionMs(duration, prefersReducedMotion()))
}
