export function sortResultsNewestFirst<T extends { resolvedAt: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.resolvedAt.localeCompare(a.resolvedAt))
}

export function clampResultIndex(index: number, resultCount: number): number {
  if (resultCount <= 0) return 0
  return Math.max(0, Math.min(index, resultCount - 1))
}

export function resultIndexAfterRemoval(activeIndex: number, removedIndex: number, resultCount: number): number {
  if (resultCount <= 1) return 0
  if (removedIndex >= 0 && removedIndex < activeIndex) return activeIndex - 1
  return clampResultIndex(activeIndex, resultCount - 1)
}
