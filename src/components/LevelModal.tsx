import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import StatModalShell from './StatModalShell'
import { useCountUp } from '../utils/useCountUp'
import {
  expProgressInCurrentLevel, expRequiredForLevel, expForNextLevel,
  calcHabitExp, calcSessionsExp, HABIT_COMPLETION_EXP, DEFAULT_SESSION_EXP,
} from '../utils/exp'
import { migrateHabitLog } from '../utils/habitLog'
import { todayStr } from '../utils/date'
import LuupiIcon from './ui/LuupiIcon'
import type { IconName } from '../utils/icons'

/* Seviye penceresi: ilerleme halkası, bugünkü kazanç, XP kaynakları
   ve seviye merdiveni. XP kayıtlardan türetilir — hiçbir kazanç kaybolmaz. */

const RING_R = 52
const RING_C = 2 * Math.PI * RING_R

export default function LevelModal({ onClose }: { onClose: () => void }) {
  const { profile, todayLog, freeSessions } = useApp()
  const { current, needed, percentage } = expProgressInCurrentLevel(profile.totalExp)
  const shownExp = useCountUp(current, 800)
  const shownTotal = useCountUp(profile.totalExp, 900)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t) }, [])

  const today = todayStr()
  const todayExp = useMemo(() => {
    const habitExp = Object.values(todayLog.habits)
      .reduce((acc, raw) => acc + calcHabitExp(migrateHabitLog(raw)), 0)
    const freeExp = calcSessionsExp((freeSessions ?? []).filter((s) => s.date === today))
    return habitExp + freeExp
  }, [todayLog, freeSessions, today])

  // Merdiven: bir önceki, mevcut ve sonraki 3 seviye
  const ladder = useMemo(() => {
    const start = Math.max(1, profile.level - 1)
    return Array.from({ length: 5 }, (_, i) => start + i)
  }, [profile.level])

  const dashOffset = mounted ? RING_C * (1 - percentage / 100) : RING_C

  return (
    <StatModalShell
      title="Seviye"
      subtitle="XP topla, seviye atla"
      onClose={onClose}
      headerIcon={<BoltIcon size={24} />}
    >
      {/* ── İlerleme halkası ── */}
      <div className="rounded-3xl px-4 pt-6 pb-5 text-center animate-pop" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(163,230,53,0.28), rgba(99,153,34,0.05))' }}>
        <div className="relative w-36 h-36 mx-auto">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgb(var(--ink) / 0.07)" strokeWidth="9" />
            <circle
              cx="60" cy="60" r={RING_R} fill="none"
              stroke="url(#lvl-ring-grad)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={dashOffset}
              className="pie-slice"
            />
            <defs>
              <linearGradient id="lvl-ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a3e635" />
                <stop offset="100%" stopColor="#639922" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[9px] font-bold uppercase tracking-widest ink-45">Seviye</p>
            <p className="display text-4xl font-black tnum leading-none mt-0.5" style={{ color: 'var(--sf-lime-tx)' }}>{profile.level}</p>
          </div>
        </div>
        <p className="text-sm font-bold tnum mt-3" style={{ color: 'var(--sf-lime-tx)' }}>
          {shownExp} <span className="ink-45 font-semibold">/ {needed} XP</span>
        </p>
        <p className="text-[11px] mt-1 ink-45">
          Seviye {profile.level + 1} için {needed - current} XP kaldı
        </p>
      </div>

      {/* ── Özet ── */}
      <div className="grid grid-cols-2 gap-2.5 animate-pop" style={{ animationDelay: '60ms' }}>
        <div className="rounded-2xl px-3 py-3 text-center" style={{ background: 'rgb(var(--ink) / 0.03)', border: '1px solid rgb(var(--ink) / 0.06)' }}>
          <p className="display text-lg font-black tnum leading-none" style={{ color: 'rgb(var(--ink))' }}>{shownTotal.toLocaleString('tr-TR')}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide mt-1.5 ink-45">Toplam XP</p>
        </div>
        <div className="rounded-2xl px-3 py-3 text-center" style={{ background: 'var(--sf-lime)', border: '1px solid var(--sf-lime-br)' }}>
          <p className="display text-lg font-black tnum leading-none" style={{ color: 'var(--sf-lime-tx)' }}>+{todayExp}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide mt-1.5" style={{ color: 'var(--sf-lime-tx2)' }}>Bugün kazanılan</p>
        </div>
      </div>

      {/* ── XP kaynakları ── */}
      <div className="rounded-3xl p-4 space-y-2 animate-pop" style={{ background: 'rgb(var(--ink) / 0.03)', border: '1px solid rgb(var(--ink) / 0.06)', animationDelay: '120ms' }}>
        <p className="display text-sm font-extrabold mb-1" style={{ color: 'rgb(var(--ink))' }}>XP nasıl kazanılır?</p>
        <XpRow icon="circle-check" label="Alışkanlık tamamlama" xp={`+${HABIT_COMPLETION_EXP}`} />
        <XpRow icon="timer" label="Pomodoro oturumu" xp={`+${DEFAULT_SESSION_EXP}`} />
        <XpRow icon="bolt" label="Boost pomodoro (tek seferde bitir)" xp="+15" />
        <XpRow icon="rocket" label="Just Start turu (10 adım)" xp="süreye göre" />
        <p className="text-[11px] leading-relaxed pt-1" style={{ color: 'rgb(var(--ink) / 0.5)' }}>
          XP asla silinmez: alışkanlığı kaldırsan bile kazandığın puanlar hesabında kalır.
        </p>
      </div>

      {/* ── Seviye merdiveni ── */}
      <div className="animate-pop" style={{ animationDelay: '180ms' }}>
        <p className="display text-sm font-extrabold mb-2.5" style={{ color: 'rgb(var(--ink))' }}>Seviye merdiveni</p>
        <div className="space-y-2">
          {ladder.map((lvl, i) => {
            const isCurrent = lvl === profile.level
            const isPast = lvl < profile.level
            const reqTotal = expRequiredForLevel(lvl)
            return (
              <div
                key={lvl}
                className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 animate-pop"
                style={{
                  animationDelay: `${220 + i * 60}ms`,
                  background: isCurrent ? 'var(--sf-lime)' : 'rgb(var(--ink) / 0.03)',
                  border: isCurrent ? '1px solid var(--sf-lime-br)' : '1px solid rgb(var(--ink) / 0.05)',
                  opacity: isPast ? 0.65 : 1,
                }}
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center display text-sm font-black tnum flex-shrink-0"
                  style={{
                    background: isCurrent ? 'linear-gradient(150deg, #a3e635, #639922)' : isPast ? 'rgba(99,153,34,0.15)' : 'rgb(var(--ink) / 0.05)',
                    color: isCurrent ? '#1a2e05' : isPast ? 'var(--sf-lime-tx)' : 'rgb(var(--ink) / 0.4)',
                    boxShadow: isCurrent ? '0 6px 14px -6px rgba(99,153,34,0.6)' : 'none',
                  }}
                >
                  {isPast ? '✓' : lvl}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: isCurrent ? 'var(--sf-lime-tx)' : 'rgb(var(--ink))' }}>
                    Seviye {lvl}{isCurrent && ' — buradasın'}
                  </p>
                  <p className="text-[10px] tnum ink-45 mt-0.5">
                    {reqTotal.toLocaleString('tr-TR')} XP{lvl > 1 && ` · bu seviye ${expForNextLevel(lvl - 1).toLocaleString('tr-TR')} XP ister`}
                  </p>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-black tnum px-2 py-1 rounded-full" style={{ background: 'rgba(99,153,34,0.16)', color: 'var(--sf-lime-tx)' }}>
                    %{Math.round(percentage)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[11px] leading-relaxed mt-2.5" style={{ color: 'rgb(var(--ink) / 0.5)' }}>
          Her yeni seviye bir öncekinden %20 daha fazla XP ister — istikrar büyüdükçe rozetler de seninle büyür.
        </p>
      </div>
    </StatModalShell>
  )
}

function XpRow({ icon, label, xp }: { icon: IconName; label: string; xp: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm leading-none"><LuupiIcon name={icon} size={16} /></span>
      <p className="text-xs font-semibold flex-1" style={{ color: 'rgb(var(--ink) / 0.7)' }}>{label}</p>
      <span className="text-xs font-black tnum" style={{ color: 'var(--sf-lime-tx)' }}>{xp}</span>
    </div>
  )
}

function BoltIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="rgb(99,153,34)" />
    </svg>
  )
}
