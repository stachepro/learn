import { describe, expect, it } from 'vitest'
import type { DaySummary } from './daySummary'
import { buildSummarySlides } from './summaryStory'

function summary(partial: Partial<DaySummary> = {}): DaySummary {
  return {
    date: '2026-07-16',
    habitEntries: [],
    doneCount: 0,
    skippedCount: 0,
    pendingCount: 0,
    water: null,
    wake: null,
    sessions: [],
    totalPomMin: 0,
    noRush: [],
    todos: [],
    justStartCount: 0,
    ...partial,
  }
}

describe('buildSummarySlides', () => {
  it('boş özette yalnızca açılış ve puan slaytını gösterir', () => {
    expect(buildSummarySlides(summary()).map(({ kind }) => kind)).toEqual(['intro', 'score'])
  })

  it('veriye göre bölümleri ekler ve akışı beş slaytta tutar', () => {
    const slides = buildSummarySlides(summary({
      habitEntries: [{} as DaySummary['habitEntries'][number]],
      water: { goal: 2000, actual: 1500 },
      justStartCount: 2,
    }))

    expect(slides.map(({ kind }) => kind)).toEqual(['intro', 'habits', 'goals', 'tools', 'score'])
    expect(slides).toHaveLength(5)
  })

  it('Just Start sonucunu tek başına araç slaytı için yeterli sayar', () => {
    expect(buildSummarySlides(summary({ justStartCount: 1 })).map(({ kind }) => kind)).toContain('tools')
  })
})
