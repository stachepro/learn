import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

function IconX({ size = 16, strokeWidth = 2.5, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconClock({ size = 28, strokeWidth = 1.5, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

/* ── Route config ── */
const links = [
  { to: '/', label: 'Bugün' },
  { to: '/habits', label: 'Alışkanlıklar' },
  { to: '/history', label: 'Geçmiş' },
  { to: '/profile', label: 'Profil' },
]

const mobileItems = [
  { to: '/', label: 'Bugün', Icon: IconCalendar },
  { to: '/habits', label: 'Alışkanlık', Icon: IconListChecks },
  { to: '/history', label: 'Geçmiş', Icon: IconBarChart },
  { to: '/profile', label: 'Profil', Icon: IconUser },
]

/* ── Hub modal ── */
function HubModal({ onClose }: { onClose: () => void }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleClose = () => {
    if (exiting) return
    setExiting(true)
    setTimeout(onClose, 210)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [exiting])

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex flex-col ${exiting ? 'animate-hub-close' : 'animate-hub-open'}`}
      style={{
        background: 'rgba(12,13,15,0.97)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 'max(20px, env(safe-area-inset-top))',
          paddingBottom: 16,
        }}
      >
        <div>
          <h2 className="display text-xl font-bold" style={{ color: '#f1f5f5' }}>Hub</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,245,0.4)' }}>Hızlı erişim</p>
        </div>
        <button
          onClick={handleClose}
          className="ctrl btn-press w-9 h-9 rounded-full flex items-center justify-center"
        >
          <IconX color="rgba(241,245,245,0.7)" />
        </button>
      </div>

      {/* 2×3 placeholder grid */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="glass g-neutral flex flex-col items-center justify-center gap-3 rounded-2xl"
              style={{ paddingTop: 40, paddingBottom: 40, opacity: 0.38 }}
            >
              <IconClock color="rgba(241,245,245,0.5)" />
              <span className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(241,245,245,0.45)' }}>
                Yakında
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
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

      {/* Top nav — dark frosted rail */}
      <nav
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(10,11,12,0.72)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 6px 22px -12px rgba(0,0,0,0.7)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="glass g-lime w-9 h-9 rounded-2xl flex items-center justify-center ring-pulse">
              <span className="display text-[17px] font-extrabold acc">L</span>
            </div>
            <span className="display font-extrabold text-[19px] tracking-tight" style={{ color: '#f1f5f5' }}>
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
                className={({ isActive }) =>
                  `btn-press px-3.5 py-1.5 text-sm rounded-full transition-all ${isActive ? 'font-semibold' : 'font-medium'}`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'rgba(34,197,94,0.16)', color: '#6ee79f', boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.4)' }
                    : { color: 'rgba(241,245,245,0.62)' }
                }
              >
                {label}
              </NavLink>
            ))}

            <button
              onClick={() => setShowHub(true)}
              title="Hub"
              className="btn-press w-8 h-8 rounded-full flex items-center justify-center mx-0.5"
              style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.85), rgba(22,163,74,0.78))',
                boxShadow: '0 0 14px rgba(34,197,94,0.3)',
              }}
            >
              <IconLayoutGrid size={15} strokeWidth={2} color="#fff" />
            </button>

            {links.slice(2).map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `btn-press px-3.5 py-1.5 text-sm rounded-full transition-all ${isActive ? 'font-semibold' : 'font-medium'}`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'rgba(34,197,94,0.16)', color: '#6ee79f', boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.4)' }
                    : { color: 'rgba(241,245,245,0.62)' }
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
                  ? { background: '#ffffff', color: '#111827', boxShadow: '0 2px 10px rgba(255,255,255,0.18)' }
                  : { background: 'rgba(255,255,255,0.08)', color: '#dfe6e7', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }
              }
            >
              {timerActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-live" />}
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
          background: 'rgba(12,13,15,0.92)',
          backdropFilter: 'blur(24px) saturate(150%)',
          WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          borderTop: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 -10px 30px -12px rgba(0,0,0,0.8)',
          paddingTop: 8,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)',
        }}
      >
        {/* Bugün + Alışkanlık */}
        {mobileItems.slice(0, 2).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="btn-press flex-1 flex flex-col items-center justify-center py-1.5 gap-1 rounded-2xl"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  color={isActive ? '#6ee79f' : 'rgba(241,245,245,0.35)'}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: isActive ? '#6ee79f' : 'rgba(241,245,245,0.35)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Hub button — center accent */}
        <div className="flex-1 flex items-center justify-center" style={{ paddingBottom: 2 }}>
          <button
            onClick={() => setShowHub(true)}
            className="btn-press w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(22,163,74,0.88))',
              boxShadow: '0 0 22px rgba(34,197,94,0.45), 0 4px 14px rgba(0,0,0,0.45)',
            }}
          >
            <IconLayoutGrid size={20} strokeWidth={2} color="#fff" />
          </button>
        </div>

        {/* Geçmiş + Profil */}
        {mobileItems.slice(2, 4).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="btn-press flex-1 flex flex-col items-center justify-center py-1.5 gap-1 rounded-2xl"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  color={isActive ? '#6ee79f' : 'rgba(241,245,245,0.35)'}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: isActive ? '#6ee79f' : 'rgba(241,245,245,0.35)' }}
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
