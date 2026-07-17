import type { WakeRecord } from '../../types'
import { useLongPressGesture } from '../../utils/useLongPressGesture'
import { formatWakeDifference, wakeGoalDifference } from '../../utils/wake'
import AppButton from '../ui/AppButton'
import LuupiIcon from '../ui/LuupiIcon'

function SunGlyph() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="8" />
      <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M37.4 10.6l-4.2 4.2M14.8 33.2l-4.2 4.2" />
    </svg>
  )
}

export default function WakeHero({ nowTime, record, goal, streak, celebrating, onWake, onManage }: {
  nowTime: string
  record: WakeRecord | undefined
  goal: string | null
  streak: number
  celebrating: boolean
  onWake: () => void
  onManage: () => void
}) {
  const longPress = useLongPressGesture({ onLongPress: onManage, disabled: !record })
  const recordGoal = record?.goal === undefined ? goal : record.goal
  const difference = record && recordGoal ? wakeGoalDifference(record.time, recordGoal) : null

  return (
    <section
      className={`wake-hero long-press-surface ${record ? 'wake-hero--complete' : ''} ${celebrating ? 'wake-hero--celebrating' : ''} ${longPress.isPressing ? 'wake-hero--pressing' : ''}`}
      data-long-pressing={longPress.isPressing}
      onPointerDown={longPress.start}
      onPointerMove={longPress.move}
      onPointerUp={longPress.end}
      onPointerCancel={longPress.cancel}
      onLostPointerCapture={longPress.lostCapture}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') longPress.cancel() }}
      onContextMenu={(event) => { if (!record) return; event.preventDefault(); longPress.trigger(false) }}
      onClick={(event) => { if (record && event.detail === 0) longPress.trigger(false) }}
      onKeyDown={(event) => {
        if (!record) return
        if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') { event.preventDefault(); longPress.trigger(false) }
      }}
      tabIndex={record ? 0 : undefined}
      role={record ? 'button' : undefined}
      aria-haspopup={record ? 'dialog' : undefined}
      aria-keyshortcuts={record ? 'Shift+F10' : undefined}
      aria-label={record ? `Bugün ${record.time} saatinde uyandın. Yönetmek için basılı tut.` : undefined}
    >
      <span className="long-press-progress" aria-hidden />
      <div className="wake-hero__sky" aria-hidden><span /><span /><span /></div>
      <div className="wake-hero__horizon" aria-hidden />
      <div className="wake-hero__sun" aria-hidden><i /><span><SunGlyph /></span></div>

      {!record ? (
        <div className="wake-hero__content">
          <span className="wake-hero__eyebrow">ŞU AN</span>
          <strong className="wake-hero__time">{nowTime}</strong>
          <p>{goal ? <>Hedefin <b>{goal}</b> · Güne hazır olduğunda dokun.</> : 'Hedef koymadan da bugünü kaydedebilirsin.'}</p>
      <AppButton className="wake-hero__cta" tone="primary" size="lg" block haptic="none" onClick={onWake} leadingIcon={<LuupiIcon name="sunrise" size={20} />}>
            Uyandım, Günü Başlat
          </AppButton>
        </div>
      ) : (
        <div className="wake-hero__content wake-hero__result">
          <span className="wake-hero__eyebrow">GÜN BAŞLADI</span>
          <strong className="wake-hero__time">{record.time}</strong>
          <p>{difference === null ? 'Bugünün başlangıç saati kaydedildi.' : formatWakeDifference(difference)}</p>
          <div className="wake-hero__reward"><span aria-hidden>✦</span><strong>{streak} günlük sabah ritmi</strong></div>
          <small>Kaydı yönetmek için basılı tut</small>
        </div>
      )}
    </section>
  )
}
