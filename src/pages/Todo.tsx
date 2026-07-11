import { useEffect, useRef, useState } from 'react'
import { storage } from '../utils/storage'
import BackBar from '../components/BackBar'
import Confetti from '../components/Confetti'
import { playConfirm } from '../utils/sound'
import { awardStandaloneBadges } from '../utils/badges'
import type { TodoItem } from '../types'

/* ════════════════════════════════════════════════
   TO-DO — basit liste, ama keyifli. Enter'la hızlı
   ekleme, solda renkli onay halkası, bitenler alta
   "Tamamlananlar" grubuna iner, tek dokunuşla
   temizlenir. Liste tamamen bitince konfeti yağar.
   ════════════════════════════════════════════════ */

const OUTLINE_COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#ec4899',
  '#a855f7', '#eab308', '#06b6d4', '#ef4444',
]

function randomColor(): string {
  return OUTLINE_COLORS[Math.floor(Math.random() * OUTLINE_COLORS.length)]
}

function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconCheck({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconClipboard({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  )
}

/* Çizilerek beliren onay — kutlama kartında */
function CheckDraw({ size = 15, color = 'currentColor', strokeWidth = 2.4 }: {
  size?: number; color?: string; strokeWidth?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline className="js-check-draw" points="2.5 8.5 6.5 12.5 13.5 4" />
    </svg>
  )
}

function TodoRow({ todo, removing, onChangeText, onToggle, onDelete, delay = 0 }: {
  todo: TodoItem
  removing: boolean
  onChangeText: (text: string) => void
  onToggle: () => void
  onDelete: () => void
  delay?: number
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 soft-trans ${removing ? 'animate-fade-down' : 'animate-fade-up'}`}
      style={{
        background: todo.done ? 'rgb(var(--ink) / 0.04)' : '#ffffff',
        border: `1.5px solid ${todo.done ? 'rgb(var(--ink) / 0.09)' : todo.color}`,
        animationDelay: removing ? '0s' : `${delay}s`,
        opacity: todo.done ? 0.75 : 1,
      }}
    >
      {/* Onay halkası — solda, madde renginde */}
      <button
        onClick={onToggle}
        aria-label={todo.done ? 'Geri al' : 'Tamamla'}
        className="btn-press soft-trans w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={todo.done
          ? { background: 'rgba(34,197,94,0.9)', color: '#fff', border: '2px solid transparent' }
          : { background: 'transparent', color: 'transparent', border: `2px solid ${todo.color}` }}
      >
        <IconCheck className={todo.done ? 'animate-check' : ''} />
      </button>

      <input
        type="text"
        value={todo.text}
        onChange={(e) => onChangeText(e.target.value)}
        readOnly={todo.done}
        placeholder="Ne yapılacak?"
        className="flex-1 min-w-0 text-sm bg-transparent outline-none soft-trans"
        style={{
          color: todo.done ? 'rgb(var(--ink) / 0.4)' : 'rgb(var(--ink))',
          textDecoration: todo.done ? 'line-through' : 'none',
        }}
      />

      <button
        onClick={onDelete}
        aria-label="Sil"
        title="Sil"
        className="btn-press w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ color: 'rgb(var(--ink) / 0.28)' }}
      >
        <IconX />
      </button>
    </div>
  )
}

export default function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>(() => storage.getTodos())
  const [draft, setDraft] = useState('')
  const [removingIds, setRemovingIds] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => () => { if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current) }, [])

  const persist = (next: TodoItem[]) => {
    setTodos(next)
    storage.setTodos(next)
    awardStandaloneBadges()
  }

  const activeList = todos.filter((t) => !t.done)
  const doneList = todos.filter((t) => t.done)
  const allDone = todos.length > 0 && activeList.length === 0
  const progress = todos.length > 0 ? doneList.length / todos.length : 0

  // Liste oturum içinde tamamen bitince (sayfa yüklenirken değil) konfeti
  const prevAllDoneRef = useRef(allDone)
  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      setShowConfetti(true)
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
      confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 3600)
    }
    prevAllDoneRef.current = allDone
  }, [allDone])

  const addDraft = () => {
    const text = draft.trim()
    if (!text) return
    playConfirm()
    persist([...todos, {
      id: crypto.randomUUID(),
      text,
      color: randomColor(),
      done: false,
      createdAt: new Date().toISOString(),
    }])
    setDraft('')
  }

  const changeText = (id: string, text: string) => {
    persist(todos.map((t) => (t.id === id ? { ...t, text } : t)))
  }

  const toggle = (id: string) => {
    playConfirm()
    persist(todos.map((t) => (
      t.id === id
        ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : undefined }
        : t
    )))
  }

  // Silme: önce kısa çıkış animasyonu, sonra listeden düşür
  const remove = (id: string) => {
    playConfirm()
    setRemovingIds((prev) => [...prev, id])
    setTimeout(() => {
      setRemovingIds((prev) => prev.filter((x) => x !== id))
      setTodos((prev) => {
        const next = prev.filter((t) => t.id !== id)
        storage.setTodos(next)
        return next
      })
      awardStandaloneBadges()
    }, 180)
  }

  const clearCompleted = () => {
    playConfirm()
    persist(todos.filter((t) => !t.done))
  }

  return (
    <div className={`max-w-sm mx-auto px-4 pt-6 pb-40 ${mounted ? 'page-enter' : 'opacity-0'}`}>
      <BackBar />
      {showConfetti && <Confetti />}

      {/* Başlık */}
      <div className="mb-6 text-center">
        <h1 className="display text-2xl font-extrabold tracking-tight" style={{ color: 'rgb(var(--ink))' }}>
          To-do
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
          Basit yapılacaklar listesi
          {todos.length > 0 && ` · ${doneList.length}/${todos.length} tamam`}
        </p>
        {/* İnce ilerleme çizgisi */}
        {todos.length > 0 && (
          <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgb(var(--ink) / 0.07)' }}>
            <div
              className="progress-fill h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: allDone
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : 'linear-gradient(90deg, #fbbf24, #f97316)',
                boxShadow: progress > 0 ? `0 0 8px ${allDone ? 'rgba(34,197,94,0.5)' : 'rgba(249,115,22,0.4)'}` : 'none',
              }}
            />
          </div>
        )}
      </div>

      {/* Hepsi bitti kutlaması */}
      {allDone && (
        <div
          className="glass g-lime rounded-2xl px-4 py-4 mb-4 flex items-center gap-3 animate-pop"
          style={{ border: '1px solid rgba(34,197,94,0.35)' }}
        >
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
          >
            <CheckDraw size={17} />
          </span>
          <div>
            <p className="text-sm font-bold" style={{ color: '#15803d' }}>Hepsi tamam!</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(21,128,61,0.65)' }}>
              Listedeki her şey bitti — günün keyfini çıkar.
            </p>
          </div>
        </div>
      )}

      {/* Boş durum */}
      {todos.length === 0 && (
        <div
          className="rounded-2xl px-5 py-8 text-center mb-4 animate-fade-up"
          style={{ background: 'rgb(var(--ink) / 0.03)', border: '1.5px dashed rgb(var(--ink) / 0.14)' }}
        >
          <span
            className="inline-flex w-12 h-12 rounded-2xl items-center justify-center mb-3"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d' }}
          >
            <IconClipboard size={24} />
          </span>
          <p className="text-sm font-semibold" style={{ color: 'rgb(var(--ink) / 0.6)' }}>Liste boş</p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--ink) / 0.4)' }}>
            Aşağıya yaz, Enter'a bas — bu kadar.
          </p>
        </div>
      )}

      {/* Aktif maddeler */}
      <div className="space-y-2">
        {activeList.map((todo, i) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            removing={removingIds.includes(todo.id)}
            delay={i * 0.04}
            onChangeText={(text) => changeText(todo.id, text)}
            onToggle={() => toggle(todo.id)}
            onDelete={() => remove(todo.id)}
          />
        ))}
      </div>

      {/* Hızlı ekleme — Enter ya da Ekle */}
      <div
        className="flex items-center gap-2.5 rounded-2xl px-3 py-2 mt-2"
        style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px dashed rgb(var(--ink) / 0.18)' }}
      >
        <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ color: 'rgb(var(--ink) / 0.35)' }}>
          <IconPlus size={14} />
        </span>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addDraft() }}
          placeholder="Yeni madde ekle…"
          className="flex-1 min-w-0 text-sm bg-transparent outline-none py-1"
          style={{ color: 'rgb(var(--ink))' }}
        />
        <button
          onClick={addDraft}
          disabled={!draft.trim()}
          aria-label="Madde ekle"
          className="btn-press px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 disabled:opacity-30"
          style={{ background: 'rgb(var(--ink))', color: 'rgb(var(--canvas))' }}
        >
          Ekle
        </button>
      </div>

      {/* Tamamlananlar — altta toplanır, tek dokunuşla temizlenir */}
      {doneList.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
              Tamamlananlar · {doneList.length}
            </span>
            <button
              onClick={clearCompleted}
              className="btn-press text-[11px] font-bold"
              style={{ color: '#b3422a' }}
            >
              Temizle
            </button>
          </div>
          <div className="space-y-2">
            {doneList.map((todo, i) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                removing={removingIds.includes(todo.id)}
                delay={i * 0.04}
                onChangeText={(text) => changeText(todo.id, text)}
                onToggle={() => toggle(todo.id)}
                onDelete={() => remove(todo.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
