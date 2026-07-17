import type { DaySummary } from './daySummary'

export type SummarySlideKind = 'intro' | 'habits' | 'goals' | 'tools' | 'score'
export interface SummarySlide { kind: SummarySlideKind; duration: number }

export function buildSummarySlides(summary: DaySummary): SummarySlide[] {
  const slides: SummarySlide[] = [{ kind: 'intro', duration: 3800 }]
  if (summary.habitEntries.length > 0) slides.push({ kind: 'habits', duration: 5200 })
  if (summary.water || summary.wake) slides.push({ kind: 'goals', duration: 5000 })
  if (summary.sessions.length || summary.justStartCount || summary.noRush.length || summary.todos.length) {
    slides.push({ kind: 'tools', duration: 5000 })
  }
  slides.push({ kind: 'score', duration: 5800 })
  return slides
}
