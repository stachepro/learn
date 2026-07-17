import { describe, expect, it } from 'vitest'
import { formatFocusTotal, getPomodoroVisualState } from './pomodoroView'

describe('getPomodoroVisualState', () => {
  it('maps timer phases to distinct visual states', () => {
    expect(getPomodoroVisualState('idle', false)).toBe('idle')
    expect(getPomodoroVisualState('work', false)).toBe('focus')
    expect(getPomodoroVisualState('break', false)).toBe('break')
    expect(getPomodoroVisualState('work-done', false)).toBe('work-complete')
    expect(getPomodoroVisualState('break-done', false)).toBe('break-complete')
  })

  it('uses paused as the dominant running state', () => {
    expect(getPomodoroVisualState('work', true)).toBe('paused')
    expect(getPomodoroVisualState('break', true)).toBe('paused')
  })
})

describe('formatFocusTotal', () => {
  it('formats minute and hour summaries for compact UI', () => {
    expect(formatFocusTotal(0)).toBe('0 dk')
    expect(formatFocusTotal(35)).toBe('<1 dk')
    expect(formatFocusTotal(25 * 60)).toBe('25 dk')
    expect(formatFocusTotal(60 * 60)).toBe('1 sa')
    expect(formatFocusTotal(85 * 60)).toBe('1 sa 25 dk')
  })
})
