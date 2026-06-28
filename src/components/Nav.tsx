import { NavLink } from 'react-router-dom'
import { usePomodoro } from '../context/PomodoroContext'

function fmtFocus(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  if (m < 60) return `${m}d`
  const h = Math.floor(m / 60)
  return `${h}sa ${m % 60}d`
}

const links = [
  { to: '/', label: 'Bugün' },
  { to: '/habits', label: 'Alışkanlıklar' },
  { to: '/history', label: 'Geçmiş' },
  { to: '/profile', label: 'Profil' },
]

const mobileLinks = [
  { to: '/', label: 'Bugün' },
  { to: '/habits', label: 'Alışkanlık' },
  { to: '/history', label: 'Geçmiş' },
  { to: '/profile', label: 'Profil' },
]

export default function Nav() {
  const { phase, activeHabitId, showBar, todayFocusSeconds } = usePomodoro()
  const timerActive = phase !== 'idle' && activeHabitId !== null

  return (
    <>
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
          {/* Logo — a little glass tile */}
          <div className="flex items-center gap-2.5">
            <div className="glass g-lime w-9 h-9 rounded-2xl flex items-center justify-center ring-pulse">
              <span className="display text-[17px] font-extrabold acc">L</span>
            </div>
            <span className="display font-extrabold text-[19px] tracking-tight" style={{ color: '#f1f5f5' }}>
              Luupi
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `btn-press px-3.5 py-1.5 text-sm rounded-full transition-all ${
                    isActive ? 'font-semibold' : 'font-medium'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        background: 'rgba(34,197,94,0.16)',
                        color: '#6ee79f',
                        boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.4)',
                      }
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
                  ? { background: 'rgba(225,90,60,0.92)', color: '#fff5f2', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }
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

      {/* Mobile bottom tab bar — dark, raised & roomier */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: 'rgba(12,13,15,0.9)',
          backdropFilter: 'blur(24px) saturate(150%)',
          WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          borderTop: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 -10px 30px -12px rgba(0,0,0,0.8)',
          paddingTop: 8,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)',
        }}
      >
        {mobileLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="btn-press flex-1 flex flex-col items-center justify-center py-3 gap-2 rounded-2xl mx-1"
          >
            {({ isActive }) => (
              <>
                <span
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: isActive ? 34 : 22,
                    background: isActive ? 'rgb(34,197,94)' : 'rgba(241,245,245,0.22)',
                    boxShadow: isActive ? '0 0 12px rgba(34,197,94,0.7)' : 'none',
                  }}
                />
                <span
                  className="text-[12px] font-semibold tracking-wide transition-colors"
                  style={{ color: isActive ? '#6ee79f' : 'rgba(241,245,245,0.5)' }}
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
