import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'
import { sessionLabel, calcDayScore, type DaySummary } from '../utils/daySummary'
import { formatMl } from '../utils/water'
import { formatMinutes, formatHMS } from '../utils/date'

/* ════════════════════════════════════════════════════════
   GÜNLÜK ÖZET STORY — Instagram story akışıyla tam ekran
   slayt gösterisi. Üstte segment bar; tek dokunuş → sonraki
   slayt, basılı tut → duraklat (`.story-paused *` kuralı tüm
   CSS animasyonlarını dondurur; bu yüzden slayt içi koreografi
   JS zamanlayıcıyla değil animation-delay ile kurulur).
   Slayt listesi veriye göre kurulur: hedef girilmemiş su/uyanma
   ve o gün tamamlanmamış araçlar hiç slayt almaz.
   ════════════════════════════════════════════════════════ */

const TAP_MAX_MS = 260

type SlideKind = 'habits' | 'water' | 'wake' | 'pomodoro' | 'norush' | 'todo' | 'score'

interface Slide { kind: SlideKind; duration: number }

function buildSlides(s: DaySummary): Slide[] {
  const slides: Slide[] = []
  if (s.habitEntries.length > 0)
    slides.push({ kind: 'habits', duration: Math.min(10000, Math.max(5200, 3800 + s.doneCount * 600)) })
  if (s.water) slides.push({ kind: 'water', duration: 6000 })
  if (s.wake) slides.push({ kind: 'wake', duration: 6000 })
  if (s.sessions.length > 0) slides.push({ kind: 'pomodoro', duration: 5200 })
  if (s.noRush.length > 0) slides.push({ kind: 'norush', duration: 5200 })
  if (s.todos.length > 0) slides.push({ kind: 'todo', duration: 5200 })
  slides.push({ kind: 'score', duration: 7000 })
  return slides
}

const SLIDE_BG: Record<SlideKind, string> = {
  habits:   'linear-gradient(165deg, #431407 0%, #9a3412 42%, #f59e0b 125%)',
  water:    'linear-gradient(170deg, #082f49 0%, #075985 45%, #0ea5e9 125%)',
  wake:     'linear-gradient(180deg, #1e1b4b 0%, #6d28d9 38%, #ea580c 82%, #fcd34d 115%)',
  pomodoro: 'linear-gradient(165deg, #450a0a 0%, #b91c1c 48%, #fb923c 130%)',
  norush:   'linear-gradient(165deg, #292018 0%, #6b4a35 52%, #d6b494 135%)',
  todo:     'linear-gradient(165deg, #052e16 0%, #15803d 52%, #86efac 135%)',
  score:    'linear-gradient(160deg, #1e1b4b 0%, #6d28d9 42%, #f59e0b 128%)',
}

export default function SummaryStory({ summary, onClose }: { summary: DaySummary; onClose: () => void }) {
  const { habits } = useApp()
  const [slides] = useState(() => buildSlides(summary))
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const downAtRef = useRef(0)
  const slide = slides[idx]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])

  const next = () => {
    if (idx >= slides.length - 1) onClose()
    else setIdx(idx + 1)
  }

  const onPointerDown = () => {
    downAtRef.current = Date.now()
    setPaused(true)
  }
  const onPointerUp = () => {
    const wasTap = Date.now() - downAtRef.current < TAP_MAX_MS
    setPaused(false)
    if (wasTap) next()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] overflow-hidden animate-fade-in select-none"
      style={{ background: SLIDE_BG[slide.kind], transition: 'background 0.5s ease', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setPaused(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Segment bar */}
      <div
        className="absolute inset-x-0 flex gap-1.5 px-3 z-20"
        style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}
      >
        {slides.map((sl, i) => (
          <div key={i} className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.28)' }}>
            {i < idx && <div className="h-full rounded-full" style={{ background: '#fff' }} />}
            {i === idx && (
              <div
                key={`fill-${idx}`}
                className="h-full rounded-full story-seg-fill"
                style={{
                  background: '#fff',
                  animationDuration: `${sl.duration}ms`,
                  animationPlayState: paused ? 'paused' : 'running',
                }}
                onAnimationEnd={next}
              />
            )}
          </div>
        ))}
      </div>

      {/* Kapat */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        aria-label="Kapat"
        className="absolute right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center btn-press"
        style={{ top: 'calc(env(safe-area-inset-top) + 26px)', background: 'rgba(0,0,0,0.25)', color: 'rgba(255,255,255,0.9)' }}
      >
        ✕
      </button>

      {/* Slayt içeriği — key remount + paused sınıfı tüm animasyonları dondurur */}
      <div key={idx} className={`absolute inset-0 story-slide-in ${paused ? 'story-paused' : ''}`}>
        {slide.kind === 'habits' && <HabitsSlide s={summary} />}
        {slide.kind === 'water' && <WaterSlide s={summary} />}
        {slide.kind === 'wake' && <WakeSlide s={summary} />}
        {slide.kind === 'pomodoro' && <PomodoroSlide s={summary} habits={habits} />}
        {slide.kind === 'norush' && <NoRushSlide s={summary} />}
        {slide.kind === 'todo' && <TodoSlide s={summary} />}
        {slide.kind === 'score' && <ScoreSlide s={summary} />}
      </div>
    </div>,
    document.body,
  )
}

/* ── Ortak parçalar ── */

function SlideShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="h-full flex flex-col items-center justify-center px-7 text-center"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 40px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
    >
      <p className="story-up text-[11px] font-black uppercase tracking-[0.3em] mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function BigLine({ children, delay, size = 'text-3xl' }: { children: ReactNode; delay: number; size?: string }) {
  return (
    <p className={`story-up display ${size} font-extrabold leading-tight`} style={{ color: '#fff', animationDelay: `${delay}ms`, textShadow: '0 2px 24px rgba(0,0,0,0.25)' }}>
      {children}
    </p>
  )
}

/* Konfeti — story katmanının İÇİNDE yaşar (global Confetti z-60'ta kalırdı) */
const CONFETTI_COLORS = ['#fde68a', '#fff', '#86efac', '#7dd3fc', '#f9a8d4', '#fdba74']
function StoryConfetti({ delay = 0 }: { delay?: number }) {
  const pieces = Array.from({ length: 30 }).map((_, i) => ({
    left: (i * 37 + 11) % 100,
    delay: delay + (i % 10) * 0.14,
    dur: 2.4 + ((i * 7) % 10) / 7,
    dx: ((i % 5) - 2) * 40,
    rot: 360 + (i % 4) * 180,
    w: 6 + (i % 3) * 2,
    h: 10 + ((i + 1) % 3) * 3,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }))
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pieces.map((c, i) => (
        <span
          key={i}
          className="js-confetti"
          style={{
            left: `${c.left}%`, width: c.w, height: c.h,
            background: c.color, borderRadius: 2, opacity: 0,
            '--dx': `${c.dx}px`, '--rot': `${c.rot}deg`,
            '--dur': `${c.dur}s`, '--delay': `${c.delay}s`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}

/* ── 1. Alışkanlıklar ── */
function HabitsSlide({ s }: { s: DaySummary }) {
  const done = s.habitEntries.filter(({ log }) => log.completed)
  return (
    <>
      {done.length > 0 && <StoryConfetti delay={1.5} />}
      <SlideShell label="Alışkanlıklar">
        <BigLine delay={150}>Bugün {s.habitEntries.length} alışkanlığın vardı</BigLine>
        <BigLine delay={650} size="text-xl">bakalım hangilerini yaptın 👀</BigLine>

        {done.length > 0 ? (
          <div className="mt-8 space-y-2.5 w-full max-w-xs">
            {done.map(({ habit }, i) => (
              <div
                key={habit.id}
                className="story-chip flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
                style={{
                  animationDelay: `${1700 + i * 600}ms`,
                  background: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <span className="text-2xl leading-none flex-shrink-0">{habit.emoji}</span>
                <p className="text-sm font-bold flex-1 min-w-0" style={{ color: '#fff', overflowWrap: 'anywhere' }}>{habit.name}</p>
                <span className="text-base flex-shrink-0">✅</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="story-up mt-8" style={{ animationDelay: '1700ms' }}>
            <p className="text-4xl mb-3">🫂</p>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Bugün hiçbirini tamamlayamadın —<br />yarın alev yeniden yanar
            </p>
          </div>
        )}

        <p
          className="story-up display text-lg font-black tnum mt-8 px-5 py-2 rounded-full"
          style={{ animationDelay: `${done.length > 0 ? 1900 + done.length * 600 : 2400}ms`, background: 'rgba(0,0,0,0.22)', color: '#fff' }}
        >
          {s.doneCount}/{s.habitEntries.length} tamamlandı
        </p>
      </SlideShell>
    </>
  )
}

/* ── 2. Su ── */
function WaterSlide({ s }: { s: DaySummary }) {
  const { goal, actual } = s.water!
  const pct = Math.min(100, Math.round((actual / goal) * 100))
  const met = actual >= goal
  return (
    <>
      {met && <StoryConfetti delay={2.4} />}
      <SlideShell label="Su Takibi">
        <BigLine delay={150}>{formatMl(goal)} su içmek istedin</BigLine>
        <BigLine delay={650} size="text-xl">bakalım içebildin mi 💧</BigLine>

        {/* Bardak: dalga yüzeyli su seviyesi hedefe oranla yükselir */}
        <div
          className="story-up relative mt-9 overflow-hidden"
          style={{
            animationDelay: '1200ms',
            width: 150, height: 210, borderRadius: '28px 28px 34px 34px',
            border: '3px solid rgba(255,255,255,0.55)',
            background: 'rgba(255,255,255,0.08)',
            boxShadow: '0 18px 50px -18px rgba(0,0,0,0.45), inset 0 2px 14px rgba(255,255,255,0.12)',
          }}
        >
          <div
            className="story-rise absolute inset-x-0 bottom-0"
            style={{
              '--level': `${Math.max(6, pct)}%`,
              animationDelay: '1500ms',
              background: 'linear-gradient(180deg, #7dd3fc 0%, #38bdf8 55%, #0284c7 100%)',
            } as CSSProperties}
          >
            <svg
              className="story-wave absolute left-0 w-[200%]"
              style={{ top: -9, height: 12 }}
              viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden
            >
              <path d="M0 12 Q 12.5 0 25 6 T 50 6 T 75 6 T 100 6 T 125 6 T 150 6 T 175 6 T 200 6 V 12 Z" fill="#7dd3fc" />
            </svg>
            {[18, 52, 86].map((left, i) => (
              <span
                key={i}
                className="story-bubble absolute rounded-full"
                style={{
                  left: `${left}%`, bottom: 6, width: 6 + i * 2, height: 6 + i * 2,
                  background: 'rgba(255,255,255,0.5)',
                  animationDelay: `${2 + i * 0.7}s`,
                }}
              />
            ))}
          </div>
          <p
            className="story-up display absolute inset-x-0 top-1/2 -translate-y-1/2 text-3xl font-black tnum"
            style={{ animationDelay: '2400ms', color: '#fff', textShadow: '0 2px 12px rgba(2,60,105,0.6)' }}
          >
            %{pct}
          </p>
        </div>

        <p className="story-up display text-2xl font-extrabold tnum mt-7" style={{ animationDelay: '3000ms', color: '#fff' }}>
          {formatMl(actual)} <span className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>/ {formatMl(goal)}</span>
        </p>
        <p className="story-up text-sm font-semibold mt-2" style={{ animationDelay: '3400ms', color: 'rgba(255,255,255,0.85)' }}>
          {met ? 'Hedefini vurdun, bravo! 🎉' : actual > 0 ? `${formatMl(goal - actual)} eksik kaldı — yarın tamamla 💪` : 'Bugün hiç kayıt girmedin 🥲'}
        </p>
      </SlideShell>
    </>
  )
}

/* ── 3. Uyanma ── */
function WakeSlide({ s }: { s: DaySummary }) {
  const { goal, actualTime, onTime } = s.wake!
  return (
    <SlideShell label="Uyanma">
      {/* Yıldızlar sönerken güneş tepeler ardından doğar */}
      <div className="absolute inset-x-0 top-0 h-1/2 pointer-events-none" aria-hidden>
        {[12, 30, 55, 74, 88].map((left, i) => (
          <span
            key={i}
            className="story-star absolute rounded-full"
            style={{ left: `${left}%`, top: `${14 + (i % 3) * 14}%`, width: 3, height: 3, background: '#fff', animationDelay: `${0.4 + i * 0.18}s` }}
          />
        ))}
      </div>
      <div className="story-up relative mb-8 overflow-hidden" style={{ animationDelay: '1100ms', width: 220, height: 130 }} aria-hidden>
        <div
          className="story-sun absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            animationDelay: '1300ms',
            bottom: 8, width: 84, height: 84,
            background: 'radial-gradient(circle at 38% 34%, #fff7dd, #fde68a 45%, #fbbf24 78%, #f97316)',
            boxShadow: '0 0 60px 22px rgba(251,191,36,0.45)',
          }}
        />
        <div className="absolute rounded-[50%]" style={{ left: -40, bottom: -46, width: 190, height: 100, background: 'rgba(30,27,75,0.85)' }} />
        <div className="absolute rounded-[50%]" style={{ right: -50, bottom: -56, width: 210, height: 105, background: 'rgba(30,27,75,0.65)' }} />
      </div>

      <BigLine delay={150}>Saat {goal}'de uyanacaktın</BigLine>
      <BigLine delay={650} size="text-xl">bakalım kaçta uyandın ⏰</BigLine>

      <div className="flex items-center gap-3 mt-8 w-full max-w-xs">
        <StoryTimeBox label="Hedef" value={goal} delay={2200} />
        <span className="story-up text-2xl" style={{ animationDelay: '2600ms', color: 'rgba(255,255,255,0.6)' }}>→</span>
        <StoryTimeBox label="Uyanış" value={actualTime ?? '--:--'} delay={2800} highlight={actualTime ? (onTime ? 'good' : 'late') : undefined} />
      </div>

      <p className="story-up text-sm font-semibold mt-6" style={{ animationDelay: '3400ms', color: 'rgba(255,255,255,0.9)' }}>
        {actualTime
          ? onTime ? 'Hedefinden önce ayaktaydın, erkenci kuş! 🐦' : 'Biraz geç oldu ama kalktın ya 😌'
          : 'Bugün uyanma kaydı girmedin 😴'}
      </p>
    </SlideShell>
  )
}

function StoryTimeBox({ label, value, delay, highlight }: { label: string; value: string; delay: number; highlight?: 'good' | 'late' }) {
  return (
    <div
      className="story-chip flex-1 rounded-2xl px-3 py-4"
      style={{
        animationDelay: `${delay}ms`,
        background: 'rgba(255,255,255,0.14)',
        border: `1.5px solid ${highlight === 'good' ? 'rgba(134,239,172,0.8)' : highlight === 'late' ? 'rgba(253,186,116,0.8)' : 'rgba(255,255,255,0.3)'}`,
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <p className="display text-3xl font-black tnum leading-none" style={{ color: highlight === 'good' ? '#86efac' : highlight === 'late' ? '#fdba74' : '#fff' }}>
        {value}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</p>
    </div>
  )
}

/* ── 4–6. Araç slaytları ── */
function ToolSlide({ label, emoji, headline, sub, items, footer }: {
  label: string; emoji: string; headline: string; sub?: string
  items: { key: string; icon: string; text: string; right: string }[]
  footer?: string
}) {
  const shown = items.slice(0, 4)
  const more = items.length - shown.length
  return (
    <SlideShell label={label}>
      <p className="story-hero-emoji text-6xl mb-6" aria-hidden>{emoji}</p>
      <BigLine delay={400}>{headline}</BigLine>
      {sub && <BigLine delay={800} size="text-lg">{sub}</BigLine>}
      <div className="mt-7 space-y-2 w-full max-w-xs">
        {shown.map((it, i) => (
          <div
            key={it.key}
            className="story-chip flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-left"
            style={{
              animationDelay: `${1400 + i * 350}ms`,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.28)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span className="text-lg leading-none flex-shrink-0">{it.icon}</span>
            <p className="text-[13px] font-bold flex-1 min-w-0 truncate" style={{ color: '#fff' }}>{it.text}</p>
            <span className="text-[12px] font-black tnum flex-shrink-0" style={{ color: 'rgba(255,255,255,0.75)' }}>{it.right}</span>
          </div>
        ))}
        {more > 0 && (
          <p className="story-up text-xs font-bold" style={{ animationDelay: `${1400 + shown.length * 350}ms`, color: 'rgba(255,255,255,0.6)' }}>
            +{more} daha
          </p>
        )}
      </div>
      {footer && (
        <p className="story-up display text-lg font-black mt-7 px-5 py-2 rounded-full" style={{ animationDelay: '3000ms', background: 'rgba(0,0,0,0.22)', color: '#fff' }}>
          {footer}
        </p>
      )}
    </SlideShell>
  )
}

function PomodoroSlide({ s, habits }: { s: DaySummary; habits: ReturnType<typeof useApp>['habits'] }) {
  return (
    <ToolSlide
      label="Pomodoro"
      emoji="🍅"
      headline={`${s.sessions.length} pomodoro bitirdin`}
      sub="odak makinesi gibisin 🔥"
      items={s.sessions.map((sess) => {
        const { emoji, name } = sessionLabel(sess, habits)
        return { key: sess.id, icon: emoji, text: name, right: formatMinutes(sess.workDuration) }
      })}
      footer={`Toplam ${formatMinutes(s.totalPomMin)} odak`}
    />
  )
}

function NoRushSlide({ s }: { s: DaySummary }) {
  const totalSec = s.noRush.reduce((a, r) => a + r.totalSeconds, 0)
  return (
    <ToolSlide
      label="Acele Yok"
      emoji="☕"
      headline={`${s.noRush.length} görevi sindire sindire bitirdin`}
      sub="acele etmeden, adım adım 🐢"
      items={s.noRush.map((r) => ({ key: r.id, icon: '✔️', text: r.title, right: `${r.stageCount} aşama` }))}
      footer={`Toplam ${formatHMS(totalSec)}`}
    />
  )
}

function TodoSlide({ s }: { s: DaySummary }) {
  return (
    <ToolSlide
      label="Klasik To-do"
      emoji="📝"
      headline={`${s.todos.length} görevi listeden sildin`}
      sub="çizik atmak gibisi yok ✍️"
      items={s.todos.map((t) => ({ key: t.id, icon: '✅', text: t.text, right: '' }))}
    />
  )
}

/* ── 7. Gün puanı ── */
const RING_R = 80
const RING_C = 2 * Math.PI * RING_R

function ScoreSlide({ s }: { s: DaySummary }) {
  const { score, label, emoji } = calcDayScore(s)

  if (score === null) {
    return (
      <SlideShell label="Gün Puanı">
        <p className="story-hero-emoji text-6xl mb-6" aria-hidden>{emoji}</p>
        <BigLine delay={400}>{label}</BigLine>
        <p className="story-up text-sm font-semibold mt-4" style={{ animationDelay: '1000ms', color: 'rgba(255,255,255,0.8)' }}>
          Alışkanlık ekle, hedef koy —<br />yarın burası bambaşka görünecek 🌱
        </p>
      </SlideShell>
    )
  }

  const scoreText = score.toLocaleString('tr-TR')
  return (
    <>
      {score >= 7.5 && <StoryConfetti delay={1.8} />}
      <SlideShell label="Gün Puanı">
        <BigLine delay={150} size="text-xl">Ve günün puanı...</BigLine>

        <div className="story-up relative mt-8" style={{ animationDelay: '700ms', width: 200, height: 200 }}>
          <span className="story-score-glow absolute inset-0 rounded-full" aria-hidden />
          <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
            <circle cx="90" cy="90" r={RING_R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="10" />
            <circle
              cx="90" cy="90" r={RING_R} fill="none"
              stroke="url(#story-ring-grad)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={RING_C}
              className="story-ring"
              style={{ '--ring-from': `${RING_C}`, '--ring-to': `${RING_C * (1 - score / 10)}`, animationDelay: '1100ms' } as CSSProperties}
            />
            <defs>
              <linearGradient id="story-ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="story-num display text-6xl font-black tnum leading-none" style={{ animationDelay: '1300ms', color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.35)' }}>
              {scoreText}
            </p>
            <p className="story-up text-sm font-bold tnum mt-1" style={{ animationDelay: '1700ms', color: 'rgba(255,255,255,0.6)' }}>/ 10</p>
          </div>
        </div>

        <p className="story-up display text-2xl font-extrabold mt-7" style={{ animationDelay: '2300ms', color: '#fff' }}>
          {emoji} {label}
        </p>
        <p className="story-up text-xs font-semibold mt-3" style={{ animationDelay: '2800ms', color: 'rgba(255,255,255,0.65)' }}>
          Alışkanlıklar, hedefler ve araç kullanımın birlikte tartıldı
        </p>
      </SlideShell>
    </>
  )
}
