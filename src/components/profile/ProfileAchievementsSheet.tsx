import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Badge } from '../../types'
import { hapticEvent } from '../../utils/haptics'
import { badgeCategory, type BadgeTarget } from '../../utils/profileSummary'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import AppButton from '../ui/AppButton'
import LuupiIcon from '../ui/LuupiIcon'

type Filter = 'earned' | 'locked'

export default function ProfileAchievementsSheet({
  badges,
  earnedBadgeIds,
  targets,
  initialBadge,
  onClose,
}: {
  badges: Badge[]
  earnedBadgeIds: string[]
  targets: BadgeTarget[]
  initialBadge?: Badge | null
  onClose: () => void
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const [filter, setFilter] = useState<Filter>(initialBadge && !earnedBadgeIds.includes(initialBadge.id) || earnedBadgeIds.length === 0 ? 'locked' : 'earned')
  const [selected, setSelected] = useState<Badge | null>(initialBadge ?? null)
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const earned = new Set(earnedBadgeIds)
  const visibleBadges = badges.filter((badge) => filter === 'earned' ? earned.has(badge.id) : !earned.has(badge.id))
  const selectedTarget = selected ? targets.find((target) => target.badge.id === selected.id) : null

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(frame)
      previous?.focus()
    }
  }, [])

  const selectBadge = (badge: Badge) => {
    setSelected(badge)
    void hapticEvent('selection')
  }

  return createPortal(
    <div
      className="profile-achievements-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-achievements-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]') ?? [])
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <button type="button" className="profile-achievements__scrim" onClick={close} aria-label="Kapat" />
      <section ref={panelRef} style={sheetDrag.surfaceStyle} className={`profile-achievements-sheet ${sheetDrag.surfaceClassName} ${isExiting ? 'profile-achievements-sheet--exit' : 'profile-achievements-sheet--enter'}`}>
        <span className="profile-achievements-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="profile-achievements-sheet__header">
          <div><span>BAŞARIM KASASI</span><h2 id="profile-achievements-title">Rozetler</h2><p>{earned.size}/{badges.length} rozet açıldı</p></div>
          <AppButton ref={closeRef} tone="quiet" size="sm" haptic="light" onClick={close} aria-label="Kapat">×</AppButton>
        </header>

        <div className="profile-achievements-sheet__scroll">
          {selected && (
            <article className={`profile-badge-detail ${earned.has(selected.id) ? 'is-earned' : 'is-locked'}`}>
              <span className="profile-badge-detail__emoji" aria-hidden><LuupiIcon name={earned.has(selected.id) ? selected.icon : 'lock'} size={32} /></span>
              <div><small>{badgeCategory(selected.id)}</small><h3>{selected.name}</h3><p>{selected.description}</p></div>
              <strong>{earned.has(selected.id) ? 'Kazanıldı' : selected.condition}</strong>
              {!earned.has(selected.id) && selectedTarget && (
                <div className="profile-badge-detail__progress">
                  <span><b>{Math.min(selectedTarget.current, selectedTarget.target).toLocaleString('tr-TR')}</b> / {selectedTarget.target.toLocaleString('tr-TR')}</span>
                  <i><b style={{ width: `${selectedTarget.percentage}%` }} /></i>
                </div>
              )}
            </article>
          )}

          <div className="profile-achievements-tabs" role="tablist" aria-label="Rozet filtresi">
            <button type="button" role="tab" aria-selected={filter === 'earned'} className={filter === 'earned' ? 'is-active' : ''} onClick={() => { setFilter('earned'); setSelected(null); void hapticEvent('selection') }}>Kazanılan <span>{earned.size}</span></button>
            <button type="button" role="tab" aria-selected={filter === 'locked'} className={filter === 'locked' ? 'is-active' : ''} onClick={() => { setFilter('locked'); setSelected(null); void hapticEvent('selection') }}>Hedefler <span>{badges.length - earned.size}</span></button>
          </div>

          {visibleBadges.length ? (
            <div className="profile-achievements-grid">
              {visibleBadges.map((badge) => (
                <button
                  type="button"
                  key={badge.id}
                  className={`${earned.has(badge.id) ? 'is-earned' : 'is-locked'} ${selected?.id === badge.id ? 'is-selected' : ''}`}
                  onClick={() => selectBadge(badge)}
                  aria-pressed={selected?.id === badge.id}
                  aria-label={`${badge.name}. ${earned.has(badge.id) ? 'Kazanıldı' : badge.condition}`}
                >
                  <span aria-hidden><LuupiIcon name={earned.has(badge.id) ? badge.icon : 'lock'} size={24} /></span>
                  <strong>{badge.name}</strong>
                  <small>{badgeCategory(badge.id)}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="profile-achievements-empty"><span>✦</span><strong>İlk rozetin yolda</strong><p>Bugün bir alışkanlığı tamamlayarak vitrini aç.</p></div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  )
}
