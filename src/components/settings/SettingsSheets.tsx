import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ImportPreview } from '../../utils/storage'
import { scheduleAfterMotion } from '../../utils/motion'
import { useModalDismiss } from '../../utils/useModalDismiss'
import { useSheetDragDismiss } from '../../utils/useSheetDragDismiss'
import AppButton from '../ui/AppButton'

function SettingsSheet({ eyebrow, title, icon, onClose, children, initialSelector }: {
  eyebrow: string
  title: string
  icon: ReactNode
  onClose: () => void
  children: (close: () => void) => ReactNode
  initialSelector?: string
}) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => {
      const initial = initialSelector ? panelRef.current?.querySelector<HTMLElement>(initialSelector) : null
      ;(initial ?? closeRef.current)?.focus()
    })
    return () => { window.cancelAnimationFrame(frame); previous?.focus() }
  }, [initialSelector])

  return createPortal(
    <div
      className="settings-sheet-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-sheet-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]') ?? [])
        if (!nodes.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }}
    >
      <button type="button" className="settings-sheet__scrim" onClick={close} aria-label="Kapat" />
      <section ref={panelRef} style={sheetDrag.surfaceStyle} className={`settings-sheet ${sheetDrag.surfaceClassName} ${isExiting ? 'settings-sheet--exit' : 'settings-sheet--enter'}`}>
        <span className="settings-sheet__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header className="settings-sheet__header">
          <span className="settings-sheet__icon" aria-hidden>{icon}</span>
          <div><span>{eyebrow}</span><h2 id="settings-sheet-title">{title}</h2></div>
          <AppButton ref={closeRef} tone="quiet" size="sm" haptic="light" onClick={close} aria-label="Kapat">×</AppButton>
        </header>
        <div className="settings-sheet__content">{children(close)}</div>
      </section>
    </div>,
    document.body,
  )
}

export function ProfileNameSheet({ name, onClose, onSave }: { name: string; onClose: () => void; onSave: (name: string) => void }) {
  const [value, setValue] = useState(name === 'Luupi Kullanıcısı' ? '' : name)
  const trimmed = value.trim()
  const unchanged = trimmed === (name === 'Luupi Kullanıcısı' ? '' : name)
  return (
    <SettingsSheet eyebrow="KİŞİSELLEŞTİRME" title="Profil adı" icon="✎" onClose={onClose} initialSelector="input">
      {(close) => <>
        <label className="settings-name-field"><span>Uygulamada görünecek ad</span><input value={value} onChange={(event) => setValue(event.target.value)} maxLength={30} placeholder="İstersen bir ad ekle" onKeyDown={(event) => { if (event.key === 'Enter' && !unchanged) { onSave(trimmed); close() } }} /><small>{value.length}/30</small></label>
        <p className="settings-sheet__hint">İsim vermek zorunda değilsin. Boş bırakırsan profilin “Luupi yolculuğu” olarak görünür.</p>
        <AppButton tone="primary" size="lg" block haptic="none" disabled={unchanged} onClick={() => { onSave(trimmed); close() }}>{trimmed ? 'Adı Kaydet' : 'İsmi Kaldır'}</AppButton>
      </>}
    </SettingsSheet>
  )
}

export function ImportConfirmSheet({ preview, onClose, onConfirm }: { preview: ImportPreview; onClose: () => void; onConfirm: () => void }) {
  const exportedAt = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(preview.exportedAt))
  return (
    <SettingsSheet eyebrow="YEDEKTEN DÖN" title="Bu yedek yüklensin mi?" icon="↥" onClose={onClose}>
      {(close) => <>
        <div className="settings-import-preview"><div><span>Yedek tarihi</span><strong>{exportedAt}</strong></div><div><span>Veri paketi</span><strong>{preview.itemCount} bölüm</strong></div><div><span>Şema</span><strong>v{preview.version}</strong></div></div>
        <p className="settings-sheet__hint">Yedekte bulunan bölümler bu cihazdaki karşılıklarının üzerine yazılır. İşlemden sonra Luupi yeniden açılır.</p>
        <div className="settings-sheet__actions"><AppButton tone="secondary" size="lg" block onClick={close}>Vazgeç</AppButton><AppButton tone="primary" size="lg" block haptic="none" onClick={() => { close(); scheduleAfterMotion(onConfirm) }}>Yedeği Yükle</AppButton></div>
      </>}
    </SettingsSheet>
  )
}

export function ResetDataSheet({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <SettingsSheet eyebrow="DANGER ZONE" title="Luupi sıfırlansın mı?" icon="!" onClose={onClose}>
      {(close) => <>
        <div className="settings-reset-warning"><span aria-hidden>×</span><div><strong>Bu işlem geri alınamaz</strong><p>Alışkanlıklar, kayıtlar, XP, rozetler, araç geçmişleri ve bütün tercihler silinir.</p></div></div>
        <p className="settings-sheet__hint">Devam etmeden önce yedek oluşturmanı öneririz.</p>
        <div className="settings-sheet__actions"><AppButton tone="secondary" size="lg" block onClick={close}>Vazgeç</AppButton><AppButton tone="destructive" size="lg" block haptic="none" onClick={() => { close(); scheduleAfterMotion(onConfirm) }}>Tüm Verileri Sil</AppButton></div>
      </>}
    </SettingsSheet>
  )
}
