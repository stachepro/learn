import { describe, expect, it } from 'vitest'
import { feedbackForHapticEvent } from './haptics'

describe('semantic haptic contract', () => {
  it('keeps navigation hierarchy intentional', () => {
    expect(feedbackForHapticEvent('selection')).toBe('selection')
    expect(feedbackForHapticEvent('control')).toBe('light')
    expect(feedbackForHapticEvent('featured')).toBe('medium')
  })

  it('maps gestures and outcomes to one terminal feedback', () => {
    expect(feedbackForHapticEvent('long-press')).toBe('medium')
    expect(feedbackForHapticEvent('gesture-threshold')).toBe('medium')
    expect(feedbackForHapticEvent('success')).toBe('success')
    expect(feedbackForHapticEvent('skip')).toBe('warning')
    expect(feedbackForHapticEvent('error')).toBe('error')
    expect(feedbackForHapticEvent('reward')).toBe('success')
  })
})
