import { NavLink } from 'react-router-dom'
import { usePomodoro } from '../context/PomodoroContext'

function fmtFocus(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  if (m < 60) return `${m}d`
  const h = Math.floor(m / 60)
  return `${h}sa ${m % 60}d`
}

export default function Nav() {
  const { phase, activeHabitId, showBar, todayFocusSeconds } = usePomodoro()
  const timerActive = phase !== 'idle' && activeHabitId !== null

  return (
    <>
      {/* Top nav */}
      <nav
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(7,7,15,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 0 12px rgba(99,102,241,0.5)',
              }}
            >
              <span className="text-white text-xs font-black">L</span>
            </div>
            <span className="font-bold text-txt text-[15px] tracking-tight">Luupi</span>
          </div>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-0.5">
            {[
              { to: '/', label: 'Bugün' },
              { to: '/habits', label: 'Alışkanlıklar' },
              { to: '/history', label: 'Geçmiş' },
              { to: '/profile', label: 'Profil' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `btn-press px-3.5 py-1.5 text-sm rounded-xl transition-all ${
                    isActive
                      ? 'text-txt font-semibold'
                      : 'text-subtle hover:text-txt'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                } : {}}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Focus time badge */}
          {todayFocusSeconds > 0 && (
            <button
              onClick={timerActive ? showBar : undefined}
              className="btn-press flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
              style={timerActive ? {
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5',
              } : {
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#a5b4fc',
              }}
            >
              {timerActive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
              Odak {fmtFocus(todayFocusSeconds)}
            </button>
          )}
          {!todayFocusSeconds && <div className="w-20 hidden sm:block" />}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: 'rgba(7,7,15,0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {[
          { to: '/', icon: '◈', label: 'Bugün' },
          { to: '/habits', icon: '✦', label: 'Alışkanlık' },
          { to: '/history', icon: '◉', label: 'Geçmiş' },
          { to: '/profile', icon: '◎', label: 'Profil' },
        ].map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `btn-press flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
                isActive ? 'text-accent' : 'text-subtle'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="text-[9px] leading-none tracking-wide">{label}</span>
          </NavLink>
        ))}
      </div>
    </>
  )
}
