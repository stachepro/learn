import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { scheduleAfterMotion } from '../../utils/motion'
import { orderManagementActions } from '../../utils/management'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import AppButton, { type ButtonTone } from './AppButton'

export interface ManagementAction {
  id: string
  label: string
  icon?: ReactNode
  tone?: ButtonTone
  disabled?: boolean
  onSelect: () => void
}

interface ManagementSheetProps {
  eyebrow: string
  title: string
  subtitle?: string
  icon: ReactNode
  actions: ManagementAction[]
  onClose: () => void
  accent?: 'lime' | 'amber' | 'blue'
  style?: CSSProperties
}

export default function ManagementSheet({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  onClose,
  accent = 'lime',
  style,
}: ManagementSheetProps) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const panelRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const orderedActions = orderManagementActions(actions)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[data-management-action]')?.focus())
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', trapFocus)
      previousFocus?.focus()
    }
  }, [])

  const selectAction = (action: ManagementAction) => {
    close()
    scheduleAfterMotion(action.onSelect)
  }

  return createPortal(
    <div className="management-sheet-layer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="management-sheet__scrim" onClick={close} aria-label="Kapat" />
      <section
        ref={panelRef}
        style={{ ...style, ...sheetDrag.surfaceStyle }}
        className={`management-sheet management-sheet--${accent} ${sheetDrag.surfaceClassName} ${isExiting ? 'management-sheet--exit' : 'management-sheet--enter'}`}
      >
        <span className="management-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="management-sheet__header">
          <span className="management-sheet__identity" aria-hidden>{icon}</span>
          <div>
            <span>{eyebrow}</span>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <AppButton tone="quiet" size="sm" haptic="control" className="management-sheet__close" onClick={close} aria-label="Kapat">×</AppButton>
        </header>

        <div className="management-sheet__actions">
          {orderedActions.map((action) => (
            <AppButton
              key={action.id}
              data-management-action
              tone={action.tone ?? 'secondary'}
              size="lg"
              block
              haptic="none"
              disabled={action.disabled}
              leadingIcon={action.icon && <span className="management-sheet__action-icon" aria-hidden>{action.icon}</span>}
              className={action.tone === 'destructive' ? 'management-sheet__action--destructive' : ''}
              onClick={() => selectAction(action)}
            >
              {action.label}
            </AppButton>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  )
}

interface ConfirmActionSheetProps {
  eyebrow?: string
  title: string
  description: string
  icon?: ReactNode
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmActionSheet({
  eyebrow = 'Geri alınamaz işlem',
  title,
  description,
  icon = '×',
  confirmLabel,
  onClose,
  onConfirm,
}: ConfirmActionSheetProps) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const panelRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[data-safe-action]')?.focus())
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', trapFocus)
      previousFocus?.focus()
    }
  }, [])

  const confirm = () => {
    close()
    scheduleAfterMotion(onConfirm)
  }

  return createPortal(
    <div className="management-sheet-layer" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <button type="button" className="management-sheet__scrim" onClick={close} aria-label="Vazgeç" />
      <section
        ref={panelRef}
        style={sheetDrag.surfaceStyle}
        className={`management-sheet management-sheet--confirm ${sheetDrag.surfaceClassName} ${isExiting ? 'management-sheet--exit' : 'management-sheet--enter'}`}
      >
        <span className="management-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <div className="confirm-action-sheet__content">
          <span className="confirm-action-sheet__icon" aria-hidden>{icon}</span>
          <span>{eyebrow}</span>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>
        <div className="confirm-action-sheet__actions">
          <AppButton data-safe-action tone="secondary" size="lg" block haptic="control" onClick={close}>Vazgeç</AppButton>
          <AppButton tone="destructive" size="lg" block haptic="none" onClick={confirm}>{confirmLabel}</AppButton>
        </div>
      </section>
    </div>,
    document.body,
  )
}
