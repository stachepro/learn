import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { scheduleAfterMotion } from '../../utils/motion'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import AppButton from '../ui/AppButton'

export type JustStartSheetKind = 'cancel' | 'reset'

export default function JustStartConfirmSheet({ kind, onClose, onConfirm }: {
  kind: JustStartSheetKind
  onClose: () => void
  onConfirm: () => void
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const cancelling = kind === 'cancel'

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      cancelAnimationFrame(frame)
      previous?.focus()
    }
  }, [])

  return createPortal(
    <div
      className="just-start-sheet-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="just-start-sheet-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]') ?? [])
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
      }}
    >
      <button type="button" className="just-start-sheet__scrim" onClick={close} aria-label="Kapat" />
      <section ref={panelRef} style={sheetDrag.surfaceStyle} className={`just-start-sheet ${sheetDrag.surfaceClassName} ${isExiting ? 'just-start-sheet--exit' : 'just-start-sheet--enter'}`}>
        <span className="just-start-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <div className="just-start-sheet__icon" aria-hidden>{cancelling ? 'Ⅱ' : '↺'}</div>
        <h2 id="just-start-sheet-title">{cancelling ? 'Bu adım bırakılsın mı?' : 'Bugünün yolu sıfırlansın mı?'}</h2>
        <p>
          {cancelling
            ? 'Tamamlanan önceki adımlar korunur. Bu adıma daha sonra baştan dönebilirsin.'
            : 'Bugün tamamladığın bütün adımlar silinir. Kazanılmış XP geri alınmaz.'}
        </p>
        <div className="just-start-sheet__actions">
          <AppButton ref={closeRef} tone="secondary" size="lg" block onClick={close}>
            {cancelling ? 'Adımda Kal' : 'Vazgeç'}
          </AppButton>
          <AppButton
            tone="destructive"
            size="lg"
            block
            onClick={() => {
              close()
              scheduleAfterMotion(onConfirm)
            }}
          >
            {cancelling ? 'Adımı Bırak' : 'Yolu Sıfırla'}
          </AppButton>
        </div>
      </section>
    </div>,
    document.body,
  )
}
