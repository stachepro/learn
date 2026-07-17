import { formatWaterAmount } from '../../utils/water'

function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.5 6.6 9.3a7 7 0 1 0 10.8 0L12 2.5Z" />
      <path d="M8.8 15.1a3.8 3.8 0 0 0 2.4 2.5" />
    </svg>
  )
}

export default function WaterHero({ total, goal, pulseKey, onGoal }: {
  total: number
  goal: number
  pulseKey: number
  onGoal: () => void
}) {
  const progress = Math.min(100, Math.round((total / Math.max(goal, 1)) * 100))
  const remaining = Math.max(0, goal - total)
  const excess = Math.max(0, total - goal)

  return (
    <section key={pulseKey} className={`water-hero ${pulseKey > 0 ? 'water-hero--pour' : ''}`} aria-labelledby="water-total-title">
      <div className="water-hero__halo" aria-hidden />
      <header className="water-hero__header">
        <div>
          <span>BUGÜNÜN SU RİTMİ</span>
          <strong>{progress >= 100 ? 'Hedef tamamlandı' : 'Ritmin devam ediyor'}</strong>
        </div>
        <button type="button" onClick={onGoal} className="water-hero__goal" aria-label={`Günlük hedefi düzenle. Şu an ${formatWaterAmount(goal)}`}>
          Hedef {formatWaterAmount(goal)} <span aria-hidden>›</span>
        </button>
      </header>

      <div className="water-hero__stage">
        <div className="water-vessel" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(total, goal)} aria-label={`Su hedefinin yüzde ${progress}'i tamamlandı`}>
          <div className="water-vessel__fill" style={{ '--water-level': `${progress}%` } as React.CSSProperties}>
            <span className="water-vessel__wave" />
            <span className="water-vessel__bubble water-vessel__bubble--one" />
            <span className="water-vessel__bubble water-vessel__bubble--two" />
          </div>
          <span className="water-vessel__shine" aria-hidden />
          <span className="water-vessel__drop"><DropIcon /></span>
        </div>

        <div className="water-hero__metric">
          <p id="water-total-title"><strong>{formatWaterAmount(total)}</strong><span>/ {formatWaterAmount(goal)}</span></p>
          <div className="water-hero__progress"><i style={{ width: `${progress}%` }} /></div>
          <p className="water-hero__remaining">
            {remaining > 0 ? <><b>{formatWaterAmount(remaining)}</b> kaldı</> : <><b>+{formatWaterAmount(excess)}</b> hedef üstü</>}
          </p>
        </div>
      </div>
    </section>
  )
}
