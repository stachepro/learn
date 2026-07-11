import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useApp } from '../context/AppContext'
import StatModalShell from './StatModalShell'
import StreakFlame from './StreakFlame'
import { getFlameState, getFreezes, getFreezeProgress, MAX_STREAK_FREEZES, FREEZE_EARN_DAYS } from '../utils/streak'
import { useCountUp } from '../utils/useCountUp'
import {
  todayStr, yesterdayStr, dateStr, addDaysStr,
  getDaysInMonth, getFirstDayOfMonth, trMonthName, TR_DAY_SHORTS,
} from '../utils/date'

/* Seri penceresi: alev durumu, dondurma hakları, son 7 gün, aylık takvim
   ve kuralların açıklaması. Aktif gün = o gün en az 1 alışkanlık tamamlandı. */

type DayState = 'done' | 'frozen' | 'missed' | 'pending' | 'future'

const STATUS_TEXT: Record<string, { text: string; color: string }> = {
  lit:     { text: 'Bugün serini devam ettirdin, alev yanıyor!', color: '#9a4d0a' },
  pending: { text: 'Bugün henüz devam ettirmedin — bir alışkanlık tamamla, alevi yak.', color: 'rgb(var(--ink) / 0.55)' },
  frozen:  { text: 'Serin dondurma ile kurtarıldı. Bugün tamamla, alev geri gelsin!', color: '#0369a1' },
  out:     { text: 'Henüz seri yok. Bugün bir alışkanlık tamamla, seriyi başlat.', color: 'rgb(var(--ink) / 0.55)' },
}

function SnowFall() {
  const flakes = useMemo(() =>
    Array.from({ length: 9 }, (_, i) => ({
      left: 6 + (i * 37) % 88,
      delay: (i * 0.7) % 3.6,
      dur: 3 + (i % 3),
      size: 5 + (i % 3) * 2,
    })), [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {flakes.map((f, i) => (
        <span
          key={i}
          className="snow-flake"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            '--dur': `${f.dur}s`,
            '--delay': `${f.delay}s`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}

export default function StreakModal({ onClose }: { onClose: () => void }) {
  const { profile, logs } = useApp()
  const today = todayStr()
  const yesterday = yesterdayStr()
  const flame = getFlameState(profile, today, yesterday)
  const freezes = getFreezes(profile)
  const progress = getFreezeProgress(profile)
  const shownStreak = useCountUp(profile.streak, 800)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t) }, [])

  // O gün en az bir alışkanlık tamamlandıysa gün aktiftir
  const activeDates = useMemo(() => {
    const set = new Set<string>()
    for (const [date, day] of Object.entries(logs)) {
      if (Object.values(day.habits).some((h) => h.completed)) set.add(date)
    }
    return set
  }, [logs])

  const frozenDates = useMemo(() => new Set(profile.frozenDates ?? []), [profile.frozenDates])

  const stateOf = (date: string): DayState => {
    if (date > today) return 'future'
    if (activeDates.has(date)) return 'done'
    if (frozenDates.has(date)) return 'frozen'
    if (date === today) return 'pending'
    return 'missed'
  }

  // Son 7 gün — bugün en sağda
  const last7 = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const date = addDaysStr(today, i - 6)
      const [y, m, d] = date.split('-').map(Number)
      const dayIdx = (new Date(y, m - 1, d).getDay() + 6) % 7
      return { date, short: TR_DAY_SHORTS[dayIdx], dayNum: d, state: stateOf(date) }
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [today, activeDates, frozenDates])

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const activeThisMonth = Array.from({ length: daysInMonth }, (_, i) =>
    stateOf(dateStr(new Date(year, month, i + 1)))
  ).filter((s) => s === 'done' || s === 'frozen').length

  const totalActiveDays = activeDates.size

  const heroBg = flame === 'frozen'
    ? 'radial-gradient(circle at 50% 30%, rgba(125,211,252,0.35), rgba(125,211,252,0.08))'
    : flame === 'lit'
      ? 'radial-gradient(circle at 50% 30%, rgba(251,191,36,0.4), rgba(249,115,22,0.08))'
      : 'radial-gradient(circle at 50% 30%, rgb(var(--ink) / 0.08), rgb(var(--ink) / 0.02))'

  return (
    <StatModalShell
      title="Seri"
      subtitle="Her gün en az bir alışkanlık"
      onClose={onClose}
      headerIcon={<StreakFlame state={flame} size={24} />}
    >
      {/* ── Alev + sayı ── */}
      <div className="relative rounded-3xl px-4 pt-6 pb-5 text-center overflow-hidden animate-pop" style={{ background: heroBg }}>
        {flame === 'frozen' && <SnowFall />}
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${flame === 'lit' ? 'flame-glow' : flame === 'frozen' ? 'ice-glow' : ''}`}
          style={{
            background: flame === 'frozen' ? 'var(--sf-ice)' : flame === 'lit' ? '#faecd6' : '#f1ede4',
            border: `1px solid ${flame === 'frozen' ? 'var(--sf-ice-br)' : flame === 'lit' ? '#f3dcb0' : 'rgb(var(--ink) / 0.08)'}`,
          }}
        >
          <StreakFlame state={flame} size={44} />
        </div>
        <p className="display text-5xl font-black tnum mt-3 leading-none" style={{ color: flame === 'frozen' ? '#0369a1' : flame === 'lit' ? '#9a4d0a' : 'rgb(var(--ink))' }}>
          {shownStreak}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: 'rgb(var(--ink) / 0.4)' }}>günlük seri</p>
        <p className="text-xs font-semibold mt-2 px-4" style={{ color: STATUS_TEXT[flame].color }}>
          {STATUS_TEXT[flame].text}
        </p>
      </div>

      {/* ── Özet istatistikler ── */}
      <div className="grid grid-cols-3 gap-2.5 animate-pop" style={{ animationDelay: '60ms' }}>
        <MiniStat label="En uzun seri" value={`${profile.longestStreak}`} suffix="gün" />
        <MiniStat label="Toplam aktif" value={`${totalActiveDays}`} suffix="gün" />
        <MiniStat label={trMonthName(month)} value={`${activeThisMonth}/${daysInMonth}`} suffix="gün" />
      </div>

      {/* ── Dondurma hakları ── */}
      <div className="rounded-3xl p-4 animate-pop" style={{ background: '#eaf5fd', border: '1px solid #cfe8fa', animationDelay: '120ms' }}>
        <div className="flex items-center justify-between">
          <p className="display text-sm font-extrabold" style={{ color: '#0c4a6e' }}>🧊 Seri Dondurma</p>
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_STREAK_FREEZES }, (_, i) => (
              <span
                key={i}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm animate-cell-pop"
                style={{
                  animationDelay: `${200 + i * 90}ms`,
                  background: i < freezes ? 'linear-gradient(150deg, var(--sf-ice-br), #38bdf8)' : 'rgb(var(--ink) / 0.05)',
                  border: i < freezes ? '1px solid #7dd3fc' : '1px dashed rgb(var(--ink) / 0.18)',
                  boxShadow: i < freezes ? '0 4px 10px -4px rgba(14,165,233,0.5)' : 'none',
                }}
              >
                {i < freezes ? '❄️' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Yeni hakka ilerleme */}
        <div className="mt-3.5">
          <div className="flex justify-between text-[11px] font-semibold mb-1.5" style={{ color: '#0369a1' }}>
            <span>{freezes >= MAX_STREAK_FREEZES ? 'Hakların dolu — sayaç bekliyor' : 'Yeni hak'}</span>
            <span className="tnum">{freezes >= MAX_STREAK_FREEZES ? `${MAX_STREAK_FREEZES}/${MAX_STREAK_FREEZES}` : `${progress}/${FREEZE_EARN_DAYS} gün`}</span>
          </div>
          <div className="well rounded-full overflow-hidden" style={{ height: 7 }}>
            <div
              className="h-full rounded-full progress-fill"
              style={{
                width: mounted ? `${freezes >= MAX_STREAK_FREEZES ? 100 : (progress / FREEZE_EARN_DAYS) * 100}%` : '0%',
                background: 'linear-gradient(90deg, #7dd3fc, #0ea5e9)',
              }}
            />
          </div>
        </div>
        <p className="text-[11px] mt-2.5 leading-relaxed" style={{ color: 'rgba(3,105,161,0.75)' }}>
          Bir günü boş geçersen 1 hak otomatik harcanır ve serin korunur. Her 7 kesintisiz günde +1 hak kazanırsın (en fazla {MAX_STREAK_FREEZES}).
        </p>
      </div>

      {/* ── Son 7 gün ── */}
      <div className="animate-pop" style={{ animationDelay: '180ms' }}>
        <p className="display text-sm font-extrabold mb-2.5" style={{ color: 'rgb(var(--ink))' }}>Son 7 gün</p>
        <div className="grid grid-cols-7 gap-1.5">
          {last7.map((d, i) => (
            <div key={d.date} className="text-center animate-cell-pop" style={{ animationDelay: `${240 + i * 50}ms` }}>
              <p className="text-[9px] font-semibold mb-1 ink-45">{d.short}</p>
              <DayCell state={d.state} isToday={d.date === today} dayNum={d.dayNum} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Aylık takvim ── */}
      <div className="animate-pop" style={{ animationDelay: '240ms' }}>
        <p className="display text-sm font-extrabold mb-2.5" style={{ color: 'rgb(var(--ink))' }}>{trMonthName(month)} {year}</p>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {TR_DAY_SHORTS.map((d) => (
            <div key={d} className="text-center text-[9px] ink-45 py-0.5 font-semibold">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = dateStr(new Date(year, month, i + 1))
            const s = stateOf(date)
            const isToday = date === today
            const bg = s === 'done' ? 'rgba(249,115,22,0.75)'
              : s === 'frozen' ? 'rgba(56,189,248,0.65)'
              : s === 'future' ? 'rgb(var(--ink) / 0.03)'
              : 'rgb(var(--ink) / 0.05)'
            return (
              <div
                key={date}
                className="contrib-cell animate-cell-pop aspect-square rounded-lg flex items-center justify-center"
                style={{
                  background: bg,
                  boxShadow: isToday ? '0 0 0 2px rgb(249,115,22)' : 'inset 0 0 0 1px rgb(var(--ink) / 0.06)',
                  '--cell-opacity': s === 'future' ? 0.5 : 1,
                  animationDelay: `${(i % 7) * 0.02 + Math.floor(i / 7) * 0.015}s`,
                } as CSSProperties}
                title={`${i + 1} ${trMonthName(month)}`}
              >
                {s === 'frozen' && <span className="text-[9px] leading-none">❄️</span>}
                {s === 'done' && <span className="text-[10px] font-bold leading-none tnum" style={{ color: '#4a1d05' }}>{i + 1}</span>}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-end gap-3 mt-2.5 text-[10px] ink-45">
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded inline-block" style={{ background: 'rgba(249,115,22,0.75)' }} /> aktif</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded inline-block" style={{ background: 'rgba(56,189,248,0.65)' }} /> donduruldu</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded inline-block" style={{ background: 'rgb(var(--ink) / 0.05)', boxShadow: 'inset 0 0 0 1px rgb(var(--ink) / 0.1)' }} /> boş</span>
        </div>
      </div>

      {/* ── Nasıl işler ── */}
      <div className="rounded-3xl p-4 space-y-2.5 animate-pop" style={{ background: 'rgb(var(--ink) / 0.03)', border: '1px solid rgb(var(--ink) / 0.06)', animationDelay: '300ms' }}>
        <p className="display text-sm font-extrabold" style={{ color: 'rgb(var(--ink))' }}>Seri nasıl işler?</p>
        <Rule emoji="🔥" text="Günün ilk tamamlaması seriyi +1 ilerletir. Aynı gün içindeki diğer tamamlamalar sayıyı değiştirmez." />
        <Rule emoji="🧊" text="Bir günü tamamen boş geçersen dondurma hakkın otomatik devreye girer — serin bozulmaz, sayı aynı kalır." />
        <Rule emoji="📆" text="Kaçırılan her gün 1 hak harcar. Hak yetmezse seri sıfırlanır ama dondurmaların cebinde kalır." />
        <Rule emoji="❄️" text={`Her ${FREEZE_EARN_DAYS} kesintisiz aktif gün +1 dondurma kazandırır. En fazla ${MAX_STREAK_FREEZES} hak biriktirebilirsin; harcayınca yeniden kazanabilirsin.`} />
      </div>
    </StatModalShell>
  )
}

function MiniStat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-2xl px-3 py-3 text-center" style={{ background: 'rgb(var(--ink) / 0.03)', border: '1px solid rgb(var(--ink) / 0.06)' }}>
      <p className="display text-lg font-black tnum leading-none" style={{ color: 'rgb(var(--ink))' }}>
        {value}{suffix && <span className="text-[10px] font-bold ml-0.5 ink-45">{suffix}</span>}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-wide mt-1.5 ink-45">{label}</p>
    </div>
  )
}

function DayCell({ state, isToday, dayNum }: { state: DayState; isToday: boolean; dayNum: number }) {
  const styles: Record<DayState, CSSProperties> = {
    done:    { background: 'linear-gradient(150deg, #fbbf24, #f97316)', color: '#4a1d05', boxShadow: '0 4px 10px -4px rgba(249,115,22,0.55)' },
    frozen:  { background: 'linear-gradient(150deg, var(--sf-ice-br), #38bdf8)', color: '#0c4a6e', boxShadow: '0 4px 10px -4px rgba(14,165,233,0.5)' },
    missed:  { background: 'rgb(var(--ink) / 0.05)', color: 'rgb(var(--ink) / 0.35)' },
    pending: { background: 'rgba(249,115,22,0.08)', color: 'rgba(154,77,10,0.7)', border: '1.5px dashed rgba(249,115,22,0.5)' },
    future:  { background: 'rgb(var(--ink) / 0.03)', color: 'rgb(var(--ink) / 0.2)' },
  }
  return (
    <div
      className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold tnum ${isToday && state === 'pending' ? 'ring-pulse' : ''}`}
      style={styles[state]}
    >
      {state === 'done' ? '✓' : state === 'frozen' ? '❄️' : dayNum}
    </div>
  )
}

function Rule({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="text-sm leading-none mt-0.5">{emoji}</span>
      <p className="text-[11.5px] leading-relaxed flex-1" style={{ color: 'rgb(var(--ink) / 0.6)' }}>{text}</p>
    </div>
  )
}
