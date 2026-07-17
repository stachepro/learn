import type { TodoItem } from '../../types'

export default function TodoResultShelf({ todos, onOpen }: { todos: TodoItem[]; onOpen: () => void }) {
  if (todos.length === 0) return null
  const visible = todos.slice(0, 3)
  return (
    <section className="todo-result-preview">
      <header><div><span>SONUÇ RAFI</span><h2>Tamamlananlar</h2></div><strong>{todos.length}</strong></header>
      <button type="button" className="todo-result-shelf" onClick={onOpen} aria-label={`${todos.length} tamamlanan görevi aç`}>
        {visible.slice().reverse().map((todo, reverseIndex) => {
          const depth = visible.length - reverseIndex - 1
          return (
            <span key={todo.id} className={`todo-result-mini ${depth === 0 ? 'todo-result-mini--front' : ''}`} style={{ '--todo-result-depth': depth } as React.CSSProperties}>
              <span aria-hidden>✓</span><strong>{todo.text}</strong><small>Tamamlandı</small>
            </span>
          )
        })}
        <span className="todo-result-shelf__open">Tümünü gör <b>→</b></span>
      </button>
    </section>
  )
}
