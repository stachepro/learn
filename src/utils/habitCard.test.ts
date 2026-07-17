import { describe, expect, it } from 'vitest'
import {
  applySwipeResistance,
  getHabitCardShape,
  getSwipeThreshold,
  normalizeHabitCardColor,
  resolveSwipeDecision,
} from './habitCard'

describe('habit card visuals', () => {
  it('normalizes short colours and rejects invalid values', () => {
    expect(normalizeHabitCardColor('#Ab3')).toBe('#aabb33')
    expect(normalizeHabitCardColor('#12CCEF')).toBe('#12ccef')
    expect(normalizeHabitCardColor('red')).toBe('#84cc16')
  })

  it('assigns a stable shape to the same habit', () => {
    expect(getHabitCardShape('habit-42')).toBe(getHabitCardShape('habit-42'))
  })
})

describe('habit card swipe physics', () => {
  it('uses a responsive but bounded threshold', () => {
    expect(getSwipeThreshold(240)).toBe(86)
    expect(getSwipeThreshold(360)).toBeCloseTo(100.8)
    expect(getSwipeThreshold(600)).toBe(116)
  })

  it('tracks the finger directly until the threshold, then adds resistance', () => {
    expect(applySwipeResistance(70, 100, 360)).toBe(70)
    expect(applySwipeResistance(200, 100, 360)).toBe(134)
    expect(applySwipeResistance(-200, 100, 360)).toBe(-134)
  })

  it('commits by distance or an intentional same-direction flick', () => {
    expect(resolveSwipeDecision(105, 0.1, 100)).toBe('completed')
    expect(resolveSwipeDecision(-105, -0.1, 100)).toBe('skipped')
    expect(resolveSwipeDecision(45, 0.7, 100)).toBe('completed')
    expect(resolveSwipeDecision(-45, -0.7, 100)).toBe('skipped')
    expect(resolveSwipeDecision(45, -0.7, 100)).toBeNull()
    expect(resolveSwipeDecision(20, 1.2, 100)).toBeNull()
  })
})
