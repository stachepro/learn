import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { storage, exportData, importData, resetAllData, type NotifPrefs } from '../utils/storage'
import {
  getNotificationStatus, requestNotificationPermission,
  scheduleStreakRiskReminder, scheduleDailySummaryNotification, type NotifPermission,
} from '../utils/reminderNotifications'
import { playConfirm } from '../utils/sound'
import { formatMl } from '../utils/water'
import { todayStr } from '../utils/date'
import { getThemePref, setThemePref, type ThemePref } from '../utils/theme'
import BackBar from '../components/BackBar'

const DAY_END_OPTIONS = [0, 1, 2, 3, 4] as const
const THEME_OPTIONS: { id: ThemePref; label: string; icon: string }[] = [
  { id: 'light', label: 'Açık', icon: '☀️' },
  { id: 'dark', label: 'Koyu', icon: '🌙' },
  { id: 'system', label: 'Sistem', icon: '⚙️' },
]

/* ── Reusable toggle switch (Profil'deki auto-loop anahtarıyla aynı görünüm) ── */
function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="btn-press relative flex-shrink-0 rounded-full transition-all"
      style={{
        width: 48, height: 28,
        background: on ? 'rgb(34,197,94)' : 'rgb(var(--ink) / 0.18)',
        boxShadow: on ? '0 0 10px rgba(34,197,94,0.45)' : 'none',
      }}
    >
      <span className="absolute top-1 rounded-full bg-white transition-all" style={{ width: 20, height: 20, left: on ? 24 : 4 }} />
    </button>
  )
}

function SectionCard({ title, variant = 'g-neutral', children }: { title: string; variant?: string; children: React.ReactNode }) {
  return (
    <div className={`glass ${variant}`} style={{ borderRadius: 24 }}>
      <p className="display text-sm font-bold px-5 py-3.5" style={{ borderBottom: '1px solid rgb(var(--ink) / 0.08)' }}>{title}</p>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { profile, updateUsername, pomodoroSettings, updatePomodoroSettings } = useApp()
  const [mounted, setMounted] = useState(false)

  // Profil / isim
  const [nameInput, setNameInput] = useState(profile.username)
  const [nameSaved, setNameSaved] = useState(false)

  // Bildirimler
  const [notifPrefs, setNotifPrefsState] = useState<NotifPrefs>(() => storage.getNotifPrefs())
  const [permStatus, setPermStatus] = useState<NotifPermission>('unavailable')

  // Ses
  const [soundOn, setSoundOn] = useState(() => storage.getSoundEnabled())

  // Pomodoro
  const [workDur, setWorkDur] = useState(pomodoroSettings.workDuration)
  const [breakDur, setBreakDur] = useState(pomodoroSettings.breakDuration)
  const [autoLoop, setAutoLoop] = useState(pomodoroSettings.autoLoop ?? false)
  const [pomoSaved, setPomoSaved] = useState(false)

  // Su
  const [bottleMl, setBottleMl] = useState(() => storage.getWaterBottleMl())
  const [waterGoalMl, setWaterGoalMl] = useState(() => storage.getWaterGoalMl())

  // Gün döngüsü — günün kaçta yenileneceği (0–4)
  const [dayEndHour, setDayEndHour] = useState(() => storage.getDayEndHour())

  // Tema
  const [theme, setTheme] = useState<ThemePref>(() => getThemePref())

  // Veri yönetimi
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { void getNotificationStatus().then(setPermStatus) }, [])
  useEffect(() => {
    setWorkDur(pomodoroSettings.workDuration)
    setBreakDur(pomodoroSettings.breakDuration)
    setAutoLoop(pomodoroSettings.autoLoop ?? false)
  }, [pomodoroSettings])

  const handleNameSave = () => {
    const trimmed = nameInput.trim()
    if (trimmed) { updateUsername(trimmed); setNameSaved(true); setTimeout(() => setNameSaved(false), 2000) }
    else setNameInput(profile.username)
  }

  const handleNotifToggle = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...notifPrefs, [key]: value }
    setNotifPrefsState(next)
    storage.setNotifPrefs(next)
    // Tercih değişince ilgili bildirimi hemen planla/iptal et (fonksiyonlar
    // tercihi tekrar okur; kapalıysa yalnızca mevcut bildirimi iptal ederler)
    if (key === 'streakRisk') void scheduleStreakRiskReminder(profile.lastActiveDate === todayStr())
    if (key === 'dailySummary') void scheduleDailySummaryNotification()
  }

  const handleRequestPerm = async () => {
    await requestNotificationPermission()
    setPermStatus(await getNotificationStatus())
  }

  const handleDayEndHour = (h: number) => {
    setDayEndHour(h)
    storage.setDayEndHour(h)
    // "Bugün"ü anında yeniden hesaplat ve özet bildirimini yeni saate taşı
    window.dispatchEvent(new Event('luupi-daychange'))
    void scheduleDailySummaryNotification()
  }

  const handleTheme = (pref: ThemePref) => {
    setTheme(pref)
    setThemePref(pref)
  }

  const handleSound = (v: boolean) => {
    setSoundOn(v)
    storage.setSoundEnabled(v)
    if (v) playConfirm()
  }

  const handleSavePomo = () => {
    updatePomodoroSettings({ workDuration: workDur, breakDuration: breakDur, autoLoop })
    setPomoSaved(true)
    setTimeout(() => setPomoSaved(false), 2000)
  }

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `luupi-yedek-${todayStr()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // aynı dosya tekrar seçilebilsin
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importData(String(reader.result ?? ''))
      if (ok) {
        setImportMsg({ ok: true, text: 'Yedek yüklendi, uygulama yenileniyor…' })
        setTimeout(() => window.location.reload(), 900)
      } else {
        setImportMsg({ ok: false, text: 'Geçersiz yedek dosyası.' })
      }
    }
    reader.onerror = () => setImportMsg({ ok: false, text: 'Dosya okunamadı.' })
    reader.readAsText(file)
  }

  const handleReset = () => {
    resetAllData()
    window.location.reload()
  }

  const permText: Record<NotifPermission, string> = {
    granted: 'İzin verildi ✓',
    denied: 'Reddedildi — cihaz ayarlarından açabilirsin',
    prompt: 'Henüz izin verilmedi',
    unavailable: 'Bildirimler yalnızca mobil uygulamada çalışır',
  }

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 space-y-5 ${mounted ? 'page-enter' : 'opacity-0'}`}>
      <BackBar title="Ayarlar" />

      {/* ── Profil ── */}
      <SectionCard title="👤 Profil">
        <label className="text-sm ink-60 font-medium block mb-2">Kullanıcı adı</label>
        <div className="flex items-center gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave() }}
            className="frost-input text-base font-bold flex-1"
            maxLength={30}
          />
          <button
            onClick={handleNameSave}
            className="btn-ink btn-press text-sm px-4 py-2.5 flex-shrink-0"
            style={nameSaved ? { background: 'linear-gradient(160deg, #1f9d4d, #45dc7d)' } : undefined}
          >
            {nameSaved ? '✓' : 'Kaydet'}
          </button>
        </div>
      </SectionCard>

      {/* ── Görünüm / Tema ── */}
      <SectionCard title="🎨 Görünüm">
        <div className="space-y-3">
          <p className="text-sm ink-60">Uygulamanın renk temasını seç.</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ id, label, icon }) => {
              const active = theme === id
              return (
                <button
                  key={id}
                  onClick={() => handleTheme(id)}
                  className="btn-press rounded-2xl py-3 flex flex-col items-center gap-1.5 transition-all"
                  style={active
                    ? { background: 'linear-gradient(150deg, #fbbf24, #f97316)', color: '#2a1402', boxShadow: '0 6px 16px -6px rgba(249,115,22,0.6)' }
                    : { background: 'rgb(var(--ink) / 0.05)', color: 'rgb(var(--ink) / 0.6)', border: '1px solid rgb(var(--ink) / 0.1)' }}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-bold">{label}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[11px] ink-45">
            {theme === 'system' ? 'Cihazının açık/koyu tercihini otomatik izler.' : theme === 'dark' ? 'Her zaman koyu tema.' : 'Her zaman açık tema.'}
          </p>
        </div>
      </SectionCard>

      {/* ── Bildirimler ── */}
      <SectionCard title="🔔 Bildirimler">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium ink-60">İzin durumu</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--ink) / 0.45)' }}>{permText[permStatus]}</p>
            </div>
            {(permStatus === 'prompt' || permStatus === 'denied') && (
              <button onClick={handleRequestPerm} className="chip btn-press text-xs px-3 py-2 flex-shrink-0 font-semibold">İzin ver</button>
            )}
          </div>

          <SettingRow
            label="Streak uyarısı"
            desc="O gün hiç alışkanlık yapmadıysan akşam 21:00'de hatırlatır"
          >
            <Toggle label="Streak uyarısı" on={notifPrefs.streakRisk} onChange={(v) => handleNotifToggle('streakRisk', v)} />
          </SettingRow>

          <SettingRow
            label="Günün özeti bildirimi"
            desc="Her gece 00:00'da günün hikayesi hazır bildirimi gönderir"
          >
            <Toggle label="Günün özeti bildirimi" on={notifPrefs.dailySummary} onChange={(v) => handleNotifToggle('dailySummary', v)} />
          </SettingRow>
        </div>
      </SectionCard>

      {/* ── Gün Döngüsü ── */}
      <SectionCard title="🌙 Gün Döngüsü">
        <div className="space-y-3">
          <p className="text-sm ink-60">
            Günün kaçta yenileneceğini seç. Herkes aynı saatte uyumaz — geç yatıyorsan
            günü daha geç bir saatte kapatabilirsin. Alışkanlıkların yenilenmesi, günün
            özeti ve serin bu saate göre akar.
          </p>
          <div className="flex flex-wrap gap-2">
            {DAY_END_OPTIONS.map((h) => {
              const active = dayEndHour === h
              return (
                <button
                  key={h}
                  onClick={() => handleDayEndHour(h)}
                  className="btn-press rounded-full text-sm font-bold px-4 py-2.5 transition-all"
                  style={active
                    ? { background: 'linear-gradient(150deg, #a78bfa, #7c3aed)', color: '#fff', boxShadow: '0 6px 16px -6px rgba(124,58,237,0.6)' }
                    : { background: 'rgb(var(--ink) / 0.05)', color: 'rgb(var(--ink) / 0.6)', border: '1px solid rgb(var(--ink) / 0.1)' }}
                >
                  {String(h).padStart(2, '0')}:00
                </button>
              )
            })}
          </div>
          <p className="text-[11px] ink-45">
            {dayEndHour === 0
              ? 'Şu an gün gece yarısı (00:00) yenileniyor — standart.'
              : `Şu an gün ${String(dayEndHour).padStart(2, '0')}:00'da yenileniyor. Örneğin gece ${String(dayEndHour).padStart(2, '0')}:00'dan önce tamamladığın alışkanlıklar hâlâ önceki güne yazılır.`}
          </p>
        </div>
      </SectionCard>

      {/* ── Ses ── */}
      <SectionCard title="🔊 Ses">
        <SettingRow
          label="Uygulama sesleri"
          desc={soundOn ? 'Çan ve onay sesleri açık' : 'Tüm uygulama sesleri kapalı'}
        >
          <Toggle label="Uygulama sesleri" on={soundOn} onChange={handleSound} />
        </SettingRow>
      </SectionCard>

      {/* ── Pomodoro ── */}
      <SectionCard title="🍅 Pomodoro">
        <div className="space-y-5">
          {[
            { label: 'Çalışma süresi', value: workDur, set: setWorkDur, min: 5, max: 90, step: 5 },
            { label: 'Mola süresi', value: breakDur, set: setBreakDur, min: 1, max: 30, step: 1 },
          ].map(({ label, value, set, min, max, step }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="ink-60 font-medium">{label}</span>
                <span className="font-bold tnum">{value} dakika</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => set(Number(e.target.value))} className="w-full" />
            </div>
          ))}
          <SettingRow
            label="Otomatik Döngü"
            desc={autoLoop ? 'Mola ve çalışma turları otomatik başlar' : 'Her tur için manuel başlatma gerekir'}
          >
            <Toggle label="Otomatik Döngü" on={autoLoop} onChange={setAutoLoop} />
          </SettingRow>
          <button
            onClick={handleSavePomo}
            className="btn-ink btn-press px-5 py-2.5 text-sm"
            style={pomoSaved ? { background: 'linear-gradient(160deg, #1f9d4d, #45dc7d)' } : undefined}
          >
            {pomoSaved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </SectionCard>

      {/* ── Su Takibi ── */}
      <SectionCard title="💧 Su Takibi" variant="g-sky">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="ink-60 font-medium">Suluk boyutu</span>
            <span className="font-bold tnum">{formatMl(bottleMl)}</span>
          </div>
          <input type="range" min={200} max={5000} step={50} value={bottleMl}
            onChange={(e) => { const ml = Number(e.target.value); setBottleMl(ml); storage.setWaterBottleMl(ml) }}
            className="w-full" />
          <p className="text-[11px] ink-45">"Suluk" butonu bu miktarı ekler</p>

          <div className="flex justify-between text-sm pt-3">
            <span className="ink-60 font-medium">Günlük hedef</span>
            <span className="font-bold tnum">{formatMl(waterGoalMl)}</span>
          </div>
          <input type="range" min={500} max={6000} step={250} value={waterGoalMl}
            onChange={(e) => { const ml = Number(e.target.value); setWaterGoalMl(ml); storage.setWaterGoalMl(ml) }}
            className="w-full" />
          <p className="text-[11px] ink-45">Hedefe ulaştığında su animasyonu ekranı doldurur</p>
        </div>
      </SectionCard>

      {/* ── Veri Yönetimi ── */}
      <SectionCard title="🗂 Veri Yönetimi">
        <div className="space-y-3">
          <p className="text-xs ink-60">Tüm alışkanlıkların, kayıtların ve ayarların bu cihazda saklanır. Yedekleyip başka cihaza taşıyabilirsin.</p>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={handleExport} className="btn-ink btn-press text-sm px-4 py-2.5">⬇ Yedeği indir</button>
            <button onClick={() => fileRef.current?.click()} className="chip btn-press text-sm px-4 py-2.5 font-semibold">⬆ Yedekten yükle</button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
          </div>
          {importMsg && (
            <p className="text-xs font-semibold" style={{ color: importMsg.ok ? '#1f9d4d' : '#c0392b' }}>{importMsg.text}</p>
          )}

          <div className="pt-3 mt-1" style={{ borderTop: '1px solid rgb(var(--ink) / 0.08)' }}>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="btn-press text-sm px-4 py-2.5 rounded-full font-semibold"
                style={{ background: 'rgba(192,57,43,0.1)', color: '#c0392b', border: '1px solid rgba(192,57,43,0.25)' }}
              >
                Tüm verileri sıfırla
              </button>
            ) : (
              <div className="space-y-2.5">
                <p className="text-sm font-bold" style={{ color: '#c0392b' }}>Emin misin? Bu geri alınamaz.</p>
                <p className="text-xs ink-60">Tüm alışkanlıklar, kayıtlar, XP ve ayarlar kalıcı olarak silinir.</p>
                <div className="flex gap-2.5">
                  <button
                    onClick={handleReset}
                    className="btn-press text-sm px-4 py-2.5 rounded-full font-bold text-white"
                    style={{ background: '#c0392b' }}
                  >
                    Evet, sil
                  </button>
                  <button onClick={() => setConfirmReset(false)} className="chip btn-press text-sm px-4 py-2.5 font-semibold">Vazgeç</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <p className="text-center text-[11px] ink-45 pt-2">Luupi · Alışkanlık takibi</p>
    </div>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium ink-60">{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--ink) / 0.45)' }}>{desc}</p>
      </div>
      {children}
    </div>
  )
}
