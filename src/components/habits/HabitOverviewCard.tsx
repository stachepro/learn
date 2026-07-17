import { type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import type { Category, Habit } from '../../types'
import type { HabitOverview } from '../../utils/habitOverview'
import { getHabitCardShape, normalizeHabitCardColor } from '../../utils/habitCard'
import { useLongPressGesture } from '../../utils/useLongPressGesture'
import LuupiIcon from '../ui/LuupiIcon'

interface Props {
  habit: Habit
  category?: Category
  overview: HabitOverview
  index: number
  onOpen: () => void
  onManage: () => void
}

export default function HabitOverviewCard({ habit, category, overview, index, onOpen, onManage }: Props) {
  const shape = getHabitCardShape(habit.id)
  const longPress = useLongPressGesture({ onLongPress: onManage })

  const onClick = () => {
    if (longPress.consumeClick()) return
    onOpen()
  }

  const onContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    longPress.trigger(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
      event.preventDefault()
      longPress.trigger(false)
    }
  }

  return (
    <>
    <button
      type="button"
      className={`habit-overview-card ${longPress.isPressing ? 'habit-overview-card--pressed' : ''}`}
      style={{
        '--habit-overview-seed': normalizeHabitCardColor(habit.labelColor || category?.color),
        '--habit-card-delay': `${Math.min(index * 55, 330)}ms`,
      } as CSSProperties}
      onClick={onClick}
      onPointerDown={longPress.start}
      onPointerMove={longPress.move}
      onPointerUp={longPress.end}
      onPointerCancel={longPress.cancel}
      onLostPointerCapture={longPress.lostCapture}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') longPress.cancel() }}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      aria-haspopup="dialog"
      aria-keyshortcuts="Shift+F10"
      aria-label={`${habit.name}. Son 30 günde ${overview.completed} tamamlandı, ${overview.skipped} atlandı. Detay için aç; yönetmek için uzun bas.`}
    >
      <span className="habit-overview-card__hold-progress" aria-hidden />

      <span className="habit-overview-card__identity-panel">
        <span className={`habit-overview-card__totem habit-overview-card__totem--${shape}`} aria-hidden><LuupiIcon name={habit.icon} size={32} /></span>
        <span className="habit-overview-card__identity">
          <strong>{habit.name}</strong>
          <small>{category && <LuupiIcon name={category.icon} size={14} />} {category?.name ?? 'Alışkanlık'}</small>
        </span>
        <span className="habit-overview-card__manage-cue" aria-hidden />
      </span>

      <span className="habit-overview-card__rhythm" aria-hidden>
        <span className="habit-overview-card__timeline">
          <span>30 gün önce</span>
          <span>Bugün</span>
        </span>
        <span className="habit-overview-grid">
          {overview.days.map((day) => {
            const skipKind = day.status === 'skipped'
              ? day.explicitlySkipped ? ' habit-overview-grid__day--explicit-skip' : ' habit-overview-grid__day--missed'
              : ''
            return (
              <span
                key={day.date}
                className={`habit-overview-grid__day habit-overview-grid__day--${day.status}${skipKind}`}
              />
            )
          })}
        </span>
      </span>

      <span className="habit-overview-card__summary">
        <span><i className="habit-overview-card__dot habit-overview-card__dot--done" /> <strong>{overview.completed}</strong> tamamlandı</span>
        <span className="habit-overview-card__divider">·</span>
        <span><i className="habit-overview-card__dot habit-overview-card__dot--skip" /> <strong>{overview.skipped}</strong> atlandı</span>
      </span>
    </button>
    <button type="button" className="sr-only" onClick={() => longPress.trigger(false)} aria-label={`${habit.name} alışkanlığını yönet`}>
      {habit.name} alışkanlığını yönet
    </button>
    </>
  )
}
