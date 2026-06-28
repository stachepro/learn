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

  const boostLocked = log.boostUsed
  const boostOn = log.boostMode

  // small frosted control buttons share this look
  const ctrlBtn = 'btn-press flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm'

  return (
    <>
      {editing && <AddHabitModal onClose={() => setEditing(false)} editHabit={habit} />}

      <div className={`glass soft-trans ${log.completed ? 'g-lime' : 'g-neutral'}`} style={{ borderRadius: 22 }}>
        {/* Category color seam on the left edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 z-[1]"
          style={{ background: log.completed ? '#3f9a55' : catColors.text, opacity: log.completed ? 1 : 0.85 }}
        />

        {/* Main row */}
        <div className="flex items-center gap-2.5 pl-4 pr-3 py-3">
          {/* Checkbox */}
          <button
            onClick={handleCheck}
            aria-label={log.completed ? 'Tamamlandı olarak işaretle' : 'Tamamlandı işaretini kaldır'}
            className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center soft-trans ${checkAnim ? 'animate-check' : ''}`}
            style={{
              background: log.completed ? '#2f7d44' : 'rgba(255,255,255,0.32)',
              border: `2px solid ${log.completed ? '#2f7d44' : 'rgba(33,48,61,0.28)'}`,
              boxShadow: log.completed ? '0 4px 10px -3px rgba(47,125,68,0.7)' : 'inset 0 1px 2px rgba(12,30,46,0.18)',
            }}
          >
            {log.completed && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4.5L4 7.5L10 1.5" stroke="#eef7f0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Emoji */}
          <span className="text-xl flex-shrink-0 w-7 text-center leading-none">{habit.emoji}</span>

          {/* Name + category */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate leading-tight soft-trans"
              style={{
                textDecoration: log.completed ? 'line-through' : 'none',
                opacity: log.completed ? 0.55 : 1,
              }}
            >
              {habit.name}
            </p>
            {cat && (
              <p className="text-[11px] leading-tight mt-0.5 font-medium ink-60">
                {cat.emoji} {cat.name}
              </p>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Pomodoro stats (desktop) */}
            <span className="text-[11px] hidden sm:inline-block w-[88px] text-right ink-45">
              {pomCount > 0 ? `🍅${pomCount} · ${formatMinutes(workMin)}` : ''}
            </span>

            {/* BOOST */}
            <button
              onClick={() => !boostLocked && setHabitBoostMode(habit.id, !boostOn)}
              disabled={boostLocked}
              className="btn-press flex-shrink-0 h-7 rounded-full text-[10px] font-bold tracking-wider soft-trans"
              style={{
                width: 54,
                background: boostLocked
                  ? 'rgba(255,255,255,0.18)'
                  : boostOn
                    ? 'rgba(215,132,42,0.92)'
                    : 'rgba(255,255,255,0.30)',
                border: `1px solid ${boostOn && !boostLocked ? 'rgba(215,132,42,0.5)' : 'rgba(255,255,255,0.4)'}`,
                color: boostLocked
                  ? 'rgba(33,48,61,0.30)'
                  : boostOn
                    ? '#4a2806'
                    : 'rgba(33,48,61,0.55)',
                boxShadow: boostOn && !boostLocked ? '0 4px 12px -4px rgba(215,132,42,0.8)' : 'none',
                cursor: boostLocked ? 'not-allowed' : 'pointer',
              }}
              title={boostLocked ? 'Bu gün boost kullanıldı ✓' : boostOn ? 'Boost aktif (×1.5 süre + ×1.5 XP)' : 'Boost aç'}
            >
              {boostLocked ? '⚡✓' : boostOn ? '⚡ON' : 'BOOST'}
            </button>

            {/* Note */}
            <button
              onClick={handleNoteToggle}
              aria-label="Not"
              className={ctrlBtn}
              style={noteOpen || log.notes
                ? { background: 'rgba(255,255,255,0.55)', color: '#21303d' }
                : { background: 'rgba(255,255,255,0.22)', color: 'rgba(33,48,61,0.5)' }}
            >
              ✎
            </button>

            {/* Edit */}
            <button
              onClick={() => setEditing(true)}
              aria-label="Düzenle"
              className={ctrlBtn}
              style={{ background: 'rgba(255,255,255,0.22)', color: 'rgba(33,48,61,0.5)' }}
            >
              ⊙
            </button>

            {/* Delete */}
            <button
              onClick={handleDeleteClick}
              aria-label="Sil"
              className={ctrlBtn}
              style={confirmDel
                ? { background: 'rgba(192,67,46,0.92)', color: '#fff5f2' }
                : { background: 'rgba(255,255,255,0.22)', color: 'rgba(192,67,46,0.75)' }}
              title={confirmDel ? 'Emin misin? Tekrar tıkla' : 'Sil'}
            >
              {confirmDel ? '!' : '✕'}
            </button>

            {/* Pomodoro start */}
            <button
              onClick={() => startPomodoro(habit.id)}
              disabled={timerRunning}
              className="btn-press flex-shrink-0 h-7 rounded-full text-[11px] font-bold soft-trans flex items-center justify-center gap-1"
              style={{
                width: 74,
                background: timerRunning
                  ? boostActive ? 'rgba(215,132,42,0.92)' : 'rgba(192,67,46,0.92)'
                  : 'rgba(33,48,61,0.88)',
                color: timerRunning
                  ? boostActive ? '#4a2806' : '#fff5f2'
                  : '#eef4f4',
                boxShadow: '0 6px 14px -6px rgba(15,30,46,0.6)',
              }}
            >
              {timerRunning ? (boostActive ? '⚡Aktif' : '🍅Aktif') : '🍅 Başlat'}
            </button>
          </div>
        </div>

        {/* Mobile pomodoro stats */}
        {pomCount > 0 && (
          <div className="sm:hidden px-4 pb-2.5 flex gap-2 text-[11px] ink-45">
            <span>🍅 {pomCount}</span><span>·</span><span>{formatMinutes(workMin)}</span>
          </div>
        )}

        {/* Note — animated */}
        <div style={{ maxHeight: noteOpen ? '120px' : 0, overflow: 'hidden', transition: 'max-height 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="px-4 pb-3 pt-2" style={{ borderTop: '1px solid rgba(33,48,61,0.12)' }}>
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
