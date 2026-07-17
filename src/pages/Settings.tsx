import { useEffect, useRef, useState } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { useNavigate } from 'react-router-dom'
import BackBar from '../components/BackBar'
import {
  ImportConfirmSheet,
  ProfileNameSheet,
  ResetDataSheet,
} from '../components/settings/SettingsSheets'
import {
  SettingsRow,
  SettingsSection,
  SettingsSegmented,
  SettingsToggle,
} from '../components/settings/SettingsPrimitives'
import AppButton from '../components/ui/AppButton'
import PageHeader from '../components/ui/PageHeader'
import { useApp } from '../context/AppContext'
import { todayStr } from '../utils/date'
import {
  cancelAllPendingNotifications,
  getNotificationStatus,
  openNotificationSettings,
  requestNotificationPermission,
  scheduleDailySummaryNotification,
  scheduleStreakRiskReminder,
  type NotifPermission,
} from '../utils/reminderNotifications'
import { profileDisplayName } from '../utils/profileSummary'
import { playConfirm } from '../utils/sound'
import {
  applyImportPreview,
  exportData,
  inspectImportData,
  resetAllData,
  storage,
  type ImportPreview,
  type NotifPrefs,
} from '../utils/storage'
import { getThemePref, setThemePref, type ThemePref } from '../utils/theme'
import { showToast } from '../utils/toast'
import { formatWaterAmount } from '../utils/water'
import LuupiIcon from '../components/ui/LuupiIcon'

const DAY_END_OPTIONS = [0, 1, 2, 3, 4].map((hour) => ({ value: hour, label: `${String(hour).padStart(2, '0')}:00` }))
const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Açık', icon: <LuupiIcon name="sun" size={16} /> },
  { value: 'dark' as const, label: 'Koyu', icon: <LuupiIcon name="moon" size={16} /> },
  { value: 'system' as const, label: 'Sistem', icon: <LuupiIcon name="settings" size={16} /> },
]

const PERMISSION_COPY: Record<NotifPermission, { title: string; detail: string }> = {
  granted: { title: 'Bildirimler aktif', detail: 'Luupi seçtiğin hatırlatmaları gönderebilir.' },
  denied: { title: 'Bildirimler kapalı', detail: 'İzni cihaz ayarlarından açman gerekiyor.' },
  prompt: { title: 'Bildirim izni bekliyor', detail: 'Hatırlatmaları kullanmak için bir kez izin ver.' },
  unavailable: { title: 'Mobil uygulamada kullanılabilir', detail: 'Bildirimler web sürümünde çalışmaz.' },
}

export default function Settings() {
  const navigate = useNavigate()
  const { profile, updateUsername, pomodoroSettings } = useApp()
  const [nameOpen, setNameOpen] = useState(false)
  const [theme, setTheme] = useState<ThemePref>(() => getThemePref())
  const [soundOn, setSoundOn] = useState(() => storage.getSoundEnabled())
  const [dayEndHour, setDayEndHour] = useState(() => storage.getDayEndHour())
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(() => storage.getNotifPrefs())
  const [permission, setPermission] = useState<NotifPermission>('unavailable')
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void getNotificationStatus().then(setPermission)
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void getNotificationStatus().then(setPermission)
    })
    return () => { void listener.then((handle) => handle.remove()) }
  }, [])

  const changeTheme = (nextTheme: ThemePref) => {
    setTheme(nextTheme)
    setThemePref(nextTheme)
    const label = THEME_OPTIONS.find((option) => option.value === nextTheme)?.label ?? 'Sistem'
    showToast({ tone: 'info', icon: '◐', title: `${label} tema seçildi`, message: 'Görünüm tercihin kaydedildi.', haptic: 'none' })
  }

  const changeSound = (enabled: boolean) => {
    setSoundOn(enabled)
    storage.setSoundEnabled(enabled)
    if (enabled) playConfirm()
    showToast({ tone: 'info', icon: enabled ? '♪' : '×', title: enabled ? 'Uygulama sesleri açıldı' : 'Uygulama sesleri kapatıldı', haptic: 'none' })
  }

  const changeDayEnd = (hour: number) => {
    setDayEndHour(hour)
    storage.setDayEndHour(hour)
    window.dispatchEvent(new Event('luupi-daychange'))
    void scheduleDailySummaryNotification()
    showToast({ tone: 'info', icon: '◷', title: `Gün ${String(hour).padStart(2, '0')}:00'da yenilenecek`, message: 'Özet ve seri ritmi buna göre güncellendi.', haptic: 'none' })
  }

  const changeNotification = (key: keyof NotifPrefs, enabled: boolean) => {
    if (permission !== 'granted') return
    const next = { ...notifPrefs, [key]: enabled }
    setNotifPrefs(next)
    storage.setNotifPrefs(next)
    if (key === 'streakRisk') void scheduleStreakRiskReminder(profile.lastActiveDate === todayStr())
    if (key === 'dailySummary') void scheduleDailySummaryNotification()
    showToast({ tone: 'info', icon: enabled ? '●' : '○', title: enabled ? 'Hatırlatma açıldı' : 'Hatırlatma kapatıldı', haptic: 'none' })
  }

  const requestPermission = async () => {
    const granted = await requestNotificationPermission()
    const nextStatus = await getNotificationStatus()
    setPermission(nextStatus)
    if (granted) {
      void scheduleStreakRiskReminder(profile.lastActiveDate === todayStr())
      void scheduleDailySummaryNotification()
      showToast({ tone: 'success', icon: '●', title: 'Bildirimler hazır', message: 'Seçtiğin hatırlatmalar etkinleştirildi.', haptic: 'success' })
    } else {
      showToast({ tone: 'error', icon: '!', title: 'Bildirim izni verilmedi', message: 'Daha sonra cihaz ayarlarından açabilirsin.', haptic: 'error' })
    }
  }

  const openPermissionSettings = () => {
    if (openNotificationSettings()) return
    showToast({ tone: 'info', contextIcon: <LuupiIcon name="settings" size={16} />, title: 'Cihaz ayarlarını aç', message: 'Luupi bildirim iznini sistem ayarlarından etkinleştir.', haptic: 'light' })
  }

  const saveName = (name: string) => {
    updateUsername(name)
    showToast({ tone: 'success', icon: '✎', title: name ? 'Profil adı güncellendi' : 'Profil adı kaldırıldı', message: name || 'Luupi yolculuğu', haptic: 'light' })
  }

  const createBackup = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `luupi-yedek-${todayStr()}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    showToast({ tone: 'success', icon: '↓', title: 'Yedek hazırlandı', message: 'Luupi verilerin JSON dosyasına aktarıldı.', haptic: 'light' })
  }

  const readBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const preview = inspectImportData(String(reader.result ?? ''))
      if (!preview) {
        showToast({ tone: 'error', icon: '!', title: 'Yedek okunamadı', message: 'Dosya geçerli bir Luupi yedeği değil.', haptic: 'error' })
        return
      }
      setImportPreview(preview)
    }
    reader.onerror = () => showToast({ tone: 'error', icon: '!', title: 'Dosya okunamadı', message: 'Lütfen dosyayı yeniden seç.', haptic: 'error' })
    reader.readAsText(file)
  }

  const applyBackup = async () => {
    if (!importPreview) return
    await cancelAllPendingNotifications()
    if (!applyImportPreview(importPreview)) {
      showToast({ tone: 'error', icon: '!', title: 'Yedek yüklenemedi', haptic: 'error' })
      return
    }
    setImportPreview(null)
    showToast({ tone: 'success', icon: '↑', title: 'Yedek yüklendi', message: 'Luupi yeniden başlatılıyor.', haptic: 'success' })
    window.setTimeout(() => window.location.reload(), 700)
  }

  const resetApp = async () => {
    await cancelAllPendingNotifications()
    await resetAllData()
    window.location.reload()
  }

  const permissionCopy = PERMISSION_COPY[permission]
  const notificationsEnabled = permission === 'granted'
  const dayEndLabel = `${String(dayEndHour).padStart(2, '0')}:00`

  return (
    <div className="settings-page">
      <div className="settings-page__ambient" aria-hidden />
      <div className="settings-page__content">
        <BackBar title="Profil" />
        <PageHeader title="Ayarlar" subtitle="Luupi’yi kendi ritmine göre ayarla." />

        <SettingsSection eyebrow="KİŞİSELLEŞTİRME" title="Sana ait hissetsin" tone="lime">
          <SettingsRow icon={<LuupiIcon name="pencil" />} title="Profil adı" description="Profil vitrinin ve özetlerde görünür" value={profileDisplayName(profile)} onClick={() => setNameOpen(true)} />
          <div className="settings-control-block">
            <div><span className="settings-row__icon" aria-hidden>◐</span><span><strong>Görünüm</strong><small>Tema değişikliği anında uygulanır</small></span></div>
            <SettingsSegmented value={theme} options={THEME_OPTIONS} onChange={changeTheme} label="Uygulama teması" />
          </div>
          <SettingsRow icon={<LuupiIcon name="music" />} title="Uygulama sesleri" description={soundOn ? 'Onay ve geri bildirim sesleri açık' : 'Luupi sessiz çalışıyor'}><SettingsToggle checked={soundOn} onChange={changeSound} label="Uygulama sesleri" /></SettingsRow>
        </SettingsSection>

        <SettingsSection eyebrow="GÜNLÜK RİTİM" title="Günün sana göre aksın" tone="amber">
          <div className="settings-control-block settings-day-end">
            <div><span className="settings-row__icon" aria-hidden>◷</span><span><strong>Gün ne zaman yenilensin?</strong><small>Seri, alışkanlık ve özet sınırı</small></span><em>{dayEndLabel}</em></div>
            <SettingsSegmented value={dayEndHour} options={DAY_END_OPTIONS} onChange={changeDayEnd} label="Gün kapanış saati" />
            <p>{dayEndHour === 0 ? 'Günün gece yarısında kapanır.' : `${dayEndLabel}'dan önce yaptıkların önceki günün ritmine eklenir.`}</p>
          </div>
        </SettingsSection>

        <SettingsSection eyebrow="BİLDİRİMLER" title="Yalnızca işe yaradığında" tone="info">
          <div className={`settings-permission settings-permission--${permission}`}>
            <span aria-hidden>{permission === 'granted' ? '✓' : permission === 'denied' ? '!' : '●'}</span>
            <div><strong>{permissionCopy.title}</strong><small>{permissionCopy.detail}</small></div>
            {permission === 'prompt' && <AppButton tone="tonal" size="sm" haptic="light" onClick={() => void requestPermission()}>İzin Ver</AppButton>}
            {permission === 'denied' && <AppButton tone="tonal" size="sm" haptic="light" onClick={openPermissionSettings}>Cihaz Ayarları</AppButton>}
          </div>
          <SettingsRow icon={<LuupiIcon name="flame" />} title="Seri uyarısı" description="Bugün boş kaldıysa saat 21:00’de hatırlatır" disabled={!notificationsEnabled}><SettingsToggle checked={notifPrefs.streakRisk} onChange={(enabled) => changeNotification('streakRisk', enabled)} label="Seri uyarısı" disabled={!notificationsEnabled} /></SettingsRow>
          <SettingsRow icon={<LuupiIcon name="play" />} title="Günün özeti" description={`Günün hikâyesini ${dayEndLabel}'da hazırlar`} disabled={!notificationsEnabled}><SettingsToggle checked={notifPrefs.dailySummary} onChange={(enabled) => changeNotification('dailySummary', enabled)} label="Günün özeti bildirimi" disabled={!notificationsEnabled} /></SettingsRow>
        </SettingsSection>

        <SettingsSection eyebrow="ARAÇ TERCİHLERİ" title="Ayarı, aracın yanında yap" tone="neutral">
          <SettingsRow icon={<LuupiIcon name="focus" />} title="Pomodoro ritmi" description={`${pomodoroSettings.workDuration} dk odak · ${pomodoroSettings.breakDuration} dk mola`} value={pomodoroSettings.autoLoop ? 'Otomatik' : 'Manuel'} onClick={() => navigate('/pomodoro?settings=1')} />
          <SettingsRow icon={<LuupiIcon name="water" />} title="Su Takibi" description={`Hızlı ekleme ${formatWaterAmount(storage.getWaterBottleMl())} · Hedef ${formatWaterAmount(storage.getWaterGoalMl())}`} onClick={() => navigate('/su-takibi')} />
        </SettingsSection>

        <SettingsSection eyebrow="VERİ VE GİZLİLİK" title="Kontrol sende" tone="neutral">
          <div className="settings-local-data"><span aria-hidden>⌁</span><div><strong>Bu cihazda saklanıyor</strong><small>Luupi verilerin bir hesap veya bulut gerektirmez.</small></div></div>
          <div className="settings-backup-actions">
            <AppButton tone="secondary" size="md" block haptic="none" leadingIcon={<span aria-hidden>↓</span>} onClick={createBackup}>Yedek Oluştur</AppButton>
            <AppButton tone="tonal" size="md" block haptic="light" leadingIcon={<span aria-hidden>↑</span>} onClick={() => fileRef.current?.click()}>Yedekten Dön</AppButton>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={readBackup} className="hidden" />
          </div>
          <SettingsRow icon={<LuupiIcon name="warning" />} title="Tüm verileri sıfırla" description="Alışkanlıklar, XP, araç geçmişleri ve tercihler" tone="danger" onClick={() => setResetOpen(true)} />
        </SettingsSection>

        <footer className="settings-footer"><strong>Luupi</strong><span>Kişisel ritim · Yerel veri</span></footer>
      </div>

      {nameOpen && <ProfileNameSheet name={profile.username} onClose={() => setNameOpen(false)} onSave={saveName} />}
      {importPreview && <ImportConfirmSheet preview={importPreview} onClose={() => setImportPreview(null)} onConfirm={() => void applyBackup()} />}
      {resetOpen && <ResetDataSheet onClose={() => setResetOpen(false)} onConfirm={() => void resetApp()} />}
    </div>
  )
}
