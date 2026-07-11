import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { usePomodoro } from '../context/PomodoroContext'

function fmtFocus(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  if (m < 60) return `${m}d`
  const h = Math.floor(m / 60)
  return `${h}sa ${m % 60}d`
}

/* ── Inline SVG icons (Lucide-style) ── */
type IconProps = { size?: number; strokeWidth?: number; color?: string }

function IconCalendar({ size = 22, strokeWidth = 1.6, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" />
      <line x1="12" y1="14" x2="14" y2="14" />
      <line x1="16" y1="14" x2="16" y2="14" strokeLinecap="round" strokeWidth={strokeWidth + 0.5} />
    </svg>
  )
}

function IconListChecks({ size = 22, strokeWidth = 1.6, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function IconLayoutGrid({ size = 20, strokeWidth = 2, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconBarChart({ size = 22, strokeWidth = 1.6, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function IconUser({ size = 22, strokeWidth = 1.6, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function IconTimer({ size = 28, strokeWidth = 1.8, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="2" x2="14" y2="2" />
      <line x1="12" y1="14" x2="15" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  )
}

function IconCoffee({ size = 28, strokeWidth = 1.8, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  )
}

function IconClipboardList({ size = 28, strokeWidth = 1.8, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
      <line x1="9" y1="8" x2="11" y2="8" />
    </svg>
  )
}

function IconDroplet({ size = 28, strokeWidth = 1.8, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.7 6.8 9a7 7 0 1 0 10.4 0Z" />
      <path d="M9.2 14.5a3.5 3.5 0 0 0 2 3" />
    </svg>
  )
}

function IconBolt({ size = 28, strokeWidth = 1.8, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4.5 13.5H11L9.5 22 19 10.5h-6.5L13 2Z" />
    </svg>
  )
}

function IconSun({ size = 28, strokeWidth = 1.8, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>
  )
}

function IconChart({ size = 28, strokeWidth = 1.8, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="5" rx="0.5" />
      <rect x="12" y="8" width="3" height="9" rx="0.5" />
      <rect x="17" y="5" width="3" height="12" rx="0.5" />
    </svg>
  )
}

/* ── Route config ── */
const links = [
  { to: '/', label: 'Bugün' },
  { to: '/habits', label: 'Alışkanlıklar' },
  { to: '/ozet', label: 'Özet' },
  { to: '/profile', label: 'Profil' },
]

const mobileItems = [
  { to: '/', label: 'Bugün', Icon: IconCalendar },
  { to: '/habits', label: 'Alışkanlık', Icon: IconListChecks },
  { to: '/ozet', label: 'Özet', Icon: IconBarChart },
  { to: '/profile', label: 'Profil', Icon: IconUser },
]

/* ── Hub modal ── */
function HubModal({ onClose }: { onClose: () => void }) {
  const [exiting, setExiting] = useState(false)
  const navigate = useNavigate()

  const handleClose = () => {
    if (exiting) return
    setExiting(true)
    setTimeout(onClose, 210)
  }

  const goTo = (path: string) => {
    // Navigate immediately and unmount without the fade-out animation — staggering
    // them (close animation fading over 210ms while the route already changed
    // underneath at 50ms) let the incoming page peek through the semi-transparent,
    // still-sliding Hub sheet, which looked like the wrong page flashing on screen.
    navigate(path)
    onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [exiting])

  // Not: panel bilerek portalsız — uygulama kabuğuyla aynı katman bağlamında
  // kalmalı ki z-40 alt çubuk ve Hub butonu panelin üstünde çizilebilsin
  return (
    <div
      // Alt kenar, alt sekme çubuğunun yüksekliğiyle (58px + alt dolgu) eşleşir;
      // 6px bindirme payı panel ile çubuk arasında sayfanın sızdığı şerit kalmasın diye
      className={`fixed inset-x-0 top-0 sm:top-16 bottom-[calc(3.25rem+max(env(safe-area-inset-bottom),12px))] sm:bottom-0 z-[35] flex flex-col ${exiting ? 'animate-hub-close' : 'animate-hub-open'}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        background: 'rgb(var(--canvas) / 0.97)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
      }}
    >

      <div className="flex-1 p-5 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {/* Su Takibi tile */}
          <button
            onClick={() => goTo('/su-takibi')}
            className="btn-press tile-press flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ paddingTop: 40, paddingBottom: 40, background: 'var(--sf-blue)', border: '1px solid var(--sf-blue-br)' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(150deg, #60a5fa, #1d4ed8)', boxShadow: '0 8px 20px -6px rgba(29,78,216,0.55)' }}
            >
              <IconDroplet size={24} strokeWidth={2} color="#fff" />
            </span>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: 'var(--sf-blue-tx)' }}>Su Takibi</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--sf-blue-tx2)' }}>Bugün ne kadar içtin?</p>
            </div>
          </button>

          {/* Uyandım tile — gün başlangıcı */}
          <button
            onClick={() => goTo('/uyandim')}
            className="btn-press tile-press flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ paddingTop: 40, paddingBottom: 40, background: 'var(--sf-yellow)', border: '1px solid var(--sf-yellow-br)' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(150deg, #fde68a, #f59e0b)', boxShadow: '0 8px 20px -6px rgba(245,158,11,0.55)' }}
            >
              <IconSun size={24} strokeWidth={2} color="#fff" />
            </span>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: 'var(--sf-yellow-tx)' }}>Uyandım</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--sf-amber-tx2)' }}>Güne merhaba de</p>
            </div>
          </button>

          {/* Pomodoro tile — free, task-independent focus timer */}
          <button
            onClick={() => goTo('/pomodoro')}
            className="btn-press tile-press flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ paddingTop: 40, paddingBottom: 40, background: 'var(--sf-rust)', border: '1px solid var(--sf-rust-br)' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(150deg, #fb923c, #ef4444)', boxShadow: '0 8px 20px -6px rgba(239,68,68,0.5)' }}
            >
              <IconTimer size={24} strokeWidth={2} color="#fff" />
            </span>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: 'var(--sf-rust-tx)' }}>Pomodoro</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--sf-rust-tx2)' }}>Serbest odak</p>
            </div>
          </button>

          {/* Just Start tile — energetic flagship */}
          <button
            onClick={() => goTo('/just-start')}
            className="btn-press tile-press flame-glow flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ paddingTop: 40, paddingBottom: 40, background: 'var(--sf-amber)', border: '1px solid var(--sf-amber-br)' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(150deg, #fbbf24, #f97316)', boxShadow: '0 8px 20px -6px rgba(249,115,22,0.6)' }}
            >
              <IconBolt size={24} strokeWidth={2} color="#fff" />
            </span>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: 'var(--sf-amber-tx)' }}>Just Start</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--sf-amber-tx2)' }}>1→115 dk momentum</p>
            </div>
          </button>

          {/* Klasik To-do tile */}
          <button
            onClick={() => goTo('/todo')}
            className="btn-press tile-press flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ paddingTop: 40, paddingBottom: 40, background: 'var(--sf-mint)', border: '1px solid var(--sf-mint-br)' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(150deg, #4ade80, #16a34a)', boxShadow: '0 8px 20px -6px rgba(22,163,74,0.55)' }}
            >
              <IconClipboardList size={24} strokeWidth={2} color="#fff" />
            </span>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: 'var(--sf-mint-tx)' }}>Klasik To-do</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--sf-mint-tx2)' }}>Basit liste</p>
            </div>
          </button>

          {/* Acele Yok tile — break big tasks into paced stages */}
          <button
            onClick={() => goTo('/acele-yok')}
            className="btn-press tile-press flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ paddingTop: 40, paddingBottom: 40, background: 'var(--sf-brown)', border: '1px solid var(--sf-brown-br)' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(150deg, #a8846a, #6b4a35)', boxShadow: '0 8px 20px -6px rgba(107,74,53,0.5)' }}
            >
              <IconCoffee size={24} strokeWidth={2} color="#fff" />
            </span>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: 'var(--sf-brown-tx)' }}>Acele Yok</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--sf-brown-tx2)' }}>Adım adım ilerle</p>
            </div>
          </button>

          {/* İstatistikler tile */}
          <button
            onClick={() => goTo('/stats')}
            className="btn-press tile-press flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ paddingTop: 40, paddingBottom: 40, background: 'var(--sf-blue)', border: '1px solid var(--sf-blue-br)' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(150deg, #60a5fa, #2563eb)', boxShadow: '0 8px 20px -6px rgba(37,99,235,0.55)' }}
            >
              <IconChart size={24} strokeWidth={2} color="#fff" />
            </span>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: 'var(--sf-blue-tx)' }}>İstatistikler</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--sf-blue-tx2)' }}>Aylık özet</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Nav ── */
export default function Nav() {
  const { phase, activeHabitId, showBar, todayFocusSeconds } = usePomodoro()
  const timerActive = phase !== 'idle' && activeHabitId !== null
  const [showHub, setShowHub] = useState(false)

  return (
    <>
      {showHub && <HubModal onClose={() => setShowHub(false)} />}

      {/* Top nav — light frosted rail (desktop only; mobile is chrome-free) */}
      <nav
        className="hidden sm:block sticky top-0 z-40"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          background: 'rgb(var(--canvas) / 0.82)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderBottom: '1px solid rgb(var(--ink) / 0.08)',
          boxShadow: '0 6px 22px -16px rgb(var(--ink) / 0.4)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(150deg, #fbbf24, #f97316)', boxShadow: '0 6px 14px -6px rgba(249,115,22,0.55)' }}>
              <span className="display text-[17px] font-black" style={{ color: '#2a1402' }}>L</span>
            </div>
            <span className="display font-extrabold text-[19px] tracking-tight" style={{ color: 'rgb(var(--ink))' }}>
              Luupi
            </span>
          </div>

          {/* Desktop links — Bugün, Alışkanlıklar, [Hub], Geçmiş, Profil */}
          <div className="hidden sm:flex items-center gap-1">
            {links.slice(0, 2).map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setShowHub(false)}
                className={({ isActive }) =>
                  `btn-press px-3.5 py-1.5 text-sm rounded-full transition-all ${isActive ? 'font-semibold' : 'font-medium'}`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'var(--sf-amber)', color: 'var(--sf-amber-tx)', boxShadow: 'inset 0 0 0 1px rgba(245,158,11,0.35)' }
                    : { color: 'rgb(var(--ink) / 0.55)' }
                }
              >
                {label}
              </NavLink>
            ))}

            <button
              onClick={() => setShowHub(v => !v)}
              title="Hub"
              className="btn-press w-8 h-8 rounded-full flex items-center justify-center mx-0.5"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f97316)',
                boxShadow: showHub
                  ? '0 4px 16px -4px rgba(249,115,22,0.7)'
                  : '0 4px 12px -5px rgba(249,115,22,0.5)',
              }}
            >
              <IconLayoutGrid size={15} strokeWidth={2.2} color="#2a1402" />
            </button>

            {links.slice(2).map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setShowHub(false)}
                className={({ isActive }) =>
                  `btn-press px-3.5 py-1.5 text-sm rounded-full transition-all ${isActive ? 'font-semibold' : 'font-medium'}`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'var(--sf-amber)', color: 'var(--sf-amber-tx)', boxShadow: 'inset 0 0 0 1px rgba(245,158,11,0.35)' }
                    : { color: 'rgb(var(--ink) / 0.55)' }
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Focus time badge */}
          {todayFocusSeconds > 0 ? (
            <button
              onClick={timerActive ? showBar : undefined}
              className="btn-press flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full"
              style={
                timerActive
                  ? { background: 'rgb(var(--ink))', color: 'rgb(var(--canvas))', boxShadow: '0 4px 12px -6px rgb(var(--ink) / 0.5)' }
                  : { background: 'rgb(var(--ink) / 0.06)', color: '#4a4658', boxShadow: 'inset 0 0 0 1px rgb(var(--ink) / 0.08)' }
              }
            >
              {timerActive && <span className="w-1.5 h-1.5 rounded-full animate-live" style={{ background: '#fbbf24' }} />}
              Odak {fmtFocus(todayFocusSeconds)}
            </button>
          ) : (
            <div className="w-16 hidden sm:block" />
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{
          background: 'rgb(var(--canvas) / 0.94)',
          backdropFilter: 'blur(24px) saturate(150%)',
          WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          borderTop: '1px solid rgb(var(--ink) / 0.08)',
          boxShadow: '0 -10px 30px -16px rgb(var(--ink) / 0.35)',
          paddingTop: 6,
          // Çentiksiz cihazda 12px; çentikli cihazda home göstergesi kadar —
          // ikisini toplamak çubuğu gereğinden fazla yukarı itiyordu
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        }}
      >
        {/* Bugün + Alışkanlık */}
        {mobileItems.slice(0, 2).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setShowHub(false)}
            className="btn-press flex-1 flex flex-col items-center justify-center py-1.5 gap-1 rounded-2xl"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.7}
                  color={isActive ? '#e8730f' : 'rgb(var(--ink) / 0.4)'}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: isActive ? '#c25e0c' : 'rgb(var(--ink) / 0.42)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Hub button — bar'ın üstüne taşan, ışıltılı FAB */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => setShowHub(v => !v)}
            aria-label="Hub"
            className="btn-press relative w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              marginTop: -26,
              background: 'linear-gradient(135deg, #fbbf24, #f97316)',
              border: '3px solid rgb(var(--canvas) / 0.95)',
              boxShadow: showHub
                ? '0 8px 26px -4px rgba(249,115,22,0.75), 0 5px 14px -4px rgb(var(--ink) / 0.28)'
                : '0 8px 22px -6px rgba(249,115,22,0.65), 0 5px 14px -6px rgb(var(--ink) / 0.22)',
            }}
          >
            <span className="hub-aura" aria-hidden />
            <span className="hub-halo" aria-hidden />
            <span className="relative z-10 flex items-center justify-center">
              <IconLayoutGrid size={24} strokeWidth={2.3} color="#2a1402" />
            </span>
          </button>
        </div>

        {/* Geçmiş + Profil */}
        {mobileItems.slice(2, 4).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setShowHub(false)}
            className="btn-press flex-1 flex flex-col items-center justify-center py-1.5 gap-1 rounded-2xl"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.7}
                  color={isActive ? '#e8730f' : 'rgb(var(--ink) / 0.4)'}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: isActive ? '#c25e0c' : 'rgb(var(--ink) / 0.42)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </>
  )
}
