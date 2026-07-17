import { describe, expect, it } from 'vitest'
import { clampResultIndex, resultIndexAfterRemoval, sortResultsNewestFirst } from './dashboardResults'

describe('dashboard result ordering', () => {
  it('keeps the latest resolved habit first without mutating the input', () => {
    const entries = [
      { id: 'old', resolvedAt: '2026-07-15T08:00:00.000Z' },
      { id: 'new', resolvedAt: '2026-07-15T12:00:00.000Z' },
      { id: 'mid', resolvedAt: '2026-07-15T10:00:00.000Z' },
    ]
    expect(sortResultsNewestFirst(entries).map((entry) => entry.id)).toEqual(['new', 'mid', 'old'])
    expect(entries.map((entry) => entry.id)).toEqual(['old', 'new', 'mid'])
  })
})

describe('dashboard result selection', () => {
  it('clamps the active result to the available range', () => {
    expect(clampResultIndex(-2, 3)).toBe(0)
    expect(clampResultIndex(8, 3)).toBe(2)
    expect(clampResultIndex(2, 0)).toBe(0)
  })

  it('preserves the visible result when an earlier card is removed', () => {
    expect(resultIndexAfterRemoval(3, 1, 5)).toBe(2)
  })

  it('selects the nearest remaining card when the active card is removed', () => {
    expect(resultIndexAfterRemoval(2, 2, 5)).toBe(2)
    expect(resultIndexAfterRemoval(4, 4, 5)).toBe(3)
    expect(resultIndexAfterRemoval(0, 0, 1)).toBe(0)
  })
})
