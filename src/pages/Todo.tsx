import { useEffect, useState } from 'react'
import { storage } from '../utils/storage'
import type { TodoItem } from '../types'

const OUTLINE_COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#ec4899',
  '#a855f7', '#eab308', '#06b6d4', '#ef4444',
]

function randomColor(): string {
  return OUTLINE_COLORS[Math.floor(Math.random() * OUTLINE_COLORS.length)]
}

function IconPlus({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconCheck({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconTrash({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function TodoRow({ todo, onChangeText, onToggle, onDelete, delay = 0 }: {
  todo: TodoItem
  onChangeText: (text: string) => void
  onToggle: () => void
  onDelete: () => void
  delay?: number
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl px-3 py-2.5 tile-press soft-trans animate-fade-up"
      style={{
        background: todo.done ? 'rgba(26,23,38,0.05)' : '#ffffff',
        border: `1.5px solid ${todo.done ? 'rgba(26,23,38,0.1)' : todo.color}`,
        animationDelay: `${delay}s`,
      }}
    >
      <input
        type="text"
        value={todo.text}
        onChange={(e) => onChangeText(e.target.value)}
        readOnly={todo.done}
        placeholder="Ne yapılacak?"
        className="flex-1 min-w-0 text-sm bg-transparent outline-none soft-trans"
        style={{ color: todo.done ? 'rgba(26,23,38,0.4)' : '#1a1726' }}
      />

      <button
        onClick={onToggle}
        aria-label={todo.done ? 'Tamamlandı' : 'Tamamla'}
        className="btn-press soft-trans w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: todo.done ? 'rgba(34,197,94,0.9)' : 'rgba(59,130,246,0.9)',
          color: '#fff',
        }}
      >
        <IconCheck className={todo.done ? 'animate-check' : ''} />
      </button>

      {todo.done && (
        <button
          onClick={onDelete}
          aria-label="Sil"
          className="btn-press animate-pop w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
        >
          <IconTrash />
        </button>
      )}
    </div>
  )
}

export default function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>(() => storage.getTodos())
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const persist = (next: TodoItem[]) => {
    setTodos(next)
    storage.setTodos(next)
  }

  const addTodo = () => {
    const item: TodoItem = {
      id: crypto.randomUUID(),
      text: '',
      color: randomColor(),
      done: false,
      createdAt: new Date().toISOString(),
    }
    persist([...todos, item])
  }

  const changeText = (id: string, text: string) => {
    persist(todos.map((t) => (t.id === id ? { ...t, text } : t)))
  }

  const toggle = (id: string) => {
    persist(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const remove = (id: string) => {
    persist(todos.filter((t) => t.id !== id))
  }

  return (
    <div className={`max-w-sm mx-auto px-4 pt-6 pb-40 ${mounted ? 'page-enter' : 'opacity-0'}`}>
      <div className="mb-6">
        <h1 className="display text-2xl font-extrabold tracking-tight" style={{ color: '#1a1726' }}>
          To-do
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
          Basit yapılacaklar listesi
        </p>
      </div>

      {todos.length === 0 && (
        <div className="text-center py-10 animate-fade-in">
          <p className="text-3xl mb-2">📝</p>
          <p className="text-sm font-semibold" style={{ color: '#1a1726' }}>Liste boş</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
            Aşağıdaki + düğmesiyle ilk maddeni ekle.
          </p>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {todos.map((todo, i) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            delay={i * 0.04}
            onChangeText={(text) => changeText(todo.id, text)}
            onToggle={() => toggle(todo.id)}
            onDelete={() => remove(todo.id)}
          />
        ))}
      </div>

      <button
        onClick={addTodo}
        aria-label="Yeni to-do ekle"
        className="btn-press w-12 h-12 rounded-full flex items-center justify-center mx-auto"
        style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f', boxShadow: '0 8px 20px -6px rgba(34,197,94,0.5)' }}
      >
        <IconPlus />
      </button>
    </div>
  )
}
