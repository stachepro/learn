import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { storage } from '../utils/storage'
import { formatHMS } from '../utils/date'
import BackBar from '../components/BackBar'
import { playConfirm } from '../utils/sound'
import { awardStandaloneBadges } from '../utils/badges'
import type { NoRushStage, NoRushRecord } from '../types'

/* ════════════════════════════════════════════════
   ACELE YOK — büyük görevi küçük aşamalara böl,
   kendi hızında bitir. Kronometre ileri sayar:
   baskı yok, mola serbest. Çalışan aşama "Şu An"
   kartında büyük kronometreyle öne çıkar.
   ════════════════════════════════════════════════ */

function newStage(text = ''): NoRushStage {
  return { id: crypto.randomUUID(), text, status: 'pending', elapsedSeconds: 0, startedAt: null }
}

function liveStageSeconds(stage: NoRushStage, now: number): number {
  if (stage.status === 'running' && stage.startedAt) {
    return stage.elapsedSeconds + (now - stage.startedAt) / 1000
  }
  return stage.elapsedSeconds
}

// Kahve/toprak tonları — Hub'daki "Acele Yok" karosuyla aynı kimlik
const BROWN = '#6b4a35'
const BROWN_SOFT = '#a8846a'
const BROWN_TEXT = 'var(--sf-brown-tx)'

/* ── Icons ── */
type IconProps = { size?: number; color?: string }

function IconGrip({ size = 16, color = 'rgb(var(--ink) / 0.32)' }: IconProps) {
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

function IconLock({ size = 14, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function IconPause({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  )
}

function IconPlay({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 1 }}>
      <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  )
}

function IconPlus({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

/* ── History modal ── */
function HistoryModal({ onClose }: { onClose: () => void }) {
  const [exiting, setExiting] = useState(false)
  const [records, setRecords] = useState<NoRushRecord[]>(() => storage.getNoRushHistory())

  const handleClose = () => {
    if (exiting) return
    playConfirm()
    setExiting(true)
    setTimeout(onClose, 180)
  }

  const handleDelete = (id: string) => {
    playConfirm()
    storage.deleteNoRushRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
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
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgb(var(--ink) / 0.08)' }}>
            <h2 className="display text-lg font-bold">Geçmiş Görevler</h2>
            <button onClick={handleClose} aria-label="Kapat" className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center">
              <IconX color="rgb(var(--ink) / 0.7)" />
            </button>
          </div>
          <div className="overflow-y-auto">
            {records.length === 0 ? (
              <p className="px-5 py-10 text-sm text-center ink-45">Henüz tamamlanmış görev yok</p>
            ) : (
              records.map((r, idx) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: idx < records.length - 1 ? '1px solid rgb(var(--ink) / 0.06)' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--ink))' }}>{r.title || 'İsimsiz görev'}</p>
                    <p className="text-xs mt-1 ink-45">
                      {new Date(r.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · {r.stageCount} aşama · {formatHMS(r.totalSeconds)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    aria-label="Sil"
                    title="Sil"
                    className="ctrl btn-press w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <IconX size={13} />
                  </button>
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
            <p className="text-2xl leading-none mb-1.5">🎉</p>
            <p className="display text-lg font-bold" style={{ color: '#15803d' }}>{title || 'İsimsiz görev'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(21,128,61,0.6)' }}>Acele etmeden, adım adım bitti.</p>
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
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: 'rgb(var(--ink))' }}>
                    {s.text || 'İsimsiz aşama'}
                  </span>
                  <span className="tnum text-xs font-mono flex-shrink-0" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
                    {formatHMS(s.elapsedSeconds)}
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

          <div className="px-5 pb-5 pt-2">
            <button
              onClick={handleClose}
              className="btn-press btn-go w-full py-3 text-sm font-bold"
            >
              Harika, Bitir
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── Page ── */
const LS_ACTIVE = 'luupi_norush_active'

// Aktif görev kalıcıdır: sayaç duvar saatine göre (startedAt) işlediği için
// uygulama kapalıyken geçen süre de doğru hesaplanır.
function loadActive(): { title: string; stages: NoRushStage[] } {
  try {
    const d = JSON.parse(localStorage.getItem(LS_ACTIVE) || 'null')
    if (d && typeof d.title === 'string' && Array.isArray(d.stages)) return d
  } catch { /* ignore */ }
  return { title: '', stages: [] }
}

export default function NoRush() {
  const [title, setTitle] = useState(() => loadActive().title)
  const [stages, setStages] = useState<NoRushStage[]>(() => loadActive().stages)
  const [now, setNow] = useState(() => Date.now())
  const [draft, setDraft] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    localStorage.setItem(LS_ACTIVE, JSON.stringify({ title, stages }))
  }, [title, stages])

  const runningStage = stages.find((s) => s.status === 'running') ?? null
  const runningIdx = runningStage ? stages.indexOf(runningStage) : -1
  // Mola: status 'running' kalır ama startedAt null — süre birikmez
  const isPaused = runningStage !== null && runningStage.startedAt === null
  const isTicking = runningStage !== null && !isPaused
  const doneCount = stages.filter((s) => s.status === 'done').length
  const allStagesDone = stages.length > 0 && doneCount === stages.length
  const progress = stages.length > 0 ? doneCount / stages.length : 0

  useEffect(() => {
    if (!isTicking) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isTicking])

  const totalSeconds = stages.reduce((acc, s) => acc + liveStageSeconds(s, now), 0)

  const addDraft = () => {
    const text = draft.trim()
    if (!text) return
    playConfirm()
    setStages((prev) => [...prev, newStage(text)])
    setDraft('')
  }

  const updateStageText = (id: string, text: string) =>
    setStages((prev) => prev.map((s) => s.id === id ? { ...s, text } : s))

  const removeStage = (id: string) => {
    playConfirm()
    setStages((prev) => prev.filter((s) => s.id !== id))
  }

  const startStage = (id: string) => {
    playConfirm()
    setNow(Date.now())
    setStages((prev) => prev.map((s) => s.id === id ? { ...s, status: 'running', startedAt: Date.now() } : s))
  }

  const pauseResumeStage = () => {
    if (!runningStage) return
    playConfirm()
    const t = Date.now()
    setNow(t)
    setStages((prev) => prev.map((s) => {
      if (s.id !== runningStage.id) return s
      if (s.startedAt != null) {
        // Mola: o ana kadarki süreyi bankala
        return { ...s, elapsedSeconds: liveStageSeconds(s, t), startedAt: null }
      }
      return { ...s, startedAt: t }
    }))
  }

  const finishStage = (id: string) => {
    playConfirm()
    setStages((prev) => prev.map((s) => {
      if (s.id !== id) return s
      const banked = liveStageSeconds(s, Date.now())
      return { ...s, status: 'done', elapsedSeconds: banked, startedAt: null }
    }))
  }

  const undoStage = (id: string) => {
    playConfirm()
    setStages((prev) => prev.map((s) => s.id === id ? { ...s, status: 'pending', startedAt: null } : s))
  }

  // ── Dokunmatik uyumlu sürükle-sırala ──
  // HTML5 drag olayları telefonda çalışmaz; pointer olaylarıyla tutamaçtan
  // sürüklenir. Sürüklenen satır parmağı izler, diğerleri yer açar.
  const listRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ from: number; startY: number } | null>(null)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [dragDy, setDragDy] = useState(0)
  const [rowStep, setRowStep] = useState(58)

  const onGripDown = (e: React.PointerEvent, index: number) => {
    if (stages.length < 2) return
    const first = listRef.current?.children[0] as HTMLElement | undefined
    setRowStep(first ? first.offsetHeight + 8 : 58)
    dragRef.current = { from: index, startY: e.clientY }
    setDragFrom(index)
    setDragOver(index)
    setDragDy(0)
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* sentetik/eski pointer */ }
  }

  const onGripMove = (e: React.PointerEvent) => {
    const st = dragRef.current
    if (!st) return
    const dy = e.clientY - st.startY
    setDragDy(dy)
    const target = Math.min(stages.length - 1, Math.max(0, st.from + Math.round(dy / rowStep)))
    setDragOver(target)
  }

  const onGripUp = () => {
    const st = dragRef.current
    dragRef.current = null
    if (st && dragOver !== null && dragOver !== st.from) {
      setStages((prev) => {
        const next = [...prev]
        const [moved] = next.splice(st.from, 1)
        next.splice(dragOver, 0, moved)
        return next
      })
    }
    setDragFrom(null)
    setDragOver(null)
    setDragDy(0)
  }

  const dragStyle = (index: number): CSSProperties => {
    if (dragFrom === null || dragOver === null) return {}
    if (index === dragFrom) {
      return {
        transform: `translateY(${dragDy}px) scale(1.02)`,
        zIndex: 5, position: 'relative',
        boxShadow: '0 14px 28px -10px rgb(var(--ink) / 0.3)',
      }
    }
    if (dragFrom < dragOver && index > dragFrom && index <= dragOver) {
      return { transform: `translateY(-${rowStep}px)`, transition: 'transform 0.18s ease' }
    }
    if (dragFrom > dragOver && index >= dragOver && index < dragFrom) {
      return { transform: `translateY(${rowStep}px)`, transition: 'transform 0.18s ease' }
    }
    return { transition: 'transform 0.18s ease' }
  }

  const closeSummary = () => {
    storage.addNoRushRecord({
      id: crypto.randomUUID(),
      title,
      stageCount: stages.length,
      totalSeconds,
      completedAt: new Date().toISOString(),
    })
    awardStandaloneBadges()
    setShowSummary(false)
    setTitle('')
    setStages([])
    setDraft('')
    localStorage.removeItem(LS_ACTIVE)
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-40">
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {showSummary && (
        <SummaryModal title={title} stages={stages} totalSeconds={totalSeconds} onClose={closeSummary} />
      )}

      {/* Üst şerit: geri + geçmiş */}
      <div className="flex items-start justify-between">
        <BackBar />
        <button
          onClick={() => { playConfirm(); setShowHistory(true) }}
          className="ctrl btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
        >
          <IconHistory size={14} /> Geçmiş
        </button>
      </div>

      {/* Başlık */}
      <div className="mb-6 text-center">
        <h1 className="display text-2xl font-extrabold tracking-tight" style={{ color: 'rgb(var(--ink))' }}>
          Acele Yok
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
          Küçük adımlar, senin hızında · süre ileri sayar
        </p>
      </div>

      {/* ── Görev kartı: isim + ilerleme + toplam süre ── */}
      <div
        className="glass g-cream mb-4 px-5 py-4 animate-fade-up"
        style={{ borderRadius: 22, boxShadow: '0 10px 26px -18px rgba(180,120,30,0.55), 0 1px 2px rgb(var(--ink) / 0.04)' }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-1.5" style={{ color: 'var(--sf-amber-tx)' }}>
          Ne yapıyoruz?
        </p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Yapacağımız şeye bir isim ver"
          className="w-full text-xl font-bold bg-transparent outline-none"
          style={{ color: 'rgb(var(--ink))' }}
        />
        {stages.length > 0 && (
          <>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(65,36,2,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress * 100}%`,
                  background: allStagesDone
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : `linear-gradient(90deg, ${BROWN_SOFT}, ${BROWN})`,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-bold" style={{ color: allStagesDone ? '#15803d' : '#8a5e2a' }}>
                {doneCount}/{stages.length} aşama
              </span>
              <span className="tnum text-[11px] font-mono font-bold" style={{ color: '#8a5e2a' }}>
                ⏱ {formatHMS(totalSeconds)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── "Şu An" kartı — çalışan aşamanın büyük kronometresi ── */}
      {runningStage && (
        <div
          className={`mb-4 px-5 py-5 text-center animate-fade-up ${isPaused ? '' : 'norush-breathe'}`}
          style={{
            borderRadius: 22,
            background: 'var(--sf-brown)',
            border: '1px solid var(--sf-brown-br)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            {!isPaused && (
              <span className="animate-live inline-block rounded-full" style={{ width: 6, height: 6, background: 'var(--sf-brown-tx2)' }} />
            )}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: isPaused ? 'var(--sf-brown-tx2)' : 'var(--sf-brown-tx)' }}>
              {isPaused ? 'Molada' : 'Şu An'} · {runningIdx + 1}. aşama
            </span>
          </div>
          <p className="text-base font-bold mt-1.5 truncate" style={{ color: BROWN_TEXT }}>
            {runningStage.text || 'İsimsiz aşama'}
          </p>
          <p
            className="display tnum font-extrabold leading-none mt-3"
            style={{ fontSize: 42, color: BROWN_TEXT, opacity: isPaused ? 0.45 : 1, transition: 'opacity 0.3s ease' }}
          >
            {formatHMS(liveStageSeconds(runningStage, now))}
          </p>
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={pauseResumeStage}
              className="btn-press flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{
                background: isPaused ? `linear-gradient(150deg, ${BROWN_SOFT}, ${BROWN})` : 'rgba(74,50,34,0.08)',
                color: isPaused ? 'rgb(var(--canvas))' : BROWN_TEXT,
                border: isPaused ? 'none' : '1px solid rgba(74,50,34,0.14)',
              }}
            >
              {isPaused ? <><IconPlay /> Devam Et</> : <><IconPause /> Mola</>}
            </button>
            <button
              onClick={() => finishStage(runningStage.id)}
              className="btn-press flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
            >
              <IconCheck size={13} /> Bitirdim
            </button>
          </div>
        </div>
      )}

      {/* ── Aşamalar ── */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
          Aşamalar
        </span>
        {stages.length > 1 && (
          <span className="text-[10px] font-semibold" style={{ color: 'rgb(var(--ink) / 0.35)' }}>
            ⠿ tutamaçtan sürükleyip sıralayabilirsin
          </span>
        )}
      </div>

      {stages.length === 0 && (
        <div
          className="rounded-2xl px-5 py-6 text-center mb-3 animate-fade-up"
          style={{ background: 'rgb(var(--ink) / 0.03)', border: '1.5px dashed rgb(var(--ink) / 0.14)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'rgb(var(--ink) / 0.6)' }}>
            Gözünde büyüyen işi küçücük parçalara böl.
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'rgb(var(--ink) / 0.4)' }}>
            "Kitabı masaya koy" kadar küçük olabilir — aşağıdan ilk aşamayı ekle.
          </p>
        </div>
      )}

      <div ref={listRef} className="space-y-2">
        {stages.map((stage, index) => {
          const isDone = stage.status === 'done'
          const isRunning = stage.status === 'running'
          const isStagePaused = isRunning && stage.startedAt === null
          return (
            <div
              key={stage.id}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
              style={{
                background: isDone ? 'rgb(var(--ink) / 0.04)' : 'var(--tile-raised)',
                border: `1.5px solid ${isRunning ? 'rgba(34,197,94,0.6)' : isDone ? 'rgb(var(--ink) / 0.07)' : 'rgb(var(--ink) / 0.1)'}`,
                boxShadow: isRunning ? '0 0 0 3px rgba(34,197,94,0.13)' : 'none',
                opacity: isDone ? 0.65 : 1,
                ...dragStyle(index),
              }}
            >
              <span
                onPointerDown={(e) => onGripDown(e, index)}
                onPointerMove={onGripMove}
                onPointerUp={onGripUp}
                onPointerCancel={onGripUp}
                className="flex-shrink-0 -m-1 p-1"
                style={{ cursor: 'grab', touchAction: 'none' }}
              >
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
                  style={{
                    background: isRunning ? 'rgba(34,197,94,0.14)' : 'rgb(var(--ink) / 0.06)',
                    color: isRunning ? '#15803d' : 'rgb(var(--ink) / 0.55)',
                  }}
                >
                  {index + 1}
                </span>
              )}

              <input
                type="text"
                value={stage.text}
                onChange={(e) => updateStageText(stage.id, e.target.value)}
                readOnly={isDone}
                placeholder="Bu aşamada ne yapılacak?"
                className="flex-1 min-w-0 text-sm bg-transparent outline-none"
                style={{ color: 'rgb(var(--ink))' }}
              />

              {(isRunning || isDone) && (
                <span
                  className="tnum text-xs font-mono font-semibold flex-shrink-0"
                  style={{ color: isRunning ? (isStagePaused ? 'rgb(var(--ink) / 0.4)' : '#15803d') : 'rgb(var(--ink) / 0.4)' }}
                >
                  {formatHMS(liveStageSeconds(stage, now))}
                </span>
              )}

              {isDone ? (
                <button
                  onClick={() => undoStage(stage.id)}
                  aria-label="Geri Al"
                  title="Geri Al"
                  className="ctrl btn-press w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                >
                  <IconUndo />
                </button>
              ) : isRunning ? (
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: isStagePaused ? 'rgba(245,158,11,0.14)' : 'rgba(34,197,94,0.14)',
                    color: isStagePaused ? '#b45309' : '#15803d',
                  }}
                >
                  {isStagePaused ? '⏸ molada' : '▶ sürüyor'}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => startStage(stage.id)}
                    disabled={runningStage !== null}
                    title={runningStage !== null ? 'Önce çalışan aşamayı bitir' : undefined}
                    className="btn-press px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 disabled:cursor-not-allowed"
                    style={{
                      background: runningStage !== null ? 'rgb(var(--ink) / 0.06)' : `linear-gradient(150deg, ${BROWN_SOFT}, ${BROWN})`,
                      color: runningStage !== null ? 'rgb(var(--ink) / 0.3)' : 'rgb(var(--canvas))',
                    }}
                  >
                    Başladım
                  </button>
                  <button
                    onClick={() => removeStage(stage.id)}
                    aria-label="Aşamayı sil"
                    title="Aşamayı sil"
                    className="btn-press w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ color: 'rgb(var(--ink) / 0.3)' }}
                  >
                    <IconX size={13} />
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Hızlı aşama ekleme — Enter ya da + */}
      <div
        className="flex items-center gap-2.5 rounded-2xl px-3 py-2 mt-2"
        style={{ background: 'var(--tile-raised)', border: '1.5px dashed rgb(var(--ink) / 0.18)' }}
      >
        <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ color: 'rgb(var(--ink) / 0.35)' }}>
          <IconPlus size={14} />
        </span>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addDraft() }}
          placeholder="Yeni aşama ekle…"
          className="flex-1 min-w-0 text-sm bg-transparent outline-none py-1"
          style={{ color: 'rgb(var(--ink))' }}
        />
        <button
          onClick={addDraft}
          disabled={!draft.trim()}
          aria-label="Aşama ekle"
          className="btn-press px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 disabled:opacity-30"
          style={{ background: 'rgb(var(--ink))', color: 'rgb(var(--canvas))' }}
        >
          Ekle
        </button>
      </div>

      {/* Görevi bitir */}
      <button
        onClick={() => { if (allStagesDone) { playConfirm(); setShowSummary(true) } }}
        disabled={!allStagesDone}
        title={!allStagesDone ? 'Önce tüm aşamaları tamamla' : undefined}
        className="btn-press w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:cursor-not-allowed mt-6"
        style={{
          background: allStagesDone ? 'rgba(34,197,94,0.9)' : 'rgb(var(--ink) / 0.07)',
          color: allStagesDone ? '#06210f' : 'rgb(var(--ink) / 0.35)',
        }}
      >
        {!allStagesDone && <IconLock size={14} />}
        Görevi Bitir
      </button>

      <p className="text-center text-[11px] mt-4" style={{ color: 'rgb(var(--ink) / 0.4)' }}>
        Süre geriye değil ileriye sayar — acele ettiren kimse yok.
      </p>
    </div>
  )
}
