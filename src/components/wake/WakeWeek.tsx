import type { WakeRecord } from '../../types'
import { addDaysStr } from '../../utils/date'
import { isWakeOnGoal } from '../../utils/wake'

function dayLabel(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '')
}

export default function WakeWeek({ records, today, goal }: { records: WakeRecord[]; today: string; goal: string | null }) {
  const days = Array.from({ length: 7 }, (_, index) => addDaysStr(today, index - 6))
  const byDate = new Map(records.map((record) => [record.date, record]))
  return (
    <section className="wake-week" aria-labelledby="wake-week-title">
      <header><div><span>SON 7 GÜN</span><h2 id="wake-week-title">Sabah ritmin</h2></div><small>{days.filter((date) => byDate.has(date)).length}/7 kayıt</small></header>
      <div className="wake-week__days">
        {days.map((date) => {
          const record = byDate.get(date)
          const onGoal = record ? isWakeOnGoal(record, goal) : null
          return (
            <div key={date} className={`${record ? 'is-recorded' : ''} ${onGoal === true ? 'is-on-goal' : ''} ${date === today ? 'is-today' : ''}`}>
              <span>{dayLabel(date)}</span>
              <i>{record ? <b>{onGoal === true ? '✓' : '●'}</b> : null}</i>
              <small>{record?.time ?? '—'}</small>
            </div>
          )
        })}
      </div>
      <footer><span><i className="is-on-goal" /> Hedefte</span><span><i className="is-recorded" /> Kaydedildi</span><span><i /> Boş</span></footer>
    </section>
  )
}
