import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { storage } from '../utils/storage'
import { formatHMS } from '../utils/date'
import { playConfirm } from '../utils/sound'
import type { NoRushStage, NoRushRecord } from '../types'

function newStage(): NoRushStage {
  return { id: crypto.randomUUID(), text: '', status: 'pending', elapsedSeconds: 0, startedAt: null }
}

function liveStageSeconds(stage: NoRushStage, now: number): number {
  if (stage.status === 'running' && stage.startedAt) {
    return stage.elapsedSeconds + (now - stage.startedAt) / 1000
  }
  return stage.elapsedSeconds
}

/* ── Icons ── */
type IconProps = { size?: number; color?: string }

function IconGrip({ size = 16, color = 'rgba(26,23,38,0.32)' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}

function IconUndo({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 1 0 3-6.7L3 9" />
    </svg>
  )
}

function IconX({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconHistory({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  )
}

function IconCheck({ size = 14, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 8 6.5 12.5 14 4" />
    </svg>
  )
}

/* ── History modal ── */
function HistoryModal({ onClose }: { onClose: () => void }) {
  const [exiting, setExiting] = useState(false)
  const [records] = useState<NoRushRecord[]>(() => storage.getNoRushHistory())

  const handleClose = () => {
    if (exiting) return
    playConfirm()
    setExiting(true)
    setTimeout(onClose, 180)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [exiting])

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className={`fixed inset-0 ${exiting ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        onClick={handleClose}
      />
      <div
        className="relative flex min-h-full items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <div
          className={`glass g-neutral w-full max-w-md ${exiting ? 'animate-fade-down' : 'animate-fade-up'}`}
          style={{ borderRadius: 28, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
            <h2 className="display text-lg font-bold">Geçmiş Görevler</h2>
            <button onClick={handleClose} aria-label="Kapat" className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center">
              <IconX color="rgba(26,23,38,0.7)" />
            </button>
          </div>
          <div className="overflow-y-auto">
            {records.length === 0 ? (
              <p className="px-5 py-10 text-sm text-center ink-45">Henüz tamamlanmış görev yok</p>
            ) : (
              records.map((r, idx) => (
                <div
                  key={r.id}
                  className="px-5 py-3.5"
                  style={{ borderBottom: idx < records.length - 1 ? '1px solid rgba(26,23,38,0.06)' : 'none' }}
                >
                  <p className="text-sm font-semibold" style={{ color: '#1a1726' }}>{r.title || 'İsimsiz görev'}</p>
                  <p className="text-xs mt-1 ink-45">
                    {r.stageCount} aşama · {formatHMS(r.totalSeconds)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── Summary modal ── */
function SummaryModal({ title, stages, totalSeconds, onClose }: {
  title: string; stages: NoRushStage[]; totalSeconds: number; onClose: () => void
}) {
  const [exiting, setExiting] = useState(false)
  const doneStages = stages.filter((s) => s.status === 'done')

  const handleClose = () => {
    if (exiting) return
    playConfirm()
    setExiting(true)
    setTimeout(onClose, 180)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className={`fixed inset-0 ${exiting ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          className={`glass g-lime w-full max-w-md ${exiting ? 'animate-fade-down' : 'animate-fade-up'}`}
          style={{ borderRadius: 28, border: '1px solid rgba(34,197,94,0.35)' }}
        >
          <div className="px-5 pt-5 pb-2 text-center">
            <p className="display text-lg font-bold" style={{ color: '#15803d' }}>{title || 'İsimsiz görev'}</p>
          </div>

          <div className="px-5 py-2 space-y-2">
            {doneStages.length === 0 ? (
              <p className="text-sm text-center ink-45 py-3">Tamamlanan aşama yok</p>
            ) : (
              doneStages.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
                  >
                    <IconCheck />
                  </span>
                  <span className="text-sm font-medium truncate" style={{ color: '#1a1726' }}>
                    {s.text || 'İsimsiz aşama'}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(21,128,61,0.6)' }}>
              Toplam Geçen Süre
            </p>
            <p className="tnum text-2xl font-mono font-bold mt-1" style={{ color: '#15803d' }}>
              {formatHMS(totalSeconds)}
            </p>
          </div>

          <div className="px-5 pb-5 pt-2 text-center space-y-4">
            <p className="text-base font-bold" style={{ color: '#15803d' }}>🎉 Başardın!</p>
            <button
              onClick={handleClose}
              className="btn-press w-full py-3 rounded-2xl text-sm font-bold"
              style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── Stage card ── */
function StageCard({
  stage, index, onChangeText, onStart, onFinish, onUndo, onDragStart, onDragOver, onDrop, now,
}: {
  stage: NoRushStage
  index: number
  onChangeText: (text: string) => void
  onStart: () => void
  onFinish: () => void
  onUndo: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  now: number
}) {
  const isDone = stage.status === 'done'
  const isRunning = stage.status === 'running'
  const seconds = liveStageSeconds(stage, now)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-all"
      style={{
        background: isDone ? 'rgba(26,23,38,0.05)' : '#ffffff',
        border: `1.5px solid ${isRunning ? 'rgba(34,197,94,0.7)' : isDone ? 'rgba(26,23,38,0.08)' : 'rgba(26,23,38,0.1)'}`,
        boxShadow: isRunning ? '0 0 0 3px rgba(34,197,94,0.16)' : 'none',
        opacity: isDone ? 0.7 : 1,
      }}
    >
      <span style={{ cursor: 'grab', touchAction: 'none' }} className="flex-shrink-0">
        <IconGrip />
      </span>

      {isDone ? (
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.85)', color: '#06210f' }}
        >
          <IconCheck size={12} />
        </span>
      ) : (
        <span
          className="tnum w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(26,23,38,0.06)', color: 'rgba(26,23,38,0.55)' }}
        >
          {index + 1}
        </span>
      )}

      <input
        type="text"
        value={stage.text}
        onChange={(e) => onChangeText(e.target.value)}
        readOnly={isDone}
        placeholder="Bu aşamada ne yapılacak?"
        className="flex-1 min-w-0 text-sm bg-transparent outline-none"
        style={{ color: '#1a1726' }}
      />

      {(isRunning || isDone) && (
        <span className="tnum text-xs font-mono font-semibold flex-shrink-0" style={{ color: isRunning ? '#c2410c' : 'rgba(26,23,38,0.4)' }}>
          {formatHMS(seconds)}
        </span>
      )}

      {isDone ? (
        <button
          onClick={() => { playConfirm(); onUndo() }}
          aria-label="Geri Al"
          title="Geri Al"
          className="ctrl btn-press w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        >
          <IconUndo />
        </button>
      ) : isRunning ? (
        <button
          onClick={() => { playConfirm(); onFinish() }}
          className="btn-press px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
        >
          Bitirdim
        </button>
      ) : (
        <button
          onClick={() => { playConfirm(); onStart() }}
          className="btn-press px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.9)', color: '#fff' }}
        >
          Başladım
        </button>
      )}
    </div>
  )
}

/* ── Page ── */
export default function NoRush() {
  const [title, setTitle] = useState('')
  const [stages, setStages] = useState<NoRushStage[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [showHistory, setShowHistory] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const dragIndex = useRef<number | null>(null)

  const hasRunning = stages.some((s) => s.status === 'running')
  const doneCount = stages.filter((s) => s.status === 'done').length

  useEffect(() => {
    if (!hasRunning) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [hasRunning])

  const totalSeconds = stages.reduce((acc, s) => acc + liveStageSeconds(s, now), 0)

  const addStage = () => setStages((prev) => [...prev, newStage()])

  const updateStageText = (id: string, text: string) =>
    setStages((prev) => prev.map((s) => s.id === id ? { ...s, text } : s))

  const startStage = (id: string) =>
    setStages((prev) => prev.map((s) => s.id === id ? { ...s, status: 'running', startedAt: Date.now() } : s))

  const finishStage = (id: string) =>
    setStages((prev) => prev.map((s) => {
      if (s.id !== id) return s
      const banked = liveStageSeconds(s, Date.now())
      return { ...s, status: 'done', elapsedSeconds: banked, startedAt: null }
    }))

  const undoStage = (id: string) =>
    setStages((prev) => prev.map((s) => s.id === id ? { ...s, status: 'pending', startedAt: null } : s))

  const handleDragStart = (index: number) => { dragIndex.current = index }
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (index: number) => {
    const from = dragIndex.current
    dragIndex.current = null
    if (from === null || from === index) return
    setStages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(index, 0, moved)
      return next
    })
  }

  const finishTask = () => {
    setShowSummary(true)
  }

  const closeSummary = () => {
    storage.addNoRushRecord({
      id: crypto.randomUUID(),
      title,
      stageCount: stages.length,
      totalSeconds,
      completedAt: new Date().toISOString(),
    })
    setShowSummary(false)
    setTitle('')
    setStages([])
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-40">
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {showSummary && (
        <SummaryModal title={title} stages={stages} totalSeconds={totalSeconds} onClose={closeSummary} />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { playConfirm(); setShowHistory(true) }}
          className="ctrl btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
        >
          <IconHistory /> Geçmiş Görevler
        </button>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] ink-45">Geçen Vakit</p>
          <p className="tnum text-base font-mono font-bold" style={{ color: '#1a1726' }}>{formatHMS(totalSeconds)}</p>
        </div>
      </div>

      {/* Section 1 — Ne yapıyoruz? */}
      <div
        className="glass g-cream mb-6 px-5 py-4"
        style={{ borderRadius: 22, boxShadow: '0 10px 26px -18px rgba(180,120,30,0.55), 0 1px 2px rgba(26,23,38,0.04)' }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: '#b45309' }}>
          Ne yapıyoruz?
        </p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Yapacağımız şeye bir isim ver"
          className="w-full text-xl font-bold bg-transparent outline-none"
          style={{ color: '#1a1726' }}
        />
      </div>

      {/* Section 2 — Aşamalar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="display text-lg font-bold" style={{ color: '#1a1726' }}>Aşamalar</h2>
          {stages.length > 0 && (
            <span className="tnum text-sm font-bold" style={{ color: 'rgba(26,23,38,0.45)' }}>
              {doneCount}/{stages.length}
            </span>
          )}
        </div>
        <p className="text-sm mb-4" style={{ color: 'rgba(26,23,38,0.55)' }}>
          Yapacağın şeyler gözünde büyüyor olabilir. Sorun değil. Onları küçük parçalara bölelim ve sırasıyla bitirelim.
        </p>

        <div className="space-y-2 mb-4">
          {stages.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              index={index}
              now={now}
              onChangeText={(text) => updateStageText(stage.id, text)}
              onStart={() => startStage(stage.id)}
              onFinish={() => finishStage(stage.id)}
              onUndo={() => undoStage(stage.id)}
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
            />
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={() => { playConfirm(); addStage() }}
            aria-label="Aşama ekle"
            className="btn-press w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: 'rgba(26,23,38,0.06)', color: '#1a1726', border: '1px solid rgba(26,23,38,0.1)' }}
          >
            +
          </button>
        </div>

        <button
          onClick={() => { playConfirm(); finishTask() }}
          className="btn-press w-full py-3.5 rounded-2xl text-sm font-bold"
          style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
        >
          Bitir
        </button>
      </div>
    </div>
  )
}
