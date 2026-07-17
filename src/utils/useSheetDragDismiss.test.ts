import { describe, expect, it } from 'vitest'
import { SHEET_DISMISS_DISTANCE, SHEET_DISMISS_VELOCITY, shouldDismissSheet } from './useSheetDragDismiss'

describe('shouldDismissSheet', () => {
  it('dismisses at the distance threshold', () => {
    expect(shouldDismissSheet(SHEET_DISMISS_DISTANCE, 0)).toBe(true)
  })

  it('dismisses a deliberate downward flick', () => {
    expect(shouldDismissSheet(30, SHEET_DISMISS_VELOCITY)).toBe(true)
  })

  it('keeps short or upward gestures open', () => {
    expect(shouldDismissSheet(23, 2)).toBe(false)
    expect(shouldDismissSheet(60, -1)).toBe(false)
    expect(shouldDismissSheet(-40, 1)).toBe(false)
  })
})
