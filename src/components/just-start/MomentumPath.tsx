import type { CSSProperties } from 'react'

const STEPS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30]

function nodePosition(index: number): { left: string; top: string } {
  const slot = index < 5 ? index : 9 - index
  return {
    left: `${8 + slot * 21}%`,
    top: index < 5 ? '29%' : '73%',
  }
}

export default function MomentumPath({
  done,
  active,
  activeProgress,
}: {
  done: boolean[]
  active: number | null
  activeProgress: number
}) {
  const completedCount = done.filter(Boolean).length
  const routeProgress = Math.min(1, (completedCount + (active === null ? 0 : activeProgress)) / STEPS.length)
  const nextIndex = done.findIndex((value) => !value)

  return (
    <section className="momentum-path" aria-labelledby="momentum-path-title">
      <header className="momentum-path__header">
        <div>
          <span>BUGÜNÜN ROTASI</span>
          <h2 id="momentum-path-title">Momentum yolu</h2>
        </div>
        <strong>{completedCount}<small>/10</small></strong>
      </header>

      <div className="momentum-path__map" style={{ '--momentum-route-progress': routeProgress } as CSSProperties}>
        <span className="momentum-path__phase momentum-path__phase--warm">ISINMA</span>
        <span className="momentum-path__phase momentum-path__phase--flow">AKIŞ</span>
        <svg viewBox="0 0 500 176" preserveAspectRatio="none" aria-hidden>
          <path className="momentum-path__route" pathLength="100" d="M40 51 H460 C485 51 485 129 460 129 H40" />
          <path className="momentum-path__route momentum-path__route--energy" pathLength="100" d="M40 51 H460 C485 51 485 129 460 129 H40" />
        </svg>

        <ol aria-label="Just Start adımları">
          {STEPS.map((minutes, index) => {
            const status = done[index] ? 'done' : active === index ? 'active' : index === nextIndex ? 'next' : 'future'
            return (
              <li
                key={minutes}
                className={`momentum-path__node momentum-path__node--${status}`}
                style={nodePosition(index)}
                aria-label={`${index + 1}. adım, ${minutes} dakika, ${status === 'done' ? 'tamamlandı' : status === 'active' ? 'devam ediyor' : status === 'next' ? 'sıradaki' : 'bekliyor'}`}
              >
                <span>{status === 'done' ? '✓' : minutes}</span>
                <small>{status === 'done' ? `${minutes} dk` : 'dk'}</small>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
