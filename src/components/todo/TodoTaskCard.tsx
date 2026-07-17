import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import type { TodoItem } from '../../types'
import { applySwipeResistance, getSwipeThreshold } from '../../utils/habitCard'
import { hapticEvent } from '../../utils/haptics'
import { motionMs } from '../../utils/motion'
import {
  beginPointerGesture,
  finishPointerGesture,
  updatePointerGesture,
  type PointerGestureSession,
} from '../../utils/pointerGesture'
import { resolvesDirectionalSwipe } from '../../utils/todo'
import { useLongPressGesture } from '../../utils/useLongPressGesture'
import { useReducedMotion } from '../../utils/useReducedMotion'

export default function TodoTaskCard({
  todo,
  index,
  editing,
  newlyAdded,
  onCommitEdit,
  onComplete,
  onManage,
}: {
  todo: TodoItem
  index: number
  editing: boolean
  newlyAdded: boolean
  onCommitEdit: (text: string) => void
  onComplete: (thresholdSignalled: boolean) => void
  onManage: () => void
}) {
  const [draft, setDraft] = useState(todo.text)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [committing, setCommitting] = useState(false)
  const reducedMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const pointerRef = useRef<PointerGestureSession | null>(null)
  const dragXRef = useRef(0)
  const widthRef = useRef(340)
  const thresholdRef = useRef(getSwipeThreshold(340))
  const thresholdHitRef = useRef(false)
  const commitTimerRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)

  useEffect(() => { setDraft(todo.text) }, [todo.text])
  useEffect(() => {
    if (!editing) return
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [editing])
  useEffect(() => () => {
    if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current)
  }, [])

  const setPosition = (value: number) => {
    dragXRef.current = value
    setDragX(value)
  }

  const reset = () => {
    finishPointerGesture(pointerRef.current)
    pointerRef.current = null
    thresholdHitRef.current = false
    longPress.cancel()
    setDragging(false)
    setPosition(0)
  }

  const complete = () => {
    if (committing) return
    setCommitting(true)
    setDragging(false)
    setPosition(widthRef.current + 120)
    commitTimerRef.current = window.setTimeout(() => onComplete(thresholdHitRef.current), motionMs('result', reducedMotion))
  }

  const openManagement = () => {
    if (dragging || committing) return
    suppressClickRef.current = true
    pointerRef.current = null
    setDragging(false)
    onManage()
  }

  const longPress = useLongPressGesture({
    onLongPress: openManagement,
    disabled: editing || committing,
    capturePointer: false,
  })

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (editing || committing || event.button !== 0) return
    const pointer = beginPointerGesture(event)
    if (!pointer) return
    widthRef.current = event.currentTarget.getBoundingClientRect().width
    thresholdRef.current = getSwipeThreshold(widthRef.current)
    pointerRef.current = pointer
    thresholdHitRef.current = false
    longPress.start(event)
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId || committing) return
    longPress.move(event)
    const update = updatePointerGesture(pointer, event)
    if (!update) return
    if (update.axis === 'vertical') {
      pointerRef.current = null
      longPress.cancel()
      thresholdHitRef.current = false
      setDragging(false)
      setPosition(0)
      return
    }
    if (update.previousAxis === 'pending' && update.axis === 'horizontal') {
      longPress.cancel()
      suppressClickRef.current = true
      setDragging(true)
    }
    if (update.axis !== 'horizontal') return
    const next = Math.max(0, applySwipeResistance(update.deltaX, thresholdRef.current, widthRef.current))
    setPosition(next)
    if (next >= thresholdRef.current && !thresholdHitRef.current) {
      thresholdHitRef.current = true
      void hapticEvent('gesture-threshold')
    }
  }

  const onPointerEnd = (event: PointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId || committing) return
    pointerRef.current = null
    finishPointerGesture(pointer)
    longPress.end(event)
    setDragging(false)
    if (pointer.axis === 'horizontal' && resolvesDirectionalSwipe(dragXRef.current, pointer.velocityX, thresholdRef.current, 'right')) complete()
    else reset()
  }

  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (longPress.consumeClick()) return
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (event.detail === 0 && !editing && !committing) longPress.trigger(false)
  }

  const onContextMenu = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault()
    longPress.trigger(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
      event.preventDefault()
      longPress.trigger(false)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      complete()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      longPress.trigger(false)
    }
  }

  const swipeProgress = Math.min(1, dragX / thresholdRef.current)

  return (
    <article
      className={`todo-task-card long-press-surface ${todo.pinned ? 'todo-task-card--pinned' : ''} ${dragging ? 'todo-task-card--dragging' : ''} ${committing ? 'todo-task-card--committing' : ''} ${longPress.isPressing ? 'todo-task-card--pressing' : ''} ${newlyAdded ? 'todo-task-card--new' : ''}`}
      data-long-pressing={longPress.isPressing}
      style={{ '--todo-swipe-x': `${dragX}px`, '--todo-swipe-progress': swipeProgress, '--todo-card-index': index } as CSSProperties}
    >
      <span className="todo-task-card__action" aria-hidden><b>✓</b><strong>Tamamla</strong></span>
      <span className="long-press-progress" aria-hidden />
      <div
        className="todo-task-card__surface"
        role="button"
        tabIndex={editing ? -1 : 0}
        aria-label={`${todo.text}. Sağa kaydırarak tamamla; düzenlemek ve yönetmek için uzun bas.`}
        aria-keyshortcuts="ArrowRight Shift+F10 Enter"
        aria-haspopup="dialog"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={reset}
        onLostPointerCapture={(event) => {
          if (pointerRef.current?.pointerId === event.pointerId) reset()
        }}
      >
        <span className="todo-task-card__index">{String(index + 1).padStart(2, '0')}</span>
        <span className="todo-task-card__copy">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              maxLength={140}
              onChange={(event) => setDraft(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onBlur={() => onCommitEdit(draft.trim() || todo.text)}
              onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === 'Enter') onCommitEdit(draft.trim() || todo.text)
                if (event.key === 'Escape') onCommitEdit(todo.text)
              }}
              aria-label="Görev metni"
            />
          ) : <strong>{todo.text}</strong>}
          <small>{todo.pinned ? 'Öne çıkarıldı' : 'Sağa kaydır ve tamamla'}</small>
        </span>
        <span className="todo-task-card__marker" aria-hidden>{todo.pinned ? '◆' : '→'}</span>
      </div>
    </article>
  )
}
