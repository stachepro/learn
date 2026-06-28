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
      {/* Top nav — frosted rail */}
      <nav
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(78,98,116,0.55)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderBottom: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 6px 22px -12px rgba(15,30,46,0.5)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo — a little glass tile */}
          <div className="flex items-center gap-2.5">
            <div className="glass g-amber w-9 h-9 rounded-2xl flex items-center justify-center">
              <span className="display text-[17px] font-extrabold" style={{ color: '#40240a' }}>L</span>
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
                        background: 'rgba(255,255,255,0.85)',
                        color: '#21303d',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                      }
                    : { color: 'rgba(241,245,245,0.72)' }
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
                  ? { background: 'rgba(192,67,46,0.9)', color: '#fff5f2', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }
                  : { background: 'rgba(255,255,255,0.85)', color: '#21303d', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }
              }
            >
              {timerActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              Odak {fmtFocus(todayFocusSeconds)}
            </button>
          ) : (
            <div className="w-16 hidden sm:block" />
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar — frosted */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: 'rgba(56,72,88,0.78)',
          backdropFilter: 'blur(22px) saturate(150%)',
          WebkitBackdropFilter: 'blur(22px) saturate(150%)',
          borderTop: '1px solid rgba(255,255,255,0.16)',
          boxShadow: '0 -6px 22px -12px rgba(15,30,46,0.6)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {mobileLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="btn-press flex-1 flex flex-col items-center justify-center py-2.5 gap-1.5"
          >
            {({ isActive }) => (
              <>
                <span
                  className="w-7 h-1.5 rounded-full transition-all"
                  style={{ background: isActive ? '#e6dd9c' : 'rgba(241,245,245,0.28)' }}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide transition-colors"
                  style={{ color: isActive ? '#f1f5f5' : 'rgba(241,245,245,0.5)' }}
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
