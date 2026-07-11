import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useApp } from '../context/AppContext'
import SummaryStory from '../components/SummaryStory'
import { storage } from '../utils/storage'
import { collectDaySummary, summaryHasAnything, sessionLabel, type DaySummary } from '../utils/daySummary'
import { formatMl } from '../utils/water'
import { todayStr, formatDisplayDate, formatMinutes, formatHMS, logicalNow } from '../utils/date'

/* Günlük Özet — bugünün dökümü tek sayfada:
   - Alışkanlıklar: hepsi, ✓/✗ durumuyla
   - Su & Uyanma: yalnızca hedef girilmişse
   - Pomodoro / Acele Yok / To-do: yalnızca bugün TAMAMLANANLAR
   Güne ilk girişte (ve ↻ ile istenince) tam ekran story oynar;
   bitince bu statik sayfaya dönülür. */

export default function DailySummary() {
  const { habits, todayLog, freeSessions } = useApp()
  const [mounted, setMounted] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [storySummary, setStorySummary] = useState<DaySummary | null>(null)

  // Görünürlük dinleyicisi bayat veriyle çalışmasın diye güncel hali ref'te tut
  const dataRef = useRef({ habits, todayLog, freeSessions })
  dataRef.current = { habits, todayLog, freeSessions }
  const storyOpenRef = useRef(false)
  storyOpenRef.current = storySummary !== null

  // ↻ butonu: istenildiği kadar tekrar izletir; "izlendi" damgasına dokunmaz
  const openStory = () => {
    setStorySummary(collectDaySummary(habits, todayLog, freeSessions ?? [], todayStr()))
  }

  useEffect(() => {
    setMounted(true)
    // O güne ait gösteri izlenmediyse otomatik başlar; izlenince damgalanır ve o gün
    // bir daha kendiliğinden açılmaz. Damga tarih olduğu için yeni günde kendiliğinden
    // "izlenmedi"ye döner. Sayfa açıkken gece yarısı geçilir ya da uygulama arka
    // plandan dönerse (gece 00:00 bildirimine dokunma senaryosu) aynı kontrol
    // görünürlük değişiminde de koşar.
    const maybeAutoPlay = () => {
      if (document.visibilityState !== 'visible' || storyOpenRef.current) return
      const today = todayStr()
      if (storage.getStorySeenDate() === today) return
      const { habits, todayLog, freeSessions } = dataRef.current
      const s = collectDaySummary(habits, todayLog, freeSessions ?? [], today)
      if (!summaryHasAnything(s)) return
      storage.setStorySeenDate(today)
      setStorySummary(s)
    }
    maybeAutoPlay()
    document.addEventListener('visibilitychange', maybeAutoPlay)
    return () => document.removeEventListener('visibilitychange', maybeAutoPlay)
  }, [])

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 ${mounted ? 'page-enter' : 'opacity-0'}`}>
      {storySummary && (
        <SummaryStory
          summary={storySummary}
          onClose={() => { setStorySummary(null); setReplayKey((k) => k + 1) }}
        />
      )}

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="display text-3xl font-extrabold" style={{ color: 'rgb(var(--ink))' }}>Özet</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--ink) / 0.55)' }}>{formatDisplayDate(logicalNow())}</p>
        </div>
        <button
          onClick={openStory}
          aria-label="Özet gösterisini oynat"
          title="Özet gösterisini oynat"
          className="ctrl btn-press w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        >
          <svg key={replayKey} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="animate-replay-spin">
            <path d="M3 12a9 9 0 1 0 3.51-7.13" />
            <path d="M3 3v6h6" />
          </svg>
        </button>
      </div>

      {/* key değişince (story kapanışı dahil) statik içerik yeniden kurulur → animasyonlar oynar */}
      <SummaryContent key={replayKey} />
    </div>
  )
}

function SummaryContent() {
  const { habits, todayLog, freeSessions, categories } = useApp()
  const today = todayStr()
  const s = collectDaySummary(habits, todayLog, freeSessions ?? [], today)

  // Progress bar'lar mount'tan bir kare sonra dolmaya başlasın
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const waterPct = s.water && s.water.goal > 0 ? Math.min(100, (s.water.actual / s.water.goal) * 100) : 0
  const waterMet = !!s.water && s.water.actual >= s.water.goal

  if (!summaryHasAnything(s)) {
    return (
      <div className="glass g-neutral p-10 text-center animate-pop" style={{ borderRadius: 24 }}>
        <p className="text-3xl mb-3">🌤️</p>
        <p className="display text-base font-bold">Bugün henüz kayıt yok</p>
        <p className="text-xs mt-1 ink-60">Gün ilerledikçe özetin burada birikecek</p>
      </div>
    )
  }

  // Kartlar sırayla belirsin diye kademeli gecikme
  let order = 0
  const nextDelay = () => `${order++ * 90}ms`

  return (
    <div className="space-y-4">
      {/* ── Alışkanlıklar ── */}
      {s.habitEntries.length > 0 && (
        <SectionCard
          emoji="✅"
          title="Alışkanlıklar"
          right={<span className="text-xs font-bold tnum ink-45">{s.doneCount}/{s.habitEntries.length}</span>}
          delay={nextDelay()}
        >
          <div className="space-y-1.5">
            {s.habitEntries.map(({ habit, log }, i) => {
              const cat = categories.find((c) => c.id === habit.categoryId)
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 animate-pop"
                  style={{
                    animationDelay: `${120 + i * 45}ms`,
                    background: log.completed ? '#e9f9ee' : 'rgb(var(--ink) / 0.03)',
                    border: log.completed ? '1px solid #c2ecd0' : '1px solid rgb(var(--ink) / 0.05)',
                  }}
                >
                  <span className="text-base leading-none flex-shrink-0">{habit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold leading-snug"
                      style={{
                        color: log.completed ? '#15803d' : 'rgb(var(--ink))',
                        textDecoration: log.completed ? 'line-through' : 'none',
                        textDecorationColor: 'rgba(21,128,61,0.4)',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {habit.name}
                    </p>
                    {cat && <p className="text-[10px] font-semibold mt-0.5 ink-45">{cat.emoji} {cat.name}</p>}
                  </div>
                  <StatusDot done={log.completed} />
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Su Takibi — yalnızca hedef girilmişse ── */}
      {s.water && (
        <SectionCard
          emoji="💧"
          title="Su Takibi"
          right={
            <span className="text-xs font-bold tnum" style={{ color: waterMet ? '#15803d' : '#1d4ed8' }}>
              {formatMl(s.water.actual)} / {formatMl(s.water.goal)}
            </span>
          }
          delay={nextDelay()}
        >
          <div className="well rounded-full overflow-hidden" style={{ height: 10 }}>
            <div
              className="h-full rounded-full progress-fill"
              style={{
                width: grown ? `${waterPct}%` : '0%',
                background: waterMet
                  ? 'linear-gradient(90deg, #34d36f, #1f9d4d)'
                  : 'linear-gradient(90deg, #60a5fa, #2563eb)',
              }}
            />
          </div>
          <p className="text-[11px] mt-2 ink-45">
            {waterMet
              ? 'Hedef tamamlandı 🎉'
              : `Hedefe ${formatMl(s.water.goal - s.water.actual)} kaldı`}
          </p>
        </SectionCard>
      )}

      {/* ── Uyanma — yalnızca hedef girilmişse ── */}
      {s.wake && (
        <SectionCard
          emoji="🌅"
          title="Uyanma"
          right={s.wake.actualTime && (
            <span className="text-xs font-bold" style={{ color: s.wake.onTime ? '#15803d' : '#b87520' }}>
              {s.wake.onTime ? 'hedefinde ✓' : 'hedef sonrası'}
            </span>
          )}
          delay={nextDelay()}
        >
          <div className="flex items-center gap-3">
            <TimeBox label="Hedef" value={s.wake.goal} />
            <span className="ink-35 text-lg">→</span>
            <TimeBox
              label="Uyanış"
              value={s.wake.actualTime ?? '--:--'}
              color={s.wake.actualTime ? (s.wake.onTime ? '#15803d' : '#b87520') : undefined}
            />
          </div>
        </SectionCard>
      )}

      {/* ── Pomodoro — yalnızca bugün bitenler ── */}
      {s.sessions.length > 0 && (
        <SectionCard
          emoji="🍅"
          title="Pomodoro"
          right={<span className="text-xs font-bold tnum ink-45">{s.sessions.length} oturum · {formatMinutes(s.totalPomMin)}</span>}
          delay={nextDelay()}
        >
          <div className="space-y-1.5">
            {s.sessions.map((sess, i) => {
              const { emoji, name } = sessionLabel(sess, habits)
              const time = new Date(sess.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              return (
                <div
                  key={sess.id}
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 animate-pop"
                  style={{ animationDelay: `${120 + i * 45}ms`, background: 'rgb(var(--ink) / 0.03)', border: '1px solid rgb(var(--ink) / 0.05)' }}
                >
                  <span className="text-base leading-none flex-shrink-0">{emoji}</span>
                  <p className="text-xs font-semibold flex-1 min-w-0" style={{ overflowWrap: 'anywhere' }}>{name}</p>
                  <span className="text-[11px] font-bold tnum flex-shrink-0" style={{ color: 'var(--sf-rust-tx)' }}>{formatMinutes(sess.workDuration)}</span>
                  <span className="text-[10px] tnum flex-shrink-0 ink-45">{time}</span>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Acele Yok — yalnızca bugün bitenler ── */}
      {s.noRush.length > 0 && (
        <SectionCard emoji="☕" title="Acele Yok" delay={nextDelay()}>
          <div className="space-y-1.5">
            {s.noRush.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 animate-pop"
                style={{ animationDelay: `${120 + i * 45}ms`, background: 'var(--sf-brown)', border: '1px solid var(--sf-brown-br)' }}
              >
                <p className="text-xs font-semibold flex-1 min-w-0" style={{ color: 'var(--sf-brown-tx)', overflowWrap: 'anywhere' }}>{r.title}</p>
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: 'var(--sf-brown-tx2)' }}>{r.stageCount} aşama</span>
                <span className="text-[11px] font-bold tnum flex-shrink-0" style={{ color: '#6b4a35' }}>{formatHMS(r.totalSeconds)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Klasik To-do — yalnızca bugün tamamlananlar ── */}
      {s.todos.length > 0 && (
        <SectionCard
          emoji="📝"
          title="Klasik To-do"
          right={<span className="text-xs font-bold tnum ink-45">{s.todos.length} tamam</span>}
          delay={nextDelay()}
        >
          <div className="space-y-1.5">
            {s.todos.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 animate-pop"
                style={{ animationDelay: `${120 + i * 45}ms`, background: 'var(--sf-mint)', border: '1px solid var(--sf-mint-br)' }}
              >
                <StatusDot done />
                <p
                  className="text-xs font-semibold flex-1 min-w-0"
                  style={{ color: 'var(--sf-mint-tx)', textDecoration: 'line-through', textDecorationColor: 'rgba(22,101,52,0.35)', overflowWrap: 'anywhere' }}
                >
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function SectionCard({ emoji, title, right, children, delay }: {
  emoji: string
  title: string
  right?: ReactNode
  children: ReactNode
  delay: string
}) {
  return (
    <div className="glass g-neutral animate-pop" style={{ borderRadius: 24, animationDelay: delay }}>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgb(var(--ink) / 0.08)' }}>
        <p className="display text-sm font-bold">{emoji} {title}</p>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function StatusDot({ done }: { done: boolean }) {
  if (done) {
    return (
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: '#16a34a', boxShadow: '0 3px 8px -3px rgba(34,197,94,0.6)' }}
      >
        <svg width="11" height="9" viewBox="0 0 14 11" fill="none"><path d="M1.5 6L5 9.5L12.5 1.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    )
  }
  return (
    <span
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgb(var(--ink) / 0.06)', border: '1.5px solid rgb(var(--ink) / 0.14)' }}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="rgb(var(--ink) / 0.35)" strokeWidth="1.8" strokeLinecap="round" /></svg>
    </span>
  )
}

function TimeBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 rounded-2xl px-3 py-3 text-center" style={{ background: 'rgb(var(--ink) / 0.03)', border: '1px solid rgb(var(--ink) / 0.06)' }}>
      <p className="display text-xl font-black tnum leading-none" style={{ color: color ?? 'rgb(var(--ink))' }}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide mt-1.5 ink-45">{label}</p>
    </div>
  )
}
