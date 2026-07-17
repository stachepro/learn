import { describe, expect, it } from 'vitest'
import {
  EDGE_BACK,
  edgeBackResistance,
  isEdgeBackPointer,
  resolveGestureAxis,
  shouldCommitEdgeBack,
} from './pointerGesture'

describe('pointer gesture axis ownership', () => {
  it('waits inside the shared axis lock distance', () => {
    expect(resolveGestureAxis(5, 5)).toBe('pending')
  })

  it('locks a deliberate horizontal movement', () => {
    expect(resolveGestureAxis(12, 4)).toBe('horizontal')
  })

  it('hands a deliberate vertical movement to page scroll', () => {
    expect(resolveGestureAxis(3, 12)).toBe('vertical')
  })

  it('does not change ownership after an axis locks', () => {
    expect(resolveGestureAxis(2, 40, 'horizontal')).toBe('horizontal')
    expect(resolveGestureAxis(40, 2, 'vertical')).toBe('vertical')
  })

  it('keeps ambiguous diagonal movement pending', () => {
    expect(resolveGestureAxis(10, 10)).toBe('pending')
  })
})

describe('interactive edge back contract', () => {
  it('only starts for a primary touch or pen pointer inside the left edge', () => {
    expect(isEdgeBackPointer(0, 'touch')).toBe(true)
    expect(isEdgeBackPointer(EDGE_BACK.startWidth, 'pen')).toBe(true)
    expect(isEdgeBackPointer(EDGE_BACK.startWidth + 1, 'touch')).toBe(false)
    expect(isEdgeBackPointer(10, 'mouse')).toBe(false)
    expect(isEdgeBackPointer(10, 'touch', false)).toBe(false)
  })

  it('commits by distance or by an intentional fast flick', () => {
    expect(shouldCommitEdgeBack(130, 0.1, 390)).toBe(true)
    expect(shouldCommitEdgeBack(70, 0.56, 390)).toBe(true)
    expect(shouldCommitEdgeBack(55, 1.2, 390)).toBe(false)
    expect(shouldCommitEdgeBack(90, 0.2, 390)).toBe(false)
  })

  it('gives a bounded rubber-band response when app history is empty', () => {
    expect(edgeBackResistance(-10)).toBe(0)
    expect(edgeBackResistance(20)).toBeGreaterThan(0)
    expect(edgeBackResistance(500)).toBeLessThanOrEqual(EDGE_BACK.resistanceLimit)
  })
})
