import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import { getCategoryColor } from '../utils/categories'
import { formatMinutes } from '../utils/date'
import AddHabitModal from './AddHabitModal'
import type { Habit, HabitLog } from '../types'

interface Props {
  habit: Habit
  log: HabitLog
}

export default function HabitRow({ habit, log }: Props) {
  const { toggleHabitComplete, setHabitBoostMode, setHabitNote, deleteHabit, categories } = useApp()
  const { startPomodoro, activeHabitId, phase, isBoostSession } = usePomodoro()
  const [noteOpen, setNoteOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [checkAnim, setCheckAnim] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const delTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cat = categories.find((c) => c.id === habit.categoryId)
  const catColors = getCategoryColor(cat?.color ?? '#6b7280')
  const workMin = log.pomodoroSessions.reduce((a, s) => a + s.workDuration, 0)
  const pomCount = log.pomodoroSessions.length
  const timerRunning = activeHabitId === habit.id && (phase === 'work' || phase === 'break')
  const boostActive = timerRunning && isBoostSession && activeHabitId === habit.id

  const handleCheck = () => {
    setCheckAnim(true)
    setTimeout(() => setCheckAnim(false), 320)
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

  // Boost button: locked once successfully used (boostUsed=true)
  const boostLocked = log.boostUsed
  const boostOn = log.boostMode

  return (
    <>
      {editing && <AddHabitModal onClose={() => setEditing(false)} editHabit={habit} />}

      <div
        className="habit-row-inner rounded-2xl overflow-hidden"
        style={{
          background: log.completed
            ? 'rgba(5, 55, 35, 0.58)'
            : 'rgba(10, 28, 92, 0.52)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: `1px solid ${log.completed ? 'rgba(34,197,94,0.28)' : 'rgba(70,135,255,0.28)'}`,
          borderLeftWidth: 3,
          borderLeftColor: log.completed ? '#22c55e' : catColors.border,
          boxShadow: log.completed
            ? '0 16px 45px rgba(0,40,20,0.5), inset 0 2px 0 rgba(60,220,100,0.18), inset 0 -2px 0 rgba(0,30,15,0.42)'
            : '0 16px 45px rgba(0,8,70,0.5), inset 0 2px 0 rgba(120,185,255,0.2), inset 0 -2px 0 rgba(0,0,65,0.42)',
        }}
      >
        {/* Main row */}
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          {/* Checkbox */}
          <button
            onClick={handleCheck}
            className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center ${checkAnim ? 'animate-check' : ''}`}
            style={{
              background: log.completed ? '#22c55e' : 'rgba(255,255,255,0.05)',
              borderColor: log.completed ? '#22c55e' : 'rgba(255,255,255,0.18)',
              transition: 'background 0.2s, border-color 0.2s',
              boxShadow: log.completed ? '0 0 12px rgba(34,197,94,0.4)' : 'none',
            }}
          >
            {log.completed && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4.5L4 7.5L10 1.5" stroke="#07070f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Emoji */}
          <span className="text-xl flex-shrink-0 w-7 text-center leading-none">{habit.emoji}</span>

          {/* Name + category */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate leading-tight"
              style={{
                color: log.completed ? 'rgba(255,255,255,0.35)' : '#e8e8f4',
                textDecoration: log.completed ? 'line-through' : 'none',
                transition: 'color 0.25s',
              }}
            >
              {habit.name}
            </p>
            {cat && (
              <p className="text-[11px] leading-tight mt-0.5 font-medium" style={{ color: catColors.text }}>
                {cat.emoji} {cat.name}
              </p>
            )}
          </div>

          {/* Right controls — all fixed width */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Pomodoro stats */}
            <span className="text-[11px] hidden sm:inline-block w-[90px] text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {pomCount > 0 ? `🍅${pomCount} · ${formatMinutes(workMin)}` : ''}
            </span>

            {/* BOOST — fixed 54px. Locked after success, disabled when already locked */}
            <button
              onClick={() => !boostLocked && setHabitBoostMode(habit.id, !boostOn)}
              disabled={boostLocked}
              className="btn-press flex-shrink-0 h-7 rounded-full text-[10px] font-bold tracking-wider transition-all duration-200"
              style={{
                width: 54,
                background: boostLocked
                  ? 'rgba(255,255,255,0.04)'
                  : boostOn
                    ? 'rgba(234,179,8,0.15)'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${boostLocked
                  ? 'rgba(255,255,255,0.06)'
                  : boostOn
                    ? 'rgba(234,179,8,0.45)'
                    : 'rgba(255,255,255,0.1)'}`,
                color: boostLocked
                  ? 'rgba(255,255,255,0.12)'
                  : boostOn
                    ? '#fde047'
                    : 'rgba(255,255,255,0.2)',
                boxShadow: boostOn && !boostLocked ? '0 0 10px rgba(234,179,8,0.25)' : 'none',
                cursor: boostLocked ? 'not-allowed' : 'pointer',
              }}
              title={boostLocked ? 'Bu gün boost kullanıldı ✓' : boostOn ? 'Boost aktif (×1.5 süre + ×1.5 XP)' : 'Boost aç'}
            >
              {boostLocked ? '⚡✓' : boostOn ? '⚡ON' : 'BOOST'}
            </button>

            {/* Note */}
            <button
              onClick={handleNoteToggle}
              className="btn-press flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all"
              style={noteOpen || log.notes ? {
                background: 'rgba(99,102,241,0.2)',
                color: '#a5b4fc',
              } : { color: 'rgba(255,255,255,0.2)' }}
            >
              ✎
            </button>

            {/* Edit */}
            <button
              onClick={() => setEditing(true)}
              className="btn-press flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
            >
              ⊙
            </button>

            {/* Delete */}
            <button
              onClick={handleDeleteClick}
              className="btn-press flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all"
              style={confirmDel ? {
                background: 'rgba(239,68,68,0.2)',
                color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.4)',
              } : { color: 'rgba(255,255,255,0.15)' }}
              title={confirmDel ? 'Emin misin? Tekrar tıkla' : 'Sil'}
              onMouseEnter={(e) => { if (!confirmDel) e.currentTarget.style.color = 'rgba(239,68,68,0.6)' }}
              onMouseLeave={(e) => { if (!confirmDel) e.currentTarget.style.color = 'rgba(255,255,255,0.15)' }}
            >
              {confirmDel ? '!' : '✕'}
            </button>

            {/* Pomodoro — fixed 72px */}
            <button
              onClick={() => startPomodoro(habit.id)}
              disabled={timerRunning}
              className="btn-press flex-shrink-0 h-7 rounded-xl text-[11px] font-semibold transition-all duration-200 flex items-center justify-center gap-1"
              style={{
                width: 72,
                background: timerRunning
                  ? boostActive
                    ? 'rgba(234,179,8,0.2)'
                    : 'rgba(239,68,68,0.15)'
                  : 'rgba(255,255,255,0.06)',
                border: `1px solid ${timerRunning
                  ? boostActive
                    ? 'rgba(234,179,8,0.45)'
                    : 'rgba(239,68,68,0.4)'
                  : 'rgba(255,255,255,0.1)'}`,
                color: timerRunning
                  ? boostActive ? '#fde047' : '#fca5a5'
                  : 'rgba(255,255,255,0.45)',
              }}
            >
              {timerRunning ? (boostActive ? '⚡Aktif' : '🍅Aktif') : '🍅 Başlat'}
            </button>
          </div>
        </div>

        {/* Mobile pomodoro stats */}
        {pomCount > 0 && (
          <div className="sm:hidden px-3.5 pb-2.5 flex gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>🍅 {pomCount}</span><span>·</span><span>{formatMinutes(workMin)}</span>
          </div>
        )}

        {/* Note — animated */}
        <div style={{ maxHeight: noteOpen ? '120px' : 0, overflow: 'hidden', transition: 'max-height 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="px-3.5 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <textarea
              ref={noteRef}
              value={log.notes}
              onChange={(e) => setHabitNote(habit.id, e.target.value)}
              placeholder="Bugün hakkında bir not..."
              rows={2}
              className="glass-input"
            />
          </div>
        </div>
      </div>
    </>
  )
}
