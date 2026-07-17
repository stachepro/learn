import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import LevelModal from '../components/LevelModal'
import ProfileAchievementsSheet from '../components/profile/ProfileAchievementsSheet'
import StreakModal from '../components/StreakModal'
import AppButton from '../components/ui/AppButton'
import ListRow from '../components/ui/ListRow'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import { useApp } from '../context/AppContext'
import { ALL_BADGES } from '../utils/badges'
import { formatMinutes } from '../utils/date'
import { expProgressInCurrentLevel } from '../utils/exp'
import { hapticEvent } from '../utils/haptics'
import {
  buildProfileSummary,
  getNextBadgeTargets,
  profileDisplayName,
  type AchievementMetrics,
  type BadgeTarget,
} from '../utils/profileSummary'
import { storage } from '../utils/storage'
import LuupiIcon from '../components/ui/LuupiIcon'
import type { IconName } from '../utils/icons'
import { isWakeOnGoal } from '../utils/wake'
import type { Badge } from '../types'

function profileTotem(level: number): IconName {
  if (level >= 20) return 'crown'
  if (level >= 10) return 'flame'
  if (level >= 5) return 'bolt'
  return 'seedling'
}

export default function Profile() {
  const navigate = useNavigate()
  const { profile, logs, freeSessions } = useApp()
  const [showLevel, setShowLevel] = useState(false)
  const [showStreak, setShowStreak] = useState(false)
  const [badgeSheet, setBadgeSheet] = useState<{ open: boolean; badge: Badge | null }>({ open: false, badge: null })
  const summary = buildProfileSummary(logs, freeSessions)
  const { current, needed, percentage } = expProgressInCurrentLevel(profile.totalExp)

  const waterEntries = storage.getWaterEntries()
  const waterTotals = new Map<string, number>()
  waterEntries.forEach((entry) => waterTotals.set(entry.date, (waterTotals.get(entry.date) ?? 0) + entry.ml))
  const waterDayValues = [...waterTotals.values()]
  const wakeRecords = storage.getWakeRecords()
  const wakeGoal = storage.getWakeGoal()
  const noRush = storage.getNoRushHistory()
  const achievementMetrics: AchievementMetrics = {
    ...summary,
    longestStreak: Math.max(profile.streak, profile.longestStreak),
    level: profile.level,
    totalExp: profile.totalExp,
    waterEntries: waterEntries.length,
    waterGoalDays: [...waterTotals].filter(([date, amount]) => amount >= storage.getWaterGoalForDate(date)).length,
    waterBestDayMl: waterDayValues.length ? Math.max(...waterDayValues) : 0,
    waterTotalMl: waterEntries.reduce((sum, entry) => sum + entry.ml, 0),
    wakeRecords: wakeRecords.length,
    wakeGoalDays: wakeRecords.filter((record) => isWakeOnGoal(record, wakeGoal) === true).length,
    todoCompleted: storage.getTodoStats().completedTaskIds.length,
    noRushCompleted: noRush.length,
    noRushSeconds: noRush.reduce((sum, record) => sum + record.totalSeconds, 0),
  }
  const allTargets = getNextBadgeTargets(ALL_BADGES, profile.badges, achievementMetrics, ALL_BADGES.length)
  const targets = allTargets.slice(0, 3)
  const earnedBadges = profile.badges.map((id) => ALL_BADGES.find((badge) => badge.id === id)).filter((badge): badge is Badge => Boolean(badge))
  const featuredBadge = earnedBadges.at(-1) ?? null
  const displayName = profileDisplayName(profile)
  const remainingExp = Math.max(0, needed - current)

  const openBadge = (badge: Badge | null) => {
    void hapticEvent('selection')
    setBadgeSheet({ open: true, badge })
  }

  const navigateWithFeedback = (path: string) => {
    void hapticEvent('selection')
    navigate(path)
  }

  return (
    <div className="profile-page">
      <div className="profile-page__ambient" aria-hidden />
      <div className="profile-page__content">
        <PageHeader
          title="Profil"
          subtitle="Disiplin kimliğin, ilerlemen ve kazandığın başarımlar."
        action={<AppButton tone="quiet" size="sm" haptic="light" onClick={() => navigate('/settings')} leadingIcon={<LuupiIcon name="settings" size={16} />}>Ayarlar</AppButton>}
        />

        <SurfaceCard
          variant="hero"
          interactive
          className="profile-identity-card"
          style={{ '--profile-level-offset': 100 - percentage, '--profile-level-progress': `${percentage}%` } as CSSProperties}
          onClick={() => { void hapticEvent('selection'); setShowLevel(true) }}
          aria-label={`Seviye ${profile.level}. ${current}/${needed} XP. Seviye detayını aç.`}
        >
          <span className="profile-identity-card__glow" aria-hidden />
          <div className="profile-identity-card__crest" aria-hidden>
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" />
              <circle className="is-progress" cx="60" cy="60" r="52" pathLength="100" />
            </svg>
            <span><LuupiIcon name={profileTotem(profile.level)} size={48} /></span>
          </div>
          <div className="profile-identity-card__copy">
            <span>DİSİPLİN KİMLİĞİ</span>
            <h2>{displayName}</h2>
            <div><strong>Seviye {profile.level}</strong><i>{current.toLocaleString('tr-TR')} / {needed.toLocaleString('tr-TR')} XP</i></div>
            <div className="profile-identity-card__progress" aria-hidden><i /></div>
            <p><b>{remainingExp.toLocaleString('tr-TR')} XP</b> sonra yeni seviye</p>
          </div>
          <span className="profile-identity-card__arrow" aria-hidden><LuupiIcon name="arrow-up-right" size={16} /></span>
        </SurfaceCard>

        <section className="profile-section">
          <header className="profile-section__header"><div><span>MOMENTUM</span><h2>Ritmin hâlâ hareket ediyor</h2></div><small>Dokun, seriyi aç</small></header>
          <SurfaceCard variant="tinted" interactive className="profile-momentum-card" onClick={() => { void hapticEvent('selection'); setShowStreak(true) }} aria-label={`${profile.streak} günlük seri. Seri merkezini aç.`}>
            <div className="profile-momentum-card__primary"><span aria-hidden><LuupiIcon name="flame" size={32} /></span><strong>{profile.streak}</strong><small>günlük seri</small></div>
            <div><span>En uzun</span><strong>{profile.longestStreak}<small> gün</small></strong></div>
            <div><span>Aktif gün</span><strong>{summary.activeDays}<small> gün</small></strong></div>
            <i aria-hidden>›</i>
          </SurfaceCard>
        </section>

        <section className="profile-section profile-achievements">
          <header className="profile-section__header">
            <div><span>BAŞARIMLAR</span><h2>Disiplin vitrini</h2></div>
            <AppButton tone="quiet" size="sm" haptic="light" onClick={() => openBadge(null)}>Tümünü Gör</AppButton>
          </header>

          {featuredBadge ? (
            <button type="button" className="profile-featured-badge" onClick={() => openBadge(featuredBadge)}>
              <span className="profile-featured-badge__emoji" aria-hidden><LuupiIcon name={featuredBadge.icon} size={32} /></span>
              <div><span>ÖNE ÇIKAN ROZET</span><h3>{featuredBadge.name}</h3><p>{featuredBadge.description}</p></div>
              <strong>Kazanıldı <i aria-hidden><LuupiIcon name="arrow-up-right" size={14} /></i></strong>
            </button>
          ) : (
            <button type="button" className="profile-featured-badge is-empty" onClick={() => targets[0] && openBadge(targets[0].badge)}>
              <span className="profile-featured-badge__emoji" aria-hidden>✦</span>
              <div><span>İLK BAŞARIM</span><h3>Vitrinin seni bekliyor</h3><p>Bir alışkanlığı tamamla ve ilk rozetini aç.</p></div>
              <strong>Hedefi Gör <i aria-hidden><LuupiIcon name="arrow-up-right" size={14} /></i></strong>
            </button>
          )}

          {earnedBadges.length > 0 && (
            <div className="profile-badge-shelf" aria-label="Kazanılan rozetler">
              {earnedBadges.slice().reverse().map((badge) => (
                <button type="button" key={badge.id} onClick={() => openBadge(badge)} aria-label={`${badge.name} rozetini aç`}>
                  <span aria-hidden><LuupiIcon name={badge.icon} size={24} /></span><strong>{badge.name}</strong>
                </button>
              ))}
            </div>
          )}

          {targets.length > 0 && (
            <div className="profile-next-targets">
              <div className="profile-next-targets__title"><strong>Sıradaki hedefler</strong><span>En yakın {targets.length} rozet</span></div>
              {targets.map((target) => <TargetRow key={target.badge.id} target={target} onOpen={() => openBadge(target.badge)} />)}
            </div>
          )}
        </section>

        <section className="profile-section">
          <header className="profile-section__header"><div><span>TÜM ZAMANLAR</span><h2>Bıraktığın iz</h2></div><AppButton tone="quiet" size="sm" haptic="light" onClick={() => navigate('/stats')}>Detaylar</AppButton></header>
          <div className="profile-lifetime-grid">
            <LifetimeMetric icon="✓" label="Tamamlanan" value={summary.totalCompleted.toLocaleString('tr-TR')} tone="lime" />
            <LifetimeMetric icon="◷" label="Odak süresi" value={formatMinutes(summary.totalFocusMinutes)} tone="amber" />
            <LifetimeMetric icon="●" label="Pomodoro" value={summary.totalPomodoros.toLocaleString('tr-TR')} tone="orange" />
            <LifetimeMetric icon="✦" label="Aktif gün" value={summary.activeDays.toLocaleString('tr-TR')} tone="sky" />
          </div>
        </section>

        <section className="profile-destinations" aria-label="Profil bağlantıları">
          <ListRow title="Geçmiş" subtitle="Takvim ve günlük karar arşivin" leading={<span className="profile-row-icon is-history">▦</span>} trailing={<span aria-hidden>›</span>} onClick={() => navigateWithFeedback('/history')} />
        <ListRow title="Ayarlar" subtitle="Tema, bildirimler ve veri yönetimi" leading={<span className="profile-row-icon is-settings"><LuupiIcon name="settings" /></span>} trailing={<span aria-hidden>›</span>} onClick={() => navigateWithFeedback('/settings')} />
        </section>
      </div>

      {showLevel && <LevelModal onClose={() => setShowLevel(false)} />}
      {showStreak && <StreakModal onClose={() => setShowStreak(false)} />}
      {badgeSheet.open && (
        <ProfileAchievementsSheet
          badges={ALL_BADGES}
          earnedBadgeIds={profile.badges}
          targets={allTargets}
          initialBadge={badgeSheet.badge}
          onClose={() => setBadgeSheet({ open: false, badge: null })}
        />
      )}
    </div>
  )
}

function TargetRow({ target, onOpen }: { target: BadgeTarget; onOpen: () => void }) {
  return (
    <button type="button" className="profile-target-row" onClick={onOpen}>
      <span aria-hidden><LuupiIcon name={target.badge.icon} size={24} /></span>
      <div><strong>{target.badge.name}</strong><small>{target.badge.condition}</small><i><b style={{ width: `${target.percentage}%` }} /></i></div>
      <em>{Math.min(target.current, target.target).toLocaleString('tr-TR')}/{target.target.toLocaleString('tr-TR')}</em>
    </button>
  )
}

function LifetimeMetric({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: string }) {
  return <SurfaceCard variant="base" className={`profile-lifetime-metric is-${tone}`}><span aria-hidden>{icon}</span><small>{label}</small><strong>{value}</strong></SurfaceCard>
}
