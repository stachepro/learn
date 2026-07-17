import type { WaterEntry } from '../../types'
import { formatWaterAmount } from '../../utils/water'

function positionForTime(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return Math.min(100, Math.max(0, ((hour * 60 + minute) / (24 * 60)) * 100))
}

export default function WaterRhythm({ entries, historyCount, onOpenHistory }: { entries: WaterEntry[]; historyCount: number; onOpenHistory: () => void }) {
  const latest = entries.at(-1)
  return (
    <section className="water-rhythm" aria-labelledby="water-rhythm-title">
      <header>
        <div><span>GÜNLÜK RİTİM</span><h2 id="water-rhythm-title">Günün akışı</h2></div>
        <button type="button" onClick={onOpenHistory} disabled={historyCount === 0}>
          {entries.length > 0 ? `${entries.length} kayıt` : historyCount > 0 ? 'Geçmiş' : 'Kayıt yok'} <span aria-hidden>›</span>
        </button>
      </header>
      <div className="water-rhythm__track" aria-label={`${entries.length} su kaydı`}>
        <i />
        {entries.map((entry, index) => (
          <span key={entry.id} className={index === entries.length - 1 ? 'water-rhythm__drop--latest' : ''} style={{ left: `${positionForTime(entry.time)}%` }} title={`${entry.time}, ${formatWaterAmount(entry.ml)}`} />
        ))}
      </div>
      <div className="water-rhythm__hours" aria-hidden><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
      <footer>
        <span>{latest ? `Son kayıt ${latest.time}` : 'İlk su kaydın burada görünecek'}</span>
        <strong>{latest ? formatWaterAmount(latest.ml) : 'Henüz başlamadın'}</strong>
      </footer>
    </section>
  )
}
