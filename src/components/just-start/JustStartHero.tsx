import type { CSSProperties } from 'react'

export type JustStartVisualState = 'ready' | 'running' | 'paused' | 'celebrating' | 'complete'

function LightningIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path d="M18.8 2.5 7.7 18h7.1l-1.5 11.5L24.7 14h-7.2l1.3-11.5Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  )
}

export default function JustStartHero({
  state,
  stepIndex,
  stepMinutes,
  time,
  stepProgress,
  completedMinutes,
  totalMinutes,
  rewardGranted,
}: {
  state: JustStartVisualState
  stepIndex: number
  stepMinutes: number
  time: string
  stepProgress: number
  completedMinutes: number
  totalMinutes: number
  rewardGranted: boolean
}) {
  const progress = Math.min(1, Math.max(0, stepProgress))
  const active = state === 'running' || state === 'paused'

  return (
    <section
      className={`just-start-hero just-start-hero--${state}`}
      style={{ '--just-start-step-progress': progress } as CSSProperties}
      aria-label={active ? `${stepMinutes} dakikalık adım, kalan süre ${time}` : undefined}
    >
      <div className="just-start-hero__atmosphere" aria-hidden />
      <div className="just-start-hero__topline">
        <span>ADIM {Math.min(stepIndex + 1, 10)} / 10</span>
        <strong>{completedMinutes} / {totalMinutes} DK</strong>
      </div>

      <div className="just-start-hero__content">
        <div className="just-start-hero__core" aria-hidden>
          <span><LightningIcon /></span>
          <i />
        </div>

        {state === 'complete' ? (
          <div key="complete" className="just-start-hero__message just-start-hero__message--complete">
            <span className="just-start-hero__check" aria-hidden>✓</span>
            <p>Momentum tamamlandı</p>
            <h1>115 dk</h1>
            <small>{rewardGranted ? '+50 XP hesabına eklendi' : 'Bugünün turu kaydedildi'}</small>
          </div>
        ) : state === 'celebrating' ? (
          <div key="celebrating" className="just-start-hero__message just-start-hero__message--celebrating" role="status">
            <span className="just-start-hero__check" aria-hidden>✓</span>
            <h1>+{stepMinutes} dk</h1>
            <small>Momentum yükseldi</small>
          </div>
        ) : (
          <div key={state} className="just-start-hero__message">
            <p>{state === 'paused' ? 'MOMENTUM BEKLİYOR' : active ? 'ŞİMDİ AKIŞTA' : 'SIRADAKİ ADIM'}</p>
            <h1>{active ? time : `${stepMinutes} dk`}</h1>
            <small>
              {state === 'paused'
                ? 'Hazır olduğunda aynı yerden devam et.'
                : active
                  ? 'Tek yapman gereken bu adımda kalmak.'
                  : stepMinutes === 1
                    ? 'Bir dakika yeter. Gerisi sonra gelir.'
                    : `Sadece ${stepMinutes} dakika daha ileri.`}
            </small>
          </div>
        )}
      </div>

      <div className="just-start-hero__step-track" aria-hidden>
        <span />
      </div>
    </section>
  )
}
