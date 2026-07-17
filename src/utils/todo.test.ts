import { describe, expect, it } from 'vitest'
import type { TodoItem } from '../types'
import { resolvesDirectionalSwipe, visibleActiveTodos, visibleCompletedTodos } from './todo'

const task = (id: string, overrides: Partial<TodoItem> = {}): TodoItem => ({
  id,
  text: id,
  done: false,
  createdAt: `2026-07-16T10:0${id}:00.000Z`,
  ...overrides,
})

describe('Todo görünürlük ve sıralama', () => {
  it('arşivlenenleri gizler ve sabitlenen aktif görevi öne alır', () => {
    const todos = [task('1'), task('2', { pinned: true }), task('3', { archivedAt: '2026-07-16T12:00:00.000Z' })]
    expect(visibleActiveTodos(todos).map((todo) => todo.id)).toEqual(['2', '1'])
  })

  it('tamamlananları en yeni tamamlama önce olacak şekilde sıralar', () => {
    const todos = [
      task('1', { done: true, completedAt: '2026-07-16T11:00:00.000Z' }),
      task('2', { done: true, completedAt: '2026-07-16T13:00:00.000Z' }),
    ]
    expect(visibleCompletedTodos(todos).map((todo) => todo.id)).toEqual(['2', '1'])
  })
})

describe('Todo swipe kararı', () => {
  it('aktif görev için yalnızca sağ yönü kabul eder', () => {
    expect(resolvesDirectionalSwipe(92, 0, 90, 'right')).toBe(true)
    expect(resolvesDirectionalSwipe(-120, -1, 90, 'right')).toBe(false)
  })

  it('tamamlanmış görev için hızlı sol flick hareketini kabul eder', () => {
    expect(resolvesDirectionalSwipe(-38, -0.8, 90, 'left')).toBe(true)
    expect(resolvesDirectionalSwipe(-20, -0.2, 90, 'left')).toBe(false)
  })
})
