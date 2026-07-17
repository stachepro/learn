import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../../context/AppContext'
import type { CompletionMode, Habit, RecurrenceType, TimeOfDay } from '../../types'
import { getHabitGoal, getHabitMode } from '../../types'
import { POMODORO_CATEGORY_IDS } from '../../utils/categories'
import { hapticEvent } from '../../utils/haptics'
import { scheduleAfterMotion } from '../../utils/motion'
import { HABIT_PRESETS, type HabitPreset } from '../../utils/habitPresets'
import { WEEKDAY_NAMES, WEEKDAY_ORDER_TR } from '../../utils/habitSchedule'
import { showToast } from '../../utils/toast'
import { ICON_OPTIONS, type IconName } from '../../utils/icons'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import AppButton from '../ui/AppButton'
import LuupiIcon from '../ui/LuupiIcon'

type FlowStage = 'library' | 'composer'

interface HabitDraft {
  name: string
  icon: IconName
  categoryId: string
  completionMode: CompletionMode
  completionGoal: number
  recurrence: RecurrenceType
  recurrenceDays: number[]
  timeOfDay: TimeOfDay
  useTimeWindow: boolean
  windowStart: string
  windowEnd: string
  labelColor: string
}

interface Props {
  onClose: () => void
  editHabit?: Habit | null
}

const TIME_OPTIONS: { id: TimeOfDay; icon: IconName; label: string }[] = [
  { id: 'morning', icon: 'sunrise', label: 'Sabah' },
  { id: 'afternoon', icon: 'sun', label: 'Öğle' },
  { id: 'evening', icon: 'moon', label: 'Akşam' },
  { id: 'any', icon: 'clock', label: 'Gün içinde' },
]

const CUSTOM_CATEGORY_COLORS = ['#84cc16', '#22c55e', '#3b82f6', '#a78bfa', '#f59e0b', '#ec4899']

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function shiftHex(hex: string, amount: number): string {
  const value = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) return '#84cc16'
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16))
  return `#${channels.map((channel) => clamp(channel + amount).toString(16).padStart(2, '0')).join('')}`
}

function categoryTones(color: string): string[] {
  return [-34, -16, 0, 22, 42].map((amount) => shiftHex(color, amount))
}

function weeklyFallback(habit?: Habit | null): number {
  if (habit?.recurrenceDays?.length) return habit.recurrenceDays[0]
  if (habit?.createdDate) return new Date(`${habit.createdDate}T12:00:00`).getDay()
  return new Date().getDay()
}

function makeDraft(categoryColor: string, habit?: Habit | null, preset?: HabitPreset): HabitDraft {
  const recurrence = habit?.recurrence ?? 'daily'
  const fallbackDay = weeklyFallback(habit)
  return {
    name: habit?.name ?? preset?.name ?? '',
    icon: habit?.icon ?? preset?.icon ?? 'sparkles',
    categoryId: habit?.categoryId ?? preset?.categoryId ?? 'diger',
    completionMode: habit ? getHabitMode(habit) : 'single',
    completionGoal: habit ? Math.max(1, getHabitGoal(habit) || 4) : 4,
    recurrence,
    recurrenceDays: recurrence === 'weekly'
      ? [fallbackDay]
      : habit?.recurrenceDays ?? [],
    timeOfDay: habit?.timeOfDay ?? 'any',
    useTimeWindow: Boolean(habit?.timeWindow),
    windowStart: habit?.timeWindow?.start ?? '09:00',
    windowEnd: habit?.timeWindow?.end ?? '22:00',
    labelColor: habit?.labelColor ?? categoryColor,
  }
}

function signature(draft: HabitDraft) {
  return JSON.stringify({ ...draft, recurrenceDays: [...draft.recurrenceDays].sort() })
}

function recurrenceSummary(draft: HabitDraft): string {
  if (draft.recurrence === 'once') return 'Yalnızca bugün'
  if (draft.recurrence === 'daily') return 'Her gün'
  if (draft.recurrence === 'weekly') return `Her ${WEEKDAY_NAMES[draft.recurrenceDays[0] ?? new Date().getDay()]}`
  if (!draft.recurrenceDays.length) return 'Gün seçilmedi'
  return WEEKDAY_ORDER_TR.filter((day) => draft.recurrenceDays.includes(day)).map((day) => WEEKDAY_NAMES[day]).join(', ')
}

export default function HabitCreationFlow({ onClose, editHabit }: Props) {
  const { addHabit, editHabit: saveEdit, categories, addCustomCategory } = useApp()
  const categoryFor = (id: string) => categories.find((category) => category.id === id)
  const initialCategory = categoryFor(editHabit?.categoryId ?? 'diger')
  const initialDraft = makeDraft(initialCategory?.color ?? '#84cc16', editHabit)
  const [stage, setStage] = useState<FlowStage>(editHabit ? 'composer' : 'library')
  const [draft, setDraft] = useState<HabitDraft>(initialDraft)
  const [baseSignature, setBaseSignature] = useState(() => signature(initialDraft))
  const [filter, setFilter] = useState('all')
  const [iconOpen, setIconOpen] = useState(false)
  const [iconSearch, setIconSearch] = useState('')
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryIconOpen, setNewCategoryIconOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState<IconName>('sparkles')
  const [newCategoryColor, setNewCategoryColor] = useState('#84cc16')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  const discardRef = useRef<HTMLElement>(null)
  const closeTimer = useRef<number | null>(null)
  const closingRef = useRef(false)
  const dirty = stage === 'composer' && signature(draft) !== baseSignature
  const dirtyRef = useRef(dirty)
  const confirmDiscardRef = useRef(confirmDiscard)
  dirtyRef.current = dirty
  confirmDiscardRef.current = confirmDiscard

  const closeNow = () => {
    if (closingRef.current || isExiting) return true
    closingRef.current = true
    setIsExiting(true)
    closeTimer.current = scheduleAfterMotion(onClose)
    return true
  }

  const requestClose = () => {
    if (dirtyRef.current && !confirmDiscardRef.current) {
      setConfirmDiscard(true)
      return false
    }
    return closeNow()
  }

  const sheetDrag = useSheetDragDismiss(requestClose)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      if (stage === 'composer') panelRef.current?.querySelector<HTMLElement>('input[name="habit-name"]')?.focus()
      else panelRef.current?.querySelector<HTMLElement>('button')?.focus()
    })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (confirmDiscardRef.current) {
        setConfirmDiscard(false)
        return
      }
      requestClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  // The sheet intentionally owns the initial trigger focus for its full lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (stage === 'composer') panelRef.current?.querySelector<HTMLElement>('input[name="habit-name"]')?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [stage])

  useEffect(() => {
    if (!confirmDiscard) return
    const frame = window.requestAnimationFrame(() => discardRef.current?.querySelector<HTMLButtonElement>('button')?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [confirmDiscard])

  const selectedCategory = categoryFor(draft.categoryId)
  const supportsPomodoro = POMODORO_CATEGORY_IDS.has(draft.categoryId)
  const toneOptions = useMemo(() => categoryTones(selectedCategory?.color ?? '#84cc16'), [selectedCategory?.color])
  const customDaysMissing = draft.recurrence === 'custom' && draft.recurrenceDays.length === 0
  const weeklyDayMissing = draft.recurrence === 'weekly' && draft.recurrenceDays.length !== 1
  const invalidWindow = draft.useTimeWindow && draft.windowStart >= draft.windowEnd
  const incompatiblePomodoro = draft.completionMode === 'pomodoro' && !supportsPomodoro
  const canSave = Boolean(draft.name.trim()) && !customDaysMissing && !weeklyDayMissing && !invalidWindow && !incompatiblePomodoro

  const choose = <K extends keyof HabitDraft>(key: K, value: HabitDraft[K]) => {
    void hapticEvent('selection')
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const openComposer = (preset?: HabitPreset) => {
    const category = categoryFor(preset?.categoryId ?? 'diger')
    const next = makeDraft(category?.color ?? '#84cc16', null, preset)
    setDraft(next)
    setBaseSignature(signature(next))
    setIconOpen(false)
    setStage('composer')
    void hapticEvent('selection')
  }

  const selectCategory = (categoryId: string) => {
    const category = categoryFor(categoryId)
    void hapticEvent('selection')
    setDraft((current) => ({ ...current, categoryId, labelColor: category?.color ?? current.labelColor }))
  }

  const setRecurrence = (recurrence: RecurrenceType) => {
    void hapticEvent('selection')
    setDraft((current) => ({
      ...current,
      recurrence,
      recurrenceDays: recurrence === 'weekly'
        ? [current.recurrenceDays[0] ?? new Date().getDay()]
        : recurrence === 'custom' ? current.recurrenceDays : [],
    }))
  }

  const toggleDay = (day: number) => {
    void hapticEvent('selection')
    setDraft((current) => {
      if (current.recurrence === 'weekly') return { ...current, recurrenceDays: [day] }
      return {
        ...current,
        recurrenceDays: current.recurrenceDays.includes(day)
          ? current.recurrenceDays.filter((item) => item !== day)
          : [...current.recurrenceDays, day],
      }
    })
  }

  const createCategory = () => {
    if (!newCategoryName.trim()) return
    const category = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: newCategoryColor,
      isCustom: true,
    }
    addCustomCategory(category)
    setDraft((current) => ({ ...current, categoryId: category.id, labelColor: category.color }))
    setNewCategoryOpen(false)
    setNewCategoryName('')
    showToast({ tone: 'success', contextIcon: <LuupiIcon name={category.icon} size={16} />, title: 'Kategori oluşturuldu', message: category.name, haptic: 'light' })
  }

  const save = () => {
    if (!canSave) return
    const days = draft.recurrence === 'weekly' || draft.recurrence === 'custom' ? draft.recurrenceDays : []
    const schedule = {
      recurrence: draft.recurrence,
      recurrenceDays: days,
      timeOfDay: draft.timeOfDay,
      timeWindow: draft.useTimeWindow ? { start: draft.windowStart, end: draft.windowEnd } : null,
    }
    const goal = draft.completionMode === 'single' ? undefined : draft.completionGoal
    if (editHabit) {
      saveEdit(editHabit.id, draft.name, draft.icon, draft.categoryId, draft.completionMode, goal, schedule, draft.labelColor)
      showToast({ tone: 'success', contextIcon: <LuupiIcon name={draft.icon} size={16} />, title: 'Alışkanlık güncellendi', message: draft.name.trim(), haptic: 'success' })
    } else {
      addHabit(draft.name, draft.icon, draft.categoryId, draft.completionMode, goal, schedule, draft.labelColor)
      showToast({ tone: 'success', contextIcon: <LuupiIcon name={draft.icon} size={16} />, title: 'Alışkanlık hazır', message: draft.name.trim(), haptic: 'success' })
    }
    setBaseSignature(signature(draft))
    closeNow()
  }

  const visiblePresets = filter === 'all' ? HABIT_PRESETS : HABIT_PRESETS.filter((preset) => preset.categoryId === filter)
  const visibleIcons = ICON_OPTIONS.filter((option) =>
    !iconSearch.trim() || option.label.toLocaleLowerCase('tr-TR').includes(iconSearch.trim().toLocaleLowerCase('tr-TR')))
  const iconGroups = [...new Set(visibleIcons.map((option) => option.group))]

  return createPortal(
    <div
      className="habit-create-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-create-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const scope = confirmDiscard ? discardRef.current : panelRef.current
        const nodes = Array.from(scope?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]') ?? [])
        if (!nodes.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }}
    >
      <button type="button" className={`habit-create-layer__scrim ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={requestClose} aria-label="Kapat" />
      <section
        ref={panelRef}
        style={sheetDrag.surfaceStyle}
        className={`habit-create-sheet ${sheetDrag.surfaceClassName} ${isExiting ? 'habit-create-sheet--exit' : 'habit-create-sheet--enter'}`}
      >
        <span className="habit-create-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="habit-create-sheet__header">
          {stage === 'composer' && !editHabit ? (
            <AppButton tone="quiet" size="sm" haptic="light" onClick={() => setStage('library')} aria-label="Hazır alışkanlıklara dön">←</AppButton>
          ) : <span className="habit-create-sheet__header-spacer" />}
          <div>
            <span>{editHabit ? 'RİTMİ GÜNCELLE' : stage === 'library' ? 'HIZLI BAŞLANGIÇ' : 'KARTINI OLUŞTUR'}</span>
            <h2 id="habit-create-title">{editHabit ? 'Alışkanlığı düzenle' : stage === 'library' ? 'Yeni alışkanlık' : 'Alışkanlığını hazırla'}</h2>
          </div>
          <AppButton tone="quiet" size="sm" haptic="light" onClick={requestClose} aria-label="Kapat">×</AppButton>
        </header>

        {stage === 'library' ? (
          <div className="habit-library">
            {dirty && (
              <button type="button" className="habit-library__resume" onClick={() => setStage('composer')}>
                <span aria-hidden><LuupiIcon name={draft.icon} /></span><div><strong>Taslağa dön</strong><small>{draft.name.trim() || 'Adı henüz yazılmadı'}</small></div><b>→</b>
              </button>
            )}
            <button type="button" className="habit-library__custom" onClick={() => dirty ? setStage('composer') : openComposer()}>
              <span aria-hidden>+</span><div><strong>Kendin oluştur</strong><small>Adını, ritmini ve hedefini sen belirle</small></div><b>→</b>
            </button>
            <div className="habit-library__heading"><div><span>HAZIR KARTLAR</span><h3>Bir fikirle hızlı başla</h3></div><small>{visiblePresets.length} seçenek</small></div>
            <div className="habit-library__filters" role="tablist" aria-label="Preset kategorileri">
              <button type="button" role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'is-active' : ''} onClick={() => { setFilter('all'); void hapticEvent('selection') }}>Tümü</button>
              {categories.filter((category) => HABIT_PRESETS.some((preset) => preset.categoryId === category.id)).map((category) => (
                <button key={category.id} type="button" role="tab" aria-selected={filter === category.id} className={filter === category.id ? 'is-active' : ''} onClick={() => { setFilter(category.id); void hapticEvent('selection') }}><LuupiIcon name={category.icon} size={16} /> {category.name}</button>
              ))}
            </div>
            <div className="habit-library__grid">
              {visiblePresets.map((preset) => {
                const category = categoryFor(preset.categoryId)
                return (
                  <button
                    key={`${preset.categoryId}-${preset.name}`}
                    type="button"
                    className="habit-preset-card"
                    style={{ '--preset-color': category?.color ?? '#84cc16' } as CSSProperties}
                    onClick={() => openComposer(preset)}
                  >
                    <span aria-hidden><LuupiIcon name={preset.icon} size={32} /></span><strong>{preset.name}</strong><small>{category?.name ?? 'Alışkanlık'} · Her gün</small>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <form className="habit-composer" onSubmit={(event) => { event.preventDefault(); save() }}>
            <div className="habit-composer__scroll">
              <div className="habit-composer-preview" style={{ '--composer-color': draft.labelColor } as CSSProperties}>
                <div><span>{selectedCategory?.name ?? 'Alışkanlık'}</span><strong>{draft.name.trim() || 'Yeni ritmin'}</strong><small>{recurrenceSummary(draft)}</small></div>
                <b aria-hidden><LuupiIcon name={draft.icon} size={48} /></b>
              </div>

              <section className="habit-composer-section">
                <div className="habit-composer-section__title"><span>01</span><div><h3>Kimlik</h3><p>Kartını tek bakışta tanı.</p></div></div>
                <label className="habit-composer-name"><span>Alışkanlık adı</span><input name="habit-name" value={draft.name} maxLength={48} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Örn. Sabah yürüyüşü" /><small>{draft.name.length}/48</small></label>
                <button type="button" className="habit-composer-disclosure" onClick={() => setIconOpen((open) => !open)} aria-expanded={iconOpen}><span className="habit-composer-disclosure__emoji"><LuupiIcon name={draft.icon} /></span><div><small>KART İKONU</small><strong>İkonu değiştir</strong></div><b>{iconOpen ? '−' : '+'}</b></button>
                {iconOpen && <div className="habit-emoji-grid habit-icon-picker" aria-label="İkon seç"><input type="search" value={iconSearch} onChange={(event) => setIconSearch(event.target.value)} placeholder="İkon ara" aria-label="İkon ara" />{iconGroups.map((group) => <section key={group}><strong>{group}</strong><div>{visibleIcons.filter((option) => option.group === group).map((option) => <button key={option.name} type="button" aria-label={`${option.label} ikonunu seç`} aria-pressed={draft.icon === option.name} title={option.label} onClick={() => { choose('icon', option.name); setIconOpen(false) }}><LuupiIcon name={option.name} /></button>)}</div></section>)}</div>}
                <div className="habit-composer-label">Kategori</div>
                <div className="habit-category-picker">
                  {categories.map((category) => <button key={category.id} type="button" aria-pressed={draft.categoryId === category.id} className={draft.categoryId === category.id ? 'is-active' : ''} style={{ '--category-color': category.color } as CSSProperties} onClick={() => selectCategory(category.id)}><LuupiIcon name={category.icon} size={16} /> {category.name}</button>)}
                  <button type="button" className="habit-category-picker__add" onClick={() => setNewCategoryOpen((open) => !open)}>+ Yeni kategori</button>
                </div>
                {newCategoryOpen && <div className="habit-new-category"><div><button type="button" aria-label="Kategori ikonunu seç" aria-expanded={newCategoryIconOpen} onClick={() => setNewCategoryIconOpen((open) => !open)}><LuupiIcon name={newCategoryIcon} /></button><input aria-label="Kategori adı" value={newCategoryName} maxLength={24} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Kategori adı" /></div>{newCategoryIconOpen && <div className="habit-new-category__icon-grid">{ICON_OPTIONS.slice(0, 40).map((option) => <button key={option.name} type="button" title={option.label} aria-label={`${option.label} kategori ikonunu seç`} aria-pressed={newCategoryIcon === option.name} onClick={() => { setNewCategoryIcon(option.name); setNewCategoryIconOpen(false); void hapticEvent('selection') }}><LuupiIcon name={option.name} size={20} /></button>)}</div>}<div className="habit-new-category__colors">{CUSTOM_CATEGORY_COLORS.map((color) => <button key={color} type="button" aria-label="Kategori rengini seç" aria-pressed={newCategoryColor === color} style={{ background: color }} onClick={() => { setNewCategoryColor(color); void hapticEvent('selection') }} />)}</div><AppButton tone="tonal" size="sm" block disabled={!newCategoryName.trim()} onClick={createCategory}>Kategoriyi Oluştur</AppButton></div>}
              </section>

              <section className="habit-composer-section">
                <div className="habit-composer-section__title"><span>02</span><div><h3>Ritim</h3><p>Hangi günlerde karşına çıkacağını belirle.</p></div></div>
                <div className="habit-choice-grid habit-choice-grid--two">
                  {([
                    ['daily', '↻', 'Her gün'], ['weekly', '◇', 'Haftalık'], ['custom', '∷', 'Belirli günler'], ['once', '1', 'Yalnızca bugün'],
                  ] as [RecurrenceType, string, string][]).map(([id, icon, label]) => <button key={id} type="button" aria-pressed={draft.recurrence === id} className={draft.recurrence === id ? 'is-active' : ''} onClick={() => setRecurrence(id)}><span>{icon}</span><strong>{label}</strong></button>)}
                </div>
                {(draft.recurrence === 'weekly' || draft.recurrence === 'custom') && <div className="habit-weekdays" role="group" aria-label="Tekrar günleri">{WEEKDAY_ORDER_TR.map((day) => <button key={day} type="button" aria-pressed={draft.recurrenceDays.includes(day)} className={draft.recurrenceDays.includes(day) ? 'is-active' : ''} onClick={() => toggleDay(day)}>{WEEKDAY_NAMES[day]}</button>)}</div>}
                {customDaysMissing && <p className="habit-composer-error">Devam etmek için en az bir gün seç.</p>}
              </section>

              <section className="habit-composer-section">
                <div className="habit-composer-section__title"><span>03</span><div><h3>Tamamlama</h3><p>Başarıyı nasıl sayacağımızı seç.</p></div></div>
                <div className="habit-choice-grid habit-choice-grid--three">
                  {([
                    ['single', '✓', 'Tek'], ['multi', '∑', 'Sayaç'], ['pomodoro', '◴', 'Pomodoro'],
                  ] as [CompletionMode, string, string][]).map(([id, icon, label]) => <button key={id} type="button" aria-pressed={draft.completionMode === id} className={draft.completionMode === id ? 'is-active' : ''} onClick={() => choose('completionMode', id)}><span>{icon}</span><strong>{label}</strong>{id === 'pomodoro' && !supportsPomodoro && <small>Bu kategoriyle uyumsuz</small>}</button>)}
                </div>
                {incompatiblePomodoro && <p className="habit-composer-error">Pomodoro; Eğitim, Zihin, Üretkenlik veya Yaratıcılık kategorisi gerektirir. Kategoriyi ya da modu değiştir.</p>}
                {draft.completionMode !== 'single' && <div className="habit-goal-stepper"><button type="button" onClick={() => choose('completionGoal', Math.max(1, draft.completionGoal - 1))} aria-label="Hedefi azalt">−</button><div><small>{draft.completionMode === 'pomodoro' ? 'POMODORO HEDEFİ' : 'GÜNLÜK HEDEF'}</small><strong>{draft.completionGoal}</strong><span>{draft.completionMode === 'pomodoro' ? 'seans' : 'kez'}</span></div><button type="button" onClick={() => choose('completionGoal', Math.min(20, draft.completionGoal + 1))} aria-label="Hedefi artır">+</button></div>}
              </section>

              <section className="habit-composer-section">
                <div className="habit-composer-section__title"><span>04</span><div><h3>Zaman</h3><p>Günün hangi bölümünde hatırlatılsın?</p></div></div>
                <div className="habit-time-picker">{TIME_OPTIONS.map((option) => <button key={option.id} type="button" aria-pressed={draft.timeOfDay === option.id} className={draft.timeOfDay === option.id ? 'is-active' : ''} onClick={() => choose('timeOfDay', option.id)}><span><LuupiIcon name={option.icon} /></span><strong>{option.label}</strong></button>)}</div>
                <button type="button" role="switch" aria-checked={draft.useTimeWindow} className={`habit-time-toggle ${draft.useTimeWindow ? 'is-active' : ''}`} onClick={() => choose('useTimeWindow', !draft.useTimeWindow)}><div><strong>Saat aralığı ve bildirim</strong><small>Başlangıç saatinde telefonunda hatırlatır.</small></div><span><i /></span></button>
                {draft.useTimeWindow && <div className="habit-time-window"><label><span>Başlangıç</span><input type="time" value={draft.windowStart} onChange={(event) => setDraft((current) => ({ ...current, windowStart: event.target.value }))} /></label><b>→</b><label><span>Bitiş</span><input type="time" value={draft.windowEnd} onChange={(event) => setDraft((current) => ({ ...current, windowEnd: event.target.value }))} /></label></div>}
                {invalidWindow && <p className="habit-composer-error">Bitiş saati başlangıç saatinden sonra olmalı.</p>}
              </section>

              <section className="habit-composer-section habit-composer-section--appearance">
                <div className="habit-composer-section__title"><span>05</span><div><h3>Kart tonu</h3><p>{selectedCategory?.name ?? 'Kategori'} renk ailesinden bir ton seç.</p></div></div>
                <div className="habit-tone-picker">{toneOptions.map((color) => <button key={color} type="button" aria-label={`${selectedCategory?.name ?? 'Kategori'} kart tonu`} aria-pressed={draft.labelColor === color} style={{ background: color }} onClick={() => choose('labelColor', color)} />)}</div>
              </section>
            </div>
            <footer className="habit-composer__footer">
              <div><span><LuupiIcon name={draft.icon} /></span><p><strong>{draft.name.trim() || 'Kartına bir ad ver'}</strong><small>{recurrenceSummary(draft)}</small></p></div>
              <AppButton type="submit" tone="primary" size="lg" disabled={!canSave}>{editHabit ? 'Değişiklikleri Kaydet' : 'Alışkanlık Oluştur'}</AppButton>
            </footer>
          </form>
        )}
      </section>

      {confirmDiscard && <div className="habit-discard-dialog" role="alertdialog" aria-modal="true" aria-labelledby="habit-discard-title"><button type="button" aria-label="Taslağa dön" onClick={() => setConfirmDiscard(false)} /><section ref={discardRef}><span aria-hidden>◌</span><h2 id="habit-discard-title">Taslak silinsin mi?</h2><p>Yaptığın değişiklikler henüz kaydedilmedi.</p><div><AppButton tone="secondary" block onClick={() => setConfirmDiscard(false)}>Taslağa Dön</AppButton><AppButton tone="destructive" block haptic="medium" onClick={closeNow}>Taslağı Sil</AppButton></div></section></div>}
    </div>,
    document.body,
  )
}
