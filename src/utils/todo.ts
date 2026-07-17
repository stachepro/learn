import type { TodoItem } from '../types'

export function visibleActiveTodos(todos: TodoItem[]): TodoItem[] {
  return todos
    .filter((todo) => !todo.done && !todo.archivedAt)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
      || (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
      || a.createdAt.localeCompare(b.createdAt))
}

export function visibleCompletedTodos(todos: TodoItem[]): TodoItem[] {
  return todos
    .filter((todo) => todo.done && !todo.archivedAt)
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
}

export function resolvesDirectionalSwipe(
  distance: number,
  velocity: number,
  threshold: number,
  direction: 'right' | 'left',
): boolean {
  const sign = direction === 'right' ? 1 : -1
  if (distance * sign >= threshold) return true
  return distance * sign >= threshold * 0.38 && velocity * sign >= 0.55
}
