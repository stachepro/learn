import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import BackBar from '../components/BackBar'
import TimerDial from '../components/TimerDial'
import { todayStr, formatSeconds } from '../utils/date'

/* ════════════════════════════════════════════════
   POMODORO — tikli kadran + ışıltılı ilerleme yayı.
   Seans başlayınca "Odak Modu" butonu masa saati
   görünümüne (FocusMode overlay) geçirir.
   ════════════════════════════════════════════════ */

export default function Pomodoro() {
  const { pomodoroSettings, freeSessions } = useApp()
  const {
    phase, secondsLeft, totalSeconds, sessionCount,
    isPaused, isFree, soundEnabled,
    startFree, pauseResume, startBreak, skipBreak, stopTimer, toggleSound, toggleFocusMode,
  } = usePomodoro()

  // Paylaşılan sayaçta bir alışkanlık Pomodoro'su çalışıyor
  const otherActive = phase !== 'idle' && !isFree

  const isWork = isFree && phase === 'work'
  const isBreak = isFree && phase === 'break'
  const isWorkDone = isFree && phase === 'work-done'
  const isDone = isFree && phase === 'break-done'
  const running = isWork || isBreak || isWorkDone || isDone
  const ticking = (isWork || isBreak) && !isPaused

  const today = todayStr()
  const todayCount = freeSessions.filter((s) => s.date === today).length

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const accent = isBreak ? '#22c55e' : '#f97316'
  const accentSoft = isBreak ? 'rgba(34,197,94,' : 'rgba(249,115,22,'
  const showArc = isWork || isBreak

  const phaseLabel = isWorkDone ? 'Çalışma Bitti' : isDone ? 'Mola Bitti' : isWork ? 'Odak' : isBreak ? 'Mola' : 'Hazır'

  return (
    <div className="max-w-sm mx-auto px-4 pt-6 pb-40">
      <BackBar />

      {/* Başlık */}
      <div className="mb-7 text-center">
        <h1 className="display text-2xl font-extrabold tracking-tight" style={{ color: '#1a1726' }}>
          Pomodoro
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
          Serbest odak · {pomodoroSettings.workDuration} dk seans
        </p>
      </div>

      {otherActive ? (
        <div
          className="glass g-neutral rounded-2xl px-5 py-8 text-center space-y-2 animate-fade-up"
          style={{ border: '1px solid rgba(26,23,38,0.1)' }}
        >
          <p className="text-3xl leading-none">⏳</p>
          <p className="text-sm font-semibold" style={{ color: '#1a1726' }}>
            Şu anda başka bir Pomodoro çalışıyor
          </p>
          <p className="text-xs" style={{ color: 'rgba(26,23,38,0.5)' }}>
            Serbest seans başlatmak için önce aktif seansı bitir.
          </p>
        </div>
      ) : (
        <>
          {/* ── Kadran ── */}
          <div className="flex flex-col items-center animate-fade-up">
            <TimerDial progress={progress} accent={accent} showArc={showArc} ticking={ticking}>
              <span
                key={phaseLabel + String(isPaused)}
                className="pom-chip px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{
                  background: running ? `${accentSoft}0.12)` : 'rgba(26,23,38,0.05)',
                  color: running ? accent : 'rgba(26,23,38,0.45)',
                  border: `1px solid ${running ? `${accentSoft}0.3)` : 'rgba(26,23,38,0.08)'}`,
                }}
              >
                {isPaused ? 'Durakladı' : phaseLabel}
              </span>
              <span
                className="display tnum font-extrabold leading-none mt-2.5"
                style={{
                  fontSize: 54,
                  color: running ? '#1a1726' : 'rgba(26,23,38,0.28)',
                  transition: 'color 0.4s ease',
                }}
              >
                {(isWorkDone || isDone) ? '✓' : formatSeconds(running ? secondsLeft : pomodoroSettings.workDuration * 60)}
              </span>
              {running && (
                <span className="text-[11px] font-semibold mt-2" style={{ color: 'rgba(26,23,38,0.45)' }}>
                  {sessionCount} seans tamamlandı
                </span>
              )}
            </TimerDial>
          </div>

          {/* ── Kontroller ── */}
          <div className="mt-7 space-y-3">
            {phase === 'idle' && (
              <button
                onClick={startFree}
                className="btn-press btn-go w-full py-4 text-[15px] font-bold animate-fade-up"
              >
                ▶ Odaklanmaya Başla
              </button>
            )}

            {(isWork || isBreak) && (
              <div className="flex gap-2.5 animate-fade-up">
                <button
                  onClick={pauseResume}
                  className="btn-press flex-1 py-3.5 rounded-2xl text-sm font-bold"
                  style={{
                    background: isPaused ? 'rgba(34,197,94,0.9)' : 'rgba(26,23,38,0.06)',
                    color: isPaused ? '#06210f' : '#1a1726',
                    border: '1px solid rgba(26,23,38,0.08)',
                  }}
                >
                  {isPaused ? '▶ Devam Et' : '⏸ Duraklat'}
                </button>
                {/* Odak Modu — masa saati görünümü */}
                <button
                  onClick={toggleFocusMode}
                  className="btn-press flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{
                    background: '#1a1726',
                    color: '#fbf7f0',
                    boxShadow: '0 10px 22px -10px rgba(26,23,38,0.55)',
                  }}
                >
                  <ExpandIcon /> Odak Modu
                </button>
              </div>
            )}

            {isWorkDone && (
              <div className="flex gap-2.5 animate-fade-up">
                <button
                  onClick={startBreak}
                  className="btn-press btn-go flex-1 py-3.5 text-sm font-bold"
                >
                  ☕ Mola Başlat
                </button>
                <button
                  onClick={toggleFocusMode}
                  aria-label="Odak Modu"
                  className="btn-press w-[52px] rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1a1726', color: '#fbf7f0' }}
                >
                  <ExpandIcon />
                </button>
              </div>
            )}

            {isDone && (
              <div className="flex gap-2.5 animate-fade-up">
                <button
                  onClick={skipBreak}
                  className="btn-press flex-1 py-3.5 rounded-2xl text-sm font-bold"
                  style={{ background: '#f97316', color: '#fff5f2', boxShadow: '0 10px 22px -10px rgba(249,115,22,0.55)' }}
                >
                  🔥 Çalışmaya Başla
                </button>
                <button
                  onClick={toggleFocusMode}
                  aria-label="Odak Modu"
                  className="btn-press w-[52px] rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1a1726', color: '#fbf7f0' }}
                >
                  <ExpandIcon />
                </button>
              </div>
            )}

            {/* İkincil satır: ses + molayı atla + iptal */}
            {running && (
              <div className="flex gap-2 animate-fade-up">
                <button
                  onClick={toggleSound}
                  className="ctrl btn-press flex-1 py-2.5 rounded-2xl text-xs font-semibold"
                >
                  {soundEnabled ? '🔔 Ses açık' : '🔕 Ses kapalı'}
                </button>
                {isBreak && (
                  <button
                    onClick={skipBreak}
                    className="ctrl btn-press flex-1 py-2.5 rounded-2xl text-xs font-semibold"
                  >
                    ⏭ Molayı Atla
                  </button>
                )}
                <button
                  onClick={stopTimer}
                  className="btn-press flex-1 py-2.5 rounded-2xl text-xs font-bold"
                  style={{ background: 'rgba(225,90,60,0.12)', color: '#b3422a', boxShadow: 'inset 0 0 0 1px rgba(225,90,60,0.3)' }}
                >
                  İptal Et
                </button>
              </div>
            )}
          </div>

          {/* ── İstatistikler ── */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="glass g-flame rounded-2xl px-4 py-4 text-center animate-fade-up" style={{ animationDelay: '0.05s' }}>
              <p className="display text-3xl font-extrabold tnum" style={{ color: 'rgb(var(--txt))' }}>{todayCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1 ink-60">Bugünkü Seans</p>
            </div>
            <div className="glass g-neutral rounded-2xl px-4 py-4 text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <p className="display text-3xl font-extrabold tnum" style={{ color: '#1a1726' }}>{freeSessions.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>Toplam Seans</p>
            </div>
          </div>

          <p className="text-center text-[11px] mt-5" style={{ color: 'rgba(26,23,38,0.4)' }}>
            Her tamamlanan serbest seans 10 XP kazandırır.
          </p>
        </>
      )}
    </div>
  )
}

const ExpandIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)
