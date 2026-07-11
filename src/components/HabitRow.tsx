import { useState, useRef, useEffect } from 'react'

import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import { getCardPalette, POMODORO_CATEGORY_IDS, type CardPalette } from '../utils/categories'
import { formatMinutes } from '../utils/date'
import { playBell } from '../utils/sound'
import type { Habit, HabitLog } from '../types'
import { getHabitMode, getHabitGoal } from '../types'

/* ── Shared sub-components (used in both desktop & mobile rows) ── */

function BoostButton({ boostUsedLocked, boostTimerLocked, boostLocked, boostOn, habit, setHabitBoostMode, pal }: {
  boostUsedLocked: boolean; boostTimerLocked: boolean; boostLocked: boolean; boostOn: boolean
  habit: Habit; setHabitBoostMode: (id: string, on: boolean) => void; pal: CardPalette
}) {
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => !boostLocked && setHabitBoostMode(habit.id, !boostOn)}
        disabled={boostLocked}
        className="btn-press h-7 rounded-full text-[10px] font-bold tracking-wider soft-trans"
        style={{
          width: 54,
          background: boostUsedLocked ? pal.chipSoft : boostOn ? '#f59e0b' : pal.chip,
          border: `1px solid ${boostOn && !boostUsedLocked ? 'rgba(245,158,11,0.55)' : 'rgba(0,0,0,0.08)'}`,
          color: boostUsedLocked ? pal.textSoft : boostOn ? '#2a1804' : pal.text,
          opacity: boostTimerLocked && !boostUsedLocked ? 0.45 : 1,
          cursor: boostLocked ? 'not-allowed' : 'pointer',
        }}
        title={
          boostUsedLocked ? 'Bu gün boost kullanıldı ✓'
          : boostTimerLocked ? 'Pomodoro çalışırken değiştirilemez 🔒'
          : boostOn ? 'Boost aktif (×1.5 süre + ×1.5 XP)'
          : 'Boost aç'
        }
      >
        {boostUsedLocked ? '⚡✓' : boostOn ? '⚡ON' : 'BOOST'}
      </button>
      <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black px-1 rounded-full leading-tight"
        style={{ background: '#f59e0b', color: '#2a1804' }}>1.5×</span>
    </div>
  )
}

function NoteBtn({ noteOpen, hasNote, onClick, pal }: { noteOpen: boolean; hasNote: boolean; onClick: () => void; pal: CardPalette }) {
  return (
    <button
      onClick={onClick}
      aria-label="Not"
      className="btn-press flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm soft-trans"
      style={noteOpen || hasNote
        ? { background: 'rgba(34,197,94,0.18)', color: '#16803c', border: '1px solid rgba(34,197,94,0.4)' }
        : { background: pal.chipSoft, color: pal.textSoft, border: '1px solid rgba(0,0,0,0.07)' }}
    >✎</button>
  )
}

function PomodoroBtn({ timerRunning, boostActive, extraActive, goalMet, habit, startPomodoro }: {
  timerRunning: boolean; boostActive: boolean; extraActive: boolean; goalMet: boolean
  habit: Habit; startPomodoro: (id: string) => void
}) {
  return (
    <button
      onClick={() => startPomodoro(habit.id)}
      disabled={timerRunning}
      className="btn-press flex-shrink-0 h-7 rounded-full text-[11px] font-bold soft-trans flex items-center justify-center gap-1"
      style={{
        width: extraActive ? 84 : 74,
        background: timerRunning
          ? boostActive ? '#f59e0b' : extraActive ? '#e8714f' : '#e2503f'
          : 'linear-gradient(160deg, #34d36f, #1f9d4d)',
        color: timerRunning ? (boostActive ? '#2a1804' : '#fff5f2') : '#06210f',
        boxShadow: timerRunning ? '0 4px 12px -5px rgba(0,0,0,0.4)' : '0 6px 16px -7px rgba(34,197,94,0.6)',
      }}
    >
      {timerRunning ? (boostActive ? '⚡Aktif' : extraActive ? '🍅+1.5×' : '🍅Aktif') : goalMet ? '🍅 +Ekstra' : '🍅 Başlat'}
    </button>
  )
}

interface Props {
  habit: Habit
  log: HabitLog
  justCompleted?: boolean
}

export default function HabitRow({ habit, log, justCompleted }: Props) {
  const { toggleHabitComplete, incrementCompletion, setHabitBoostMode, setHabitNote, categories } = useApp()
  const { startPomodoro, activeHabitId, phase, isBoostSession, isExtraSession, soundEnabled } = usePomodoro()
  const [noteOpen, setNoteOpen] = useState(false)
  const [checkAnim, setCheckAnim] = useState(false)
  const [flash, setFlash] = useState(false)
  const [confirmPomodoro, setConfirmPomodoro] = useState(false)
  // 'gray': card desaturates in place; 'slide': card slides down & collapses before
  // Dashboard moves it to the Tamamlananlar section
  const [movePhase, setMovePhase] = useState<'idle' | 'gray' | 'slide'>('idle')
  const noteRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!justCompleted) { setMovePhase('idle'); return }
    const t1 = setTimeout(() => setMovePhase('gray'), 250)
    const t2 = setTimeout(() => setMovePhase('slide'), 850)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [justCompleted])

  const cat = categories.find((c) => c.id === habit.categoryId)
  const pal = getCardPalette(habit.labelColor || cat?.color || '#6b7280')
  const workMin = log.pomodoroSessions.reduce((a, s) => a + s.workDuration, 0)
  const pomCount = log.pomodoroSessions.length
  const timerRunning = activeHabitId === habit.id && (phase === 'work' || phase === 'break')
  const boostActive = timerRunning && isBoostSession && activeHabitId === habit.id
  const extraActive = timerRunning && isExtraSession && activeHabitId === habit.id

  // Completion mode
  const habitMode = getHabitMode(habit)
  const habitGoal = getHabitGoal(habit)
  const isMultiMode = habitMode === 'multi'
  const isPomodoroMode = habitMode === 'pomodoro'

  // Pomodoro UI visibility
  const catSupportsPomodoro = POMODORO_CATEGORY_IDS.has(habit.categoryId)
  const showPomodoroUI = isPomodoroMode && catSupportsPomodoro
  const isGoalMode = isPomodoroMode && habitGoal > 0
  const pomGoal = isGoalMode ? habitGoal : 0
  const extraCount = isGoalMode ? Math.max(0, pomCount - pomGoal) : 0
  const goalMet = isGoalMode && pomCount >= pomGoal
  const checkboxLocked = isGoalMode && !log.completed && !goalMet

  // Multi mode
  const completionCount = log.completionCount ?? 0
  const multiGoalMet = isMultiMode && completionCount >= habitGoal
  const multiAtMax = isMultiMode && completionCount >= habitGoal * 2

  const handleCheck = () => {
    const willComplete = !log.completed
    setCheckAnim(true)
    setTimeout(() => setCheckAnim(false), 340)
    if (willComplete) {
      setFlash(true)
      setTimeout(() => setFlash(false), 560)
      if (soundEnabled) playBell()
    }
    toggleHabitComplete(habit.id)
  }

  const handleIncrement = () => {
    const willReachGoal = !multiGoalMet && completionCount + 1 >= habitGoal
    if (willReachGoal && soundEnabled) playBell()
    incrementCompletion(habit.id)
  }

  const handleNoteToggle = () => {
    setNoteOpen((o) => { if (!o) setTimeout(() => noteRef.current?.focus(), 50); return !o })
  }

  const boostUsedLocked = log.boostUsed
  const boostTimerLocked = timerRunning
  const boostLocked = boostUsedLocked || boostTimerLocked
  const boostOn = log.boostMode

  // ── Meta line: category + live count/status ──
  const metaParts: string[] = []
  if (cat) metaParts.push(cat.name)
  if (log.completed) metaParts.push('tamamlandı')
  else if (isMultiMode) metaParts.push(`${completionCount}/${habitGoal}`)
  else if (isGoalMode) metaParts.push(`${Math.min(pomCount, pomGoal)}/${pomGoal} pomodoro${extraCount > 0 ? ` +${extraCount}` : ''}`)
  else if (habit.timeWindow) metaParts.push(`${habit.timeWindow.start}–${habit.timeWindow.end}`)
  else if (pomCount > 0) metaParts.push(`${pomCount} pomodoro · ${formatMinutes(workMin)}`)

  // ── The right-side complete control ──
  const CompleteControl = () => {
    if (isMultiMode) {
      return (
        <button
          onClick={multiAtMax ? undefined : handleIncrement}
          aria-label={multiAtMax ? 'Günlük maksimuma ulaşıldı' : `Tamamla (${completionCount}/${habitGoal})`}
          title={multiAtMax ? 'Bu günlük bu kadar yeter, yoruldun 💪' : undefined}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold soft-trans ${checkAnim ? 'animate-check' : ''}`}
          style={{
            background: multiGoalMet ? '#16a34a' : pal.chip,
            border: `2px solid ${multiGoalMet ? '#16a34a' : pal.accent}`,
            color: multiGoalMet ? '#fff' : pal.accent,
            cursor: multiAtMax ? 'not-allowed' : 'pointer',
            opacity: multiAtMax ? 0.55 : 1,
          }}
        >
          {multiAtMax ? '🔒' : multiGoalMet ? '✓' : completionCount > 0 ? completionCount : '+'}
        </button>
      )
    }
    if (log.completed) {
      return (
        <button
          onClick={handleCheck}
          aria-label="Tamamlandı işaretini kaldır"
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center soft-trans ${checkAnim ? 'animate-check' : ''}`}
          style={{ background: '#16a34a', border: '2px solid #16a34a', boxShadow: '0 4px 12px -4px rgba(34,197,94,0.6)' }}
        >
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1.5 6L5 9.5L12.5 1.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )
    }
    // not completed
    return (
      <button
        onClick={checkboxLocked ? () => setConfirmPomodoro((v) => !v) : handleCheck}
        aria-label={checkboxLocked ? 'Pomodoro olmadan tamamla' : 'Bitir'}
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center soft-trans ${checkAnim ? 'animate-check' : ''}`}
        style={{
          background: pal.chip,
          border: `2px solid ${checkboxLocked ? '#e8714f' : pal.accent}`,
          color: checkboxLocked ? '#cc4322' : pal.accent,
        }}
      >
        {checkboxLocked
          ? <span className="text-sm">🍅</span>
          : <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1.5 6L5 9.5L12.5 1.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" /></svg>}
      </button>
    )
  }

  return (
    <>
      <div
        className={`glass soft-trans tile-press relative overflow-hidden ${flash ? 'animate-done-flash' : ''}`}
        style={{
          borderRadius: 22,
          background: pal.cardBg,
          border: `1px solid ${pal.border}`,
          color: pal.text,
          opacity: log.completed ? 0.92 : 1,
          ...(justCompleted ? {
            filter: movePhase === 'idle' ? 'none' : 'grayscale(1)',
            opacity: movePhase === 'slide' ? 0 : movePhase === 'gray' ? 0.6 : 0.92,
            transform: movePhase === 'slide' ? 'translateY(28px)' : 'none',
            maxHeight: movePhase === 'slide' ? 0 : 480,
            // -10px offsets the list's space-y gap so siblings don't jump on removal
            marginBottom: movePhase === 'slide' ? -10 : 0,
            transition: 'filter 0.4s ease, opacity 0.45s ease, transform 0.5s cubic-bezier(0.55,0,0.65,0.25), max-height 0.5s cubic-bezier(0.4,0,0.2,1), margin-bottom 0.5s ease',
          } : {}),
        }}
      >
        {/* ── Main row ── */}
        <div className="flex items-center gap-3 px-3.5 py-3">
          {/* Icon chip */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px] leading-none flex-shrink-0"
            style={{ background: pal.iconBg }}
          >
            {habit.emoji}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold leading-snug truncate soft-trans"
              style={{ color: pal.text, textDecoration: log.completed ? 'line-through' : 'none', opacity: log.completed ? 0.7 : 1 }}
            >
              {habit.name}
            </p>
            {metaParts.length > 0 && (
              <p className="text-[12px] leading-tight mt-0.5 font-semibold truncate" style={{ color: pal.textSoft }}>
                {metaParts.join(' · ')}
              </p>
            )}
          </div>

          {/* DESKTOP: secondary controls inline */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            {showPomodoroUI && <BoostButton {...{ boostUsedLocked, boostTimerLocked, boostLocked, boostOn, habit, setHabitBoostMode, pal }} />}
            <NoteBtn noteOpen={noteOpen} hasNote={!!log.notes} onClick={handleNoteToggle} pal={pal} />
            {showPomodoroUI && <PomodoroBtn {...{ timerRunning, boostActive, extraActive, goalMet, habit, startPomodoro }} />}
          </div>

          {/* Complete control — always far right */}
          <CompleteControl />
        </div>

        {/* MOBILE: secondary controls row */}
        <div className="sm:hidden flex items-center justify-end gap-1.5 px-3.5 pb-2.5">
          {showPomodoroUI && <BoostButton {...{ boostUsedLocked, boostTimerLocked, boostLocked, boostOn, habit, setHabitBoostMode, pal }} />}
          <NoteBtn noteOpen={noteOpen} hasNote={!!log.notes} onClick={handleNoteToggle} pal={pal} />
          {showPomodoroUI && <PomodoroBtn {...{ timerRunning, boostActive, extraActive, goalMet, habit, startPomodoro }} />}
        </div>

        {/* Pomodoro override confirmation */}
        <div style={{ maxHeight: confirmPomodoro ? '160px' : 0, overflow: 'hidden', transition: 'max-height 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: `1px solid ${pal.border}` }}>
            <p className="text-sm leading-snug" style={{ color: pal.textSoft }}>
              Bu görev Pomodoro ile tamamlanmak üzere ayarlandı. Yine de şimdi bitirmek istiyor musun?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { handleCheck(); setConfirmPomodoro(false) }}
                className="btn-go btn-press flex-1 py-2 rounded-xl text-sm"
              >
                Evet, Bitir
              </button>
              <button
                onClick={() => setConfirmPomodoro(false)}
                className="ctrl btn-press flex-1 py-2 rounded-xl text-sm"
              >
                Hayır
              </button>
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={{ maxHeight: noteOpen ? '120px' : 0, overflow: 'hidden', transition: 'max-height 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="px-4 pb-3 pt-2" style={{ borderTop: `1px solid ${pal.border}` }}>
            <textarea
              ref={noteRef}
              value={log.notes}
              onChange={(e) => setHabitNote(habit.id, e.target.value)}
              placeholder="Bugün hakkında bir not..."
              rows={2}
              className="frost-input"
            />
          </div>
        </div>
      </div>
    </>
  )
}
