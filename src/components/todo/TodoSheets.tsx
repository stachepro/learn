import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import type { TodoItem } from '../../types'
import { scheduleAfterMotion } from '../../utils/motion'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import AppButton from '../ui/AppButton'
import ManagementSheet, { ConfirmActionSheet } from '../ui/ManagementSheet'

function useSheetFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('button')?.focus())
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !ref.current) return
      const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', trap)
      previous?.focus()
    }
  }, [])
  return ref
}

export function TodoActionsSheet({ todo, onClose, onEdit, onPin, onToggle, onDelete }: {
  todo: TodoItem
  onClose: () => void
  onEdit: () => void
  onPin: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <ManagementSheet
      eyebrow="Görev yönetimi"
      title={todo.text}
      subtitle={todo.done ? 'Tamamlanan görev' : todo.pinned ? 'Öne çıkarılmış görev' : 'Aktif görev'}
      icon={todo.done ? '✓' : todo.pinned ? '◆' : '○'}
      accent={todo.done ? 'lime' : 'amber'}
      onClose={onClose}
      actions={[
        ...(!todo.done ? [{ id: 'edit', label: 'Görevi Düzenle', icon: '✎', onSelect: onEdit }] : []),
        ...(!todo.done ? [{ id: 'pin', label: todo.pinned ? 'Öne Çıkarmayı Kaldır' : 'Öne Çıkar', icon: '◆', tone: 'tonal' as const, onSelect: onPin }] : []),
        { id: 'toggle', label: todo.done ? 'Aktif Listeye Geri Al' : 'Görevi Tamamla', icon: todo.done ? '↺' : '✓', onSelect: onToggle },
        { id: 'delete', label: 'Görevi Sil', icon: '×', tone: 'destructive', onSelect: onDelete },
      ]}
    />
  )
}

export function TodoDeleteDialog({ todo, onClose, onConfirm }: { todo: TodoItem; onClose: () => void; onConfirm: () => void }) {
  return (
    <ConfirmActionSheet
      title="Görev silinsin mi?"
      description={`“${todo.text}” kalıcı olarak silinecek. Tamamlama rozeti geçmişin korunur.`}
      confirmLabel="Görevi Sil"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}

function completedTime(todo: TodoItem): string {
  const date = new Date(todo.completedAt ?? todo.createdAt)
  return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function TodoCompletedSheet({ todos, onClose, onUndo, onArchive }: {
  todos: TodoItem[]
  onClose: () => void
  onUndo: (id: string) => void
  onArchive: () => void
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const panelRef = useSheetFocus<HTMLElement>()
  return createPortal(
    <div className="todo-sheet-layer" role="dialog" aria-modal="true" aria-labelledby="todo-results-title">
      <button type="button" className="todo-sheet__scrim" onClick={close} aria-label="Kapat" />
      <section ref={panelRef} style={sheetDrag.surfaceStyle} className={`todo-sheet todo-results-sheet ${sheetDrag.surfaceClassName} ${isExiting ? 'todo-sheet--exit' : 'todo-sheet--enter'}`}>
        <span className="todo-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="todo-sheet__header">
          <span className="todo-sheet__glyph todo-sheet__glyph--success" aria-hidden>✓</span>
          <div><span>TAMAMLANANLAR</span><h2 id="todo-results-title">Bugünün ivmesi</h2><p>{todos.length} görev sonuç rafında</p></div>
          <button type="button" className="todo-sheet__close" onClick={close} aria-label="Kapat">×</button>
        </header>
        <div className="todo-results-sheet__list">
          {todos.map((todo) => (
            <article key={todo.id} className="todo-result-row">
              <span aria-hidden>✓</span>
              <div><strong>{todo.text}</strong><small>{completedTime(todo)} tarihinde tamamlandı</small></div>
              <AppButton tone="quiet" size="sm" haptic="light" onClick={() => onUndo(todo.id)}>Geri al</AppButton>
            </article>
          ))}
        </div>
        <AppButton tone="secondary" size="lg" block haptic="none" onClick={() => { close(); scheduleAfterMotion(onArchive) }}>Tamamlananları Arşivle</AppButton>
      </section>
    </div>,
    document.body,
  )
}
