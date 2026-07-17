import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { storage } from './storage'

const store = new Map<string, string>()
const fakeLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value) },
  removeItem: (key: string) => { store.delete(key) },
}

describe('Todo kalıcı tamamlama geçmişi', () => {
  beforeEach(() => {
    store.clear()
    ;(globalThis as Record<string, unknown>).localStorage = fakeLocalStorage
  })

  afterAll(() => {
    delete (globalThis as Record<string, unknown>).localStorage
  })

  it('eski tamamlanmış ve arşivlenmiş görevleri başlangıç geçmişine taşır', () => {
    store.set('luupi_todos', JSON.stringify([
      { id: 'done', text: 'Bitti', done: true, createdAt: '2026-07-16', archivedAt: '2026-07-16' },
      { id: 'open', text: 'Açık', done: false, createdAt: '2026-07-16' },
    ]))

    expect(storage.getTodoStats().completedTaskIds).toEqual(['done'])
  })

  it('aynı görevi yeniden tamamlayınca rozet sayacını şişirmez', () => {
    storage.recordTodoCompletion('task-1')
    storage.recordTodoCompletion('task-1')

    expect(storage.getTodoStats().completedTaskIds).toEqual(['task-1'])
  })
})
