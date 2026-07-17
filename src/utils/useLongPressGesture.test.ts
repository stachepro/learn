import { describe, expect, it } from 'vitest'
import { exceedsLongPressMovement, hasReachedLongPressDuration } from './useLongPressGesture'

describe('long press movement contract', () => {
  it('keeps movement on the ten pixel boundary eligible', () => {
    expect(exceedsLongPressMovement(0, 0, 6, 8)).toBe(false)
  })

  it('cancels movement beyond the shared tolerance', () => {
    expect(exceedsLongPressMovement(0, 0, 8, 8)).toBe(true)
  })

  it('supports an explicit tolerance override', () => {
    expect(exceedsLongPressMovement(0, 0, 4, 0, 3)).toBe(true)
  })

  it('does not activate one millisecond before the shared duration', () => {
    expect(hasReachedLongPressDuration(449)).toBe(false)
    expect(hasReachedLongPressDuration(450)).toBe(true)
  })
})
