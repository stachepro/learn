import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import type { Category, Habit } from '../../types'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import AppButton from '../ui/AppButton'
import ManagementSheet, { ConfirmActionSheet } from '../ui/ManagementSheet'
import LuupiIcon from '../ui/LuupiIcon'

function useInitialFocus<T extends HTMLElement>(selector?: string) {
  const focusRef = useRef<T>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => {
      const target = selector ? focusRef.current?.querySelector<HTMLElement>(selector) : focusRef.current
      target?.focus()
    })
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const panel = focusRef.current?.closest('section')
      if (!panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', trapFocus)
      previous?.focus()
    }
  }, [selector])
  return focusRef
}

export function HabitActionsSheet({
  habit,
  category,
  onClose,
  onEdit,
  onDelete,
}: {
  habit: Habit
  category?: Category
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <ManagementSheet
      eyebrow={category?.name ?? 'Alışkanlık yönetimi'}
      title={habit.name}
      subtitle="Kartın ve takip düzenin"
      icon={<LuupiIcon name={habit.icon} />}
      onClose={onClose}
      actions={[
        { id: 'edit', label: 'Alışkanlığı Düzenle', icon: '✎', onSelect: onEdit },
        { id: 'delete', label: 'Alışkanlığı Sil', icon: '×', tone: 'destructive', onSelect: onDelete },
      ]}
    />
  )
}

export function HabitDeleteDialog({ habit, onClose, onConfirm }: { habit: Habit; onClose: () => void; onConfirm: () => void }) {
  return (
    <ConfirmActionSheet
      title={`“${habit.name}” silinsin mi?`}
      description="Alışkanlıkla birlikte bütün istatistik geçmişi kalıcı olarak silinecek."
      icon={<LuupiIcon name={habit.icon} />}
      confirmLabel="Alışkanlığı Sil"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}

export function CategoryManagementSheet({
  categories,
  onClose,
  onDelete,
}: {
  categories: Category[]
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const closeRef = useInitialFocus<HTMLButtonElement>()
  return createPortal(
    <div className="habit-management-layer" role="dialog" aria-modal="true" aria-labelledby="category-management-title">
      <button type="button" className={`habit-management-layer__scrim ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={close} aria-label="Kapat" />
      <section style={sheetDrag.surfaceStyle} className={`habit-management-sheet habit-management-sheet--categories ${sheetDrag.surfaceClassName} ${isExiting ? 'habit-management-sheet--exit' : 'habit-management-sheet--enter'}`}>
        <span className="habit-management-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="habit-management-sheet__header">
          <div>
            <span>Alışkanlık düzeni</span>
            <h2 id="category-management-title">Özel kategoriler</h2>
          </div>
          <button ref={closeRef} type="button" className="habit-management-sheet__close" onClick={close} aria-label="Kapat">×</button>
        </header>
        <div className="category-management-list">
          {categories.length === 0 ? (
            <p className="category-management-list__empty">Henüz özel kategori oluşturmadın.</p>
          ) : categories.map((category) => (
            <div key={category.id} className="category-management-row">
              <span className="category-management-row__emoji" style={{ background: `${category.color}22`, color: category.color }}><LuupiIcon name={category.icon} /></span>
              <strong>{category.name}</strong>
              <AppButton tone="destructive" size="sm" onClick={() => onDelete(category.id)}>Sil</AppButton>
            </div>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  )
}
