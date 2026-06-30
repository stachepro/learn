import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import { getCategoryColor, POMODORO_CATEGORY_IDS } from '../utils/categories'
import { formatMinutes } from '../utils/date'
import AddHabitModal from './AddHabitModal'
import type { Habit, HabitLog } from '../types'
import { getHabitMode, getHabitGoal } from '../types'

/* ── Shared sub-components (used in both desktop & mobile rows) ── */

function BoostButton({ boostUsedLocked, boostTimerLocked, boostLocked, boostOn, habit, setHabitBoostMode }: {
  boostUsedLocked: boolean; boostTimerLocked: boolean; boostLocked: boolean; boostOn: boolean
  habit: Habit; setHabitBoostMode: (id: string, on: boolean) => void
}) {
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => !boostLocked && setHabitBoostMode(habit.id, !boostOn)}
        disabled={boostLocked}
        className="btn-press h-7 rounded-full text-[10px] font-bold tracking-wider soft-trans"
        style={{
          width: 54,
          background: boostUsedLocked ? 'rgba(255,255,255,0.05)' : boostOn ? 'rgba(245,158,11,0.92)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${boostOn && !boostUsedLocked ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.1)'}`,
          color: boostUsedLocked ? 'rgba(232,237,238,0.28)' : boostOn ? '#2a1804' : 'rgba(232,237,238,0.6)',
          boxShadow: boostOn && !boostUsedLocked ? '0 4px 14px -4px rgba(245,158,11,0.8)' : 'none',
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
        style={{ background: 'rgba(245,158,11,0.9)', color: '#2a1804' }}>1.5×</span>
    </div>
  )
}

function NoteBtn({ noteOpen, hasNote, onClick }: { noteOpen: boolean; hasNote: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Not"
      className={`btn-press flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm soft-trans ${noteOpen || hasNote ? '' : 'ctrl'}`}
      style={noteOpen || hasNote ? { background: 'rgba(34,197,94,0.18)', color: '#6ee79f', border: '1px solid rgba(34,197,94,0.35)' } : undefined}
    >✎</button>
  )
}

function DeleteBtn({ confirmDel, onClick }: { confirmDel: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Sil"
      className={`btn-press flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm soft-trans ${confirmDel ? '' : 'ctrl'}`}
      style={confirmDel ? { background: 'rgba(225,90,60,0.92)', color: '#fff5f2' } : { color: 'rgba(239,122,90,0.8)' }}
      title={confirmDel ? 'Emin misin? Tekrar tıkla' : 'Sil'}
    >{confirmDel ? '!' : '✕'}</button>
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
          ? boostActive ? 'rgba(245,158,11,0.92)' : extraActive ? 'rgba(225,90,60,0.75)' : 'rgba(225,90,60,0.92)'
          : 'linear-gradient(160deg, #2fd06a, #1f9d4d)',
        color: timerRunning ? (boostActive ? '#2a1804' : '#fff5f2') : '#06210f',
        boxShadow: timerRunning ? '0 6px 16px -6px rgba(0,0,0,0.6)' : '0 6px 16px -6px rgba(34,197,94,0.6)',
      }}
    >
      {timerRunning ? (boostActive ? '⚡Aktif' : extraActive ? '🍅+1.5×' : '🍅Aktif') : goalMet ? '🍅 +Ekstra' : '🍅 Başlat'}
    </button>
  )
}

interface Props {
  habit: Habit
  log: HabitLog
}

export default function HabitRow({ habit, log }: Props) {
  const { toggleHabitComplete, incrementCompletion, setHabitBoostMode, setHabitNote, deleteHabit, categories } = useApp()
  const { startPomodoro, activeHabitId, phase, isBoostSession, isExtraSession } = usePomodoro()
  const [noteOpen, setNoteOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [checkAnim, setCheckAnim] = useState(false)
  const [flash, setFlash] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [confirmPomodoro, setConfirmPomodoro] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const delTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cat = categories.find((c) => c.id === habit.categoryId)
  const catColors = getCategoryColor(cat?.color ?? '#6b7280')
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

  // Pomodoro UI visibility (only for pomodoro mode habits in supporting categories)
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
    }
    toggleHabitComplete(habit.id)
  }

  const handleNoteToggle = () => {
    setNoteOpen((o) => { if (!o) setTimeout(() => noteRef.current?.focus(), 50); return !o })
  }

  const handleDeleteClick = () => {
    if (confirmDel) {
      if (delTimer.current) clearTimeout(delTimer.current)
      deleteHabit(habit.id)
    } else {
      setConfirmDel(true)
      delTimer.current = setTimeout(() => setConfirmDel(false), 3000)
    }
  }

  const boostUsedLocked = log.boostUsed
  const boostTimerLocked = timerRunning    // freeze boost while Pomodoro is active
  const boostLocked = boostUsedLocked || boostTimerLocked
  const boostOn = log.boostMode

  // small frosted control buttons share this look
  const ctrlBtn = 'ctrl btn-press flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm'

  return (
    <>
      {editing && createPortal(
        <AddHabitModal onClose={() => setEditing(false)} editHabit={habit} />,
        document.body,
      )}

      <div
        className={`glass soft-trans ${log.completed ? 'g-lime' : 'g-neutral'} ${flash ? 'animate-done-flash' : ''}`}
        style={{ borderRadius: 22 }}
      >
        {/* Category color seam on the left edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 z-[1] soft-trans"
          style={{
            background: log.completed ? 'rgb(34,197,94)' : catColors.text,
            opacity: log.completed ? 1 : 0.85,
            boxShadow: log.completed ? '0 0 14px rgba(34,197,94,0.7)' : 'none',
          }}
        />

        {/* Label color radial glow */}
        {habit.labelColor && (
          <div
            className="pointer-events-none"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 50%, ${hexToRgba(habit.labelColor, 0.35)} 0%, transparent 68%)`,
              borderRadius: 22,
            }}
          />
        )}

        {/* ── Shared: checkbox + emoji + name always in one line ── */}
        <div className="flex items-center gap-2.5 pl-4 pr-3 py-3">
          {/* Checkbox / Multi counter */}
          {isMultiMode ? (
            <button
              onClick={multiAtMax ? undefined : () => incrementCompletion(habit.id)}
              aria-label={multiAtMax ? 'Günlük maksimuma ulaşıldı' : `Tamamla (${completionCount}/${habitGoal})`}
              title={multiAtMax ? 'Bu günlük bu kadar yeter, yoruldun 💪' : undefined}
              className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold soft-trans ${checkAnim ? 'animate-check' : ''}`}
              style={{
                background: multiAtMax ? 'rgba(255,255,255,0.04)' : multiGoalMet ? 'rgba(34,197,94,0.22)' : 'rgba(59,130,246,0.16)',
                border: `2px solid ${multiAtMax ? 'rgba(255,255,255,0.08)' : multiGoalMet ? 'rgba(34,197,94,0.6)' : 'rgba(59,130,246,0.45)'}`,
                boxShadow: multiGoalMet && !multiAtMax ? '0 4px 14px -3px rgba(34,197,94,0.5)' : 'none',
                color: multiAtMax ? 'rgba(255,255,255,0.2)' : multiGoalMet ? '#6ee79f' : '#93c5fd',
                cursor: multiAtMax ? 'not-allowed' : 'pointer',
              }}
            >
              {multiAtMax ? '🔒' : completionCount > 0 ? `${completionCount}` : '+'}
            </button>
          ) : (
            <button
              onClick={checkboxLocked ? () => setConfirmPomodoro((v) => !v) : handleCheck}
              aria-label={log.completed ? 'Tamamlandı işaretini kaldır' : checkboxLocked ? 'Pomodoro olmadan tamamla' : 'Bitir'}
              className={`flex-shrink-0 h-7 px-2.5 rounded-xl flex items-center justify-center gap-1 text-[11px] font-bold soft-trans ${checkAnim ? 'animate-check' : ''}`}
              style={{
                background: log.completed ? 'rgba(34,197,94,0.18)' : checkboxLocked ? (confirmPomodoro ? 'rgba(225,90,60,0.18)' : 'rgba(225,90,60,0.08)') : 'rgba(34,197,94,0.14)',
                border: `1.5px solid ${log.completed ? 'rgba(34,197,94,0.55)' : checkboxLocked ? (confirmPomodoro ? 'rgba(225,90,60,0.7)' : 'rgba(225,90,60,0.32)') : 'rgba(34,197,94,0.38)'}`,
                color: log.completed ? '#6ee79f' : checkboxLocked ? 'rgba(240,138,106,0.85)' : '#6ee79f',
                cursor: 'pointer',
              }}
            >
              {log.completed ? (
                <><svg width="10" height="8" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Bitti</>
              ) : checkboxLocked ? (
                <>🍅 Bitir</>
              ) : (
                <><svg width="10" height="8" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Bitir</>
              )}
            </button>
          )}

          {/* Emoji */}
          <span className="text-xl flex-shrink-0 w-7 text-center leading-none">{habit.emoji}</span>

          {/* Name + category */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold leading-snug truncate soft-trans"
              style={{ textDecoration: log.completed ? 'line-through' : 'none', opacity: log.completed ? 0.6 : 1 }}
            >
              {habit.name}
            </p>
            {cat && (
              <p className="text-[11px] leading-tight mt-0.5 font-medium ink-60">{cat.emoji} {cat.name}</p>
            )}
          </div>

          {/* ── DESKTOP ONLY: all controls inline ── */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            {/* Stats */}
            {(isMultiMode || pomCount > 0) && (
              <span className="text-[11px] text-right ink-45 mr-1" style={{ minWidth: 80 }}>
                {isMultiMode ? (
                  <span className="flex items-center justify-end gap-1">
                    <span style={{ color: multiGoalMet ? '#6ee79f' : '#93c5fd' }}>🔁 {completionCount}/{habitGoal}</span>
                    {completionCount > habitGoal && <span style={{ color: '#93c5fd', opacity: 0.7 }}>+{completionCount - habitGoal}</span>}
                  </span>
                ) : isGoalMode ? (
                  <span className="flex items-center justify-end gap-1">
                    <span>🍅 {Math.min(pomCount, pomGoal)}/{pomGoal}</span>
                    {extraCount > 0 && <span className="text-[10px] font-bold" style={{ color: '#f08a6a' }}>+{extraCount}</span>}
                    {extraCount > 0 && <span className="text-[9px] font-bold px-1 rounded" style={{ background: 'rgba(225,90,60,0.2)', color: '#f08a6a' }}>1.5×</span>}
                  </span>
                ) : (
                  `🍅${pomCount} · ${formatMinutes(workMin)}`
                )}
              </span>
            )}

            {/* Boost */}
            {showPomodoroUI && <BoostButton {...{ boostUsedLocked, boostTimerLocked, boostLocked, boostOn, habit, setHabitBoostMode }} />}

            {/* Note */}
            <NoteBtn noteOpen={noteOpen} hasNote={!!log.notes} onClick={handleNoteToggle} />

            {/* Edit */}
            <button onClick={() => setEditing(true)} aria-label="Düzenle" className={ctrlBtn}>⊙</button>

            {/* Delete */}
            <DeleteBtn confirmDel={confirmDel} onClick={handleDeleteClick} />

            {/* Pomodoro start */}
            {showPomodoroUI && <PomodoroBtn {...{ timerRunning, boostActive, extraActive, goalMet, habit, startPomodoro }} />}
          </div>
        </div>

        {/* ── MOBILE ONLY: controls row ── */}
        <div className="sm:hidden flex items-center justify-end gap-1.5 px-3 pb-2.5">
          {/* Stats */}
          {(isMultiMode || pomCount > 0) && (
            <span className="text-[11px] ink-45 mr-auto">
              {isMultiMode ? (
                <span style={{ color: multiGoalMet ? '#6ee79f' : '#93c5fd' }}>
                  🔁 {completionCount}/{habitGoal}
                  {multiAtMax && ' · 💪'}
                </span>
              ) : isGoalMode ? (
                <span>🍅 {Math.min(pomCount, pomGoal)}/{pomGoal}{extraCount > 0 ? ` +${extraCount}` : ''}</span>
              ) : (
                <span>🍅 {pomCount} · {formatMinutes(workMin)}</span>
              )}
            </span>
          )}

          {/* Boost */}
          {showPomodoroUI && <BoostButton {...{ boostUsedLocked, boostTimerLocked, boostLocked, boostOn, habit, setHabitBoostMode }} />}

          {/* Note */}
          <NoteBtn noteOpen={noteOpen} hasNote={!!log.notes} onClick={handleNoteToggle} />

          {/* Edit */}
          <button onClick={() => setEditing(true)} aria-label="Düzenle" className={ctrlBtn}>⊙</button>

          {/* Delete */}
          <DeleteBtn confirmDel={confirmDel} onClick={handleDeleteClick} />

          {/* Pomodoro start */}
          {showPomodoroUI && <PomodoroBtn {...{ timerRunning, boostActive, extraActive, goalMet, habit, startPomodoro }} />}
        </div>

        {/* Pomodoro override confirmation — animated */}
        <div style={{ maxHeight: confirmPomodoro ? '160px' : 0, overflow: 'hidden', transition: 'max-height 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm leading-snug" style={{ color: 'rgba(241,245,245,0.72)' }}>
              Bu görev Pomodoro ile tamamlanmak üzere ayarlandı. Yine de şimdi bitirmek istiyor musun?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { handleCheck(); setConfirmPomodoro(false) }}
                className="btn-press flex-1 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
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

        {/* Note — animated */}
        <div style={{ maxHeight: noteOpen ? '120px' : 0, overflow: 'hidden', transition: 'max-height 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="px-4 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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
