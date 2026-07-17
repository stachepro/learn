import { useEffect, useRef, useState } from 'react'
import BackBar from '../components/BackBar'
import AppButton from '../components/ui/AppButton'
import TodoTaskCard from '../components/todo/TodoTaskCard'
import TodoResultShelf from '../components/todo/TodoResultShelf'
import { TodoActionsSheet, TodoCompletedSheet, TodoDeleteDialog } from '../components/todo/TodoSheets'
import { storage } from '../utils/storage'
import { playConfirm } from '../utils/sound'
import { hapticEvent } from '../utils/haptics'
import { MOTION } from '../utils/motion'
import { showToast } from '../utils/toast'
import { awardStandaloneBadges } from '../utils/badges'
import { visibleActiveTodos, visibleCompletedTodos } from '../utils/todo'
import type { TodoItem } from '../types'

function PlusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 6h11M9 12h11M9 18h11" /><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" />
    </svg>
  )
}

export default function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>(storage.getTodos)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [managedId, setManagedId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)
  const newItemTimerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (newItemTimerRef.current !== null) window.clearTimeout(newItemTimerRef.current)
  }, [])

  const activeTodos = visibleActiveTodos(todos)
  const completedTodos = visibleCompletedTodos(todos)
  const visibleCount = activeTodos.length + completedTodos.length
  const allDone = completedTodos.length > 0 && activeTodos.length === 0
  const progress = visibleCount === 0 ? 0 : completedTodos.length / visibleCount
  const managedTodo = todos.find((todo) => todo.id === managedId) ?? null
  const deletingTodo = todos.find((todo) => todo.id === deleteId) ?? null

  const save = (next: TodoItem[], checkBadges = false) => {
    setTodos(next)
    storage.setTodos(next)
    if (checkBadges) awardStandaloneBadges()
  }

  const addTask = () => {
    const text = draft.trim()
    if (!text) return
    const id = crypto.randomUUID()
    const minimumOrder = todos.reduce((minimum, todo) => Math.min(minimum, todo.order ?? 0), 0)
    const next: TodoItem = {
      id,
      text,
      done: false,
      createdAt: new Date().toISOString(),
      order: minimumOrder - 1,
    }
    save([next, ...todos])
    setDraft('')
    setNewlyAddedId(id)
    void hapticEvent('control')
    playConfirm()
    if (newItemTimerRef.current !== null) window.clearTimeout(newItemTimerRef.current)
    newItemTimerRef.current = window.setTimeout(() => setNewlyAddedId(null), MOTION.reward)
  }

  const commitEdit = (id: string, text: string) => {
    const normalized = text.trim()
    if (normalized) save(todos.map((todo) => todo.id === id ? { ...todo, text: normalized } : todo))
    setEditingId(null)
  }

  const completeTask = (id: string, thresholdSignalled = false) => {
    const task = todos.find((todo) => todo.id === id)
    if (!task || task.done) return
    const completedAt = new Date().toISOString()
    const next = todos.map((todo) => todo.id === id ? { ...todo, done: true, completedAt, archivedAt: undefined } : todo)
    save(next)
    storage.recordTodoCompletion(id)
    awardStandaloneBadges()
    playConfirm()
    showToast({
      id: `todo-complete-${id}-${completedAt}`,
      tone: 'success',
      title: 'Görev tamamlandı',
      message: task.text,
      haptic: thresholdSignalled ? 'none' : 'success',
      action: { label: 'Geri Al', onPress: () => undoTask(id, false) },
    })
  }

  const undoTask = (id: string, feedbackHaptic = true) => {
    const task = todos.find((todo) => todo.id === id)
    if (!task) return
    save(todos.map((todo) => todo.id === id ? { ...todo, done: false, completedAt: undefined, archivedAt: undefined } : todo))
    if (completedTodos.length === 1) setResultsOpen(false)
    showToast({ tone: 'info', contextIcon: '↺', title: 'Aktif listeye geri alındı', message: task.text, haptic: feedbackHaptic ? 'light' : 'none' })
  }

  const pinTask = (id: string) => {
    const task = todos.find((todo) => todo.id === id)
    if (!task) return
    const pinned = !task.pinned
    save(todos.map((todo) => todo.id === id ? { ...todo, pinned } : todo))
    showToast({ tone: 'info', icon: pinned ? '◆' : '○', title: task.text, message: pinned ? 'Listenin önüne taşındı.' : 'Normal sırasına döndü.', haptic: 'selection' })
  }

  const archiveCompleted = () => {
    const archivedAt = new Date().toISOString()
    save(todos.map((todo) => todo.done && !todo.archivedAt ? { ...todo, archivedAt } : todo))
    setResultsOpen(false)
    showToast({ tone: 'info', icon: '↓', title: 'Tamamlananlar arşivlendi', message: 'Özet ve rozet geçmişin korunuyor.', haptic: 'light' })
  }

  const deleteTask = (id: string) => {
    const task = todos.find((todo) => todo.id === id)
    if (!task) return
    save(todos.filter((todo) => todo.id !== id))
    setDeleteId(null)
    setManagedId(null)
    showToast({ tone: 'warning', title: 'Görev silindi', message: task.text, haptic: 'warning' })
  }

  return (
    <div className="todo-page">
      <div className="todo-page__inner">
        <BackBar />

        <header className="todo-header">
          <div>
            <span>HIZLI AKSİYON LİSTESİ</span>
            <h1>To-do</h1>
            <p>{activeTodos.length === 0 ? 'Liste temiz' : `${activeTodos.length} görev harekete hazır`}</p>
          </div>
          <div className="todo-header__meter" style={{ '--todo-progress': progress } as React.CSSProperties} aria-label={`Yüzde ${Math.round(progress * 100)} tamamlandı`}>
            <strong>{Math.round(progress * 100)}</strong><small>%</small>
          </div>
        </header>

        <section className="todo-composer" aria-label="Yeni görev ekle">
          <span className="todo-composer__icon"><PlusIcon /></span>
          <input
            value={draft}
            maxLength={140}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') addTask() }}
            placeholder="Şimdi ne yapılacak?"
            aria-label="Yeni görev"
          />
          <AppButton tone="primary" size="sm" haptic="none" disabled={!draft.trim()} onClick={addTask}>Ekle</AppButton>
        </section>

        {allDone && (
          <section className="todo-clean-sweep" role="status">
            <span aria-hidden>✓</span>
            <div><strong>Liste tamamlandı</strong><p>{completedTodos.length} görev sonuç rafına taşındı.</p></div>
            <i aria-hidden />
          </section>
        )}

        {visibleCount === 0 && (
          <section className="todo-empty">
            <span aria-hidden><ListIcon /></span>
            <h2>Alan hazır</h2>
            <p>Aklındaki ilk işi yukarıya yaz. Küçük ve net tut.</p>
          </section>
        )}

        {activeTodos.length > 0 && (
          <main className="todo-active-list" aria-label="Aktif görevler">
            <div className="todo-active-list__heading">
              <div><span>ŞİMDİ</span><h2>Aktif görevler</h2></div>
              <p>Sağa kaydır <b>→</b></p>
            </div>
            <div className="todo-active-list__cards">
              {activeTodos.map((todo, index) => (
                <TodoTaskCard
                  key={todo.id}
                  todo={todo}
                  index={index}
                  editing={editingId === todo.id}
                  newlyAdded={newlyAddedId === todo.id}
                  onCommitEdit={(text) => commitEdit(todo.id, text)}
                  onComplete={(thresholdSignalled) => completeTask(todo.id, thresholdSignalled)}
                  onManage={() => setManagedId(todo.id)}
                />
              ))}
            </div>
            <p className="todo-active-list__gesture-note">Sağa kaydır: tamamla · Uzun bas: yönet</p>
          </main>
        )}

        <TodoResultShelf todos={completedTodos} onOpen={() => setResultsOpen(true)} />
      </div>

      {managedTodo && (
        <TodoActionsSheet
          todo={managedTodo}
          onClose={() => setManagedId(null)}
          onEdit={() => setEditingId(managedTodo.id)}
          onPin={() => pinTask(managedTodo.id)}
          onToggle={() => managedTodo.done ? undoTask(managedTodo.id) : completeTask(managedTodo.id)}
          onDelete={() => setDeleteId(managedTodo.id)}
        />
      )}
      {deletingTodo && (
        <TodoDeleteDialog todo={deletingTodo} onClose={() => setDeleteId(null)} onConfirm={() => deleteTask(deletingTodo.id)} />
      )}
      {resultsOpen && completedTodos.length > 0 && (
        <TodoCompletedSheet todos={completedTodos} onClose={() => setResultsOpen(false)} onUndo={undoTask} onArchive={archiveCompleted} />
      )}
    </div>
  )
}
