import { describe, expect, it } from 'vitest'
import { MOTION, motionMs } from './motion'

describe('motion contract', () => {
  it('keeps interaction layers ordered from immediate feedback to reward', () => {
    expect(MOTION.fast).toBeLessThan(MOTION.standard)
    expect(MOTION.standard).toBeLessThan(MOTION.navigation)
    expect(MOTION.navigation).toBeLessThan(MOTION.sheetEnter)
    expect(MOTION.sheetEnter).toBeLessThan(MOTION.result)
    expect(MOTION.result).toBeLessThan(MOTION.reward)
  })

  it('makes behavioral timers immediate for reduced motion', () => {
    expect(motionMs('result', true)).toBe(0)
    expect(motionMs('sheetExit', true)).toBe(0)
    expect(motionMs('navigation')).toBe(300)
  })

  it('shares the long press and axis intent thresholds', () => {
    expect(MOTION.longPress).toBe(450)
    expect(MOTION.longPressSlop).toBe(10)
    expect(MOTION.longPressCooldown).toBeGreaterThan(MOTION.longPress)
    expect(MOTION.axisLock).toBe(8)
  })
})
