import type { UserProfile } from '../types'
import { datesBetween } from './date'

/* Seri kuralları tek yerde. Tarihler YYYY-MM-DD; çağıran yerel günü hesaplar
   (date.ts) — böylece bu fonksiyonlar saat dilimine ve "şu an"a bağlı değildir.

   Dondurma sistemi:
   - Kaçırılan her gün açılışta otomatik 1 dondurma harcar; hak yetiyorsa seri korunur.
   - Son hak kazanımından sonraki 7 kesintisiz aktif gün +1 dondurma verir (maks 3).
     Haklar doluyken sayaç bekler; dondurulan günler sayacı ilerletmez.
   - Hak yetmezse seri sıfırlanır ama eldeki dondurmalar YANMAZ — sonraki seride geçerli. */

export const MAX_STREAK_FREEZES = 3
export const FREEZE_EARN_DAYS = 7

export function getFreezes(profile: UserProfile): number {
  return Math.min(profile.streakFreezes ?? 0, MAX_STREAK_FREEZES)
}

export function getFreezeProgress(profile: UserProfile): number {
  return profile.freezeProgress ?? 0
}

// Günün ilk tamamlaması seriyi ilerletir. Aynı gün içindeki sonraki tamamlamalar
// seriyi bir daha artırmaz. Tamamlama geri alınsa bile gün seriden düşmez:
// kullanıcı o gün uygulamaya girip işlem yapmıştır.
export function applyCompletionStreak(profile: UserProfile, today: string, yesterday: string): UserProfile {
  const activeDates = profile.streakActiveDates ?? []
  if (profile.lastActiveDate === today) {
    if (activeDates.includes(today)) return profile
    return { ...profile, streakActiveDates: [...activeDates, today] }
  }
  const continued = !profile.lastActiveDate || profile.lastActiveDate === yesterday
  const streak = continued ? (profile.streak || 0) + 1 : 1

  // Dondurma sayacı: kesintisiz her aktif gün +1; kopuşta sıfırdan başlar.
  let freezes = getFreezes(profile)
  let progress = continued ? getFreezeProgress(profile) : 0
  if (freezes < MAX_STREAK_FREEZES) {
    progress += 1
    if (progress >= FREEZE_EARN_DAYS) {
      freezes += 1
      progress = 0
    }
  }

  return {
    ...profile,
    streak,
    longestStreak: Math.max(streak, profile.longestStreak),
    lastActiveDate: today,
    streakActiveDates: activeDates.includes(today) ? activeDates : [...activeDates, today],
    streakFreezes: freezes,
    freezeProgress: progress,
  }
}

export interface StreakReconcileResult {
  profile: UserProfile
  changed: boolean
  freezesSpent: number   // bu açılışta dondurmayla kapatılan gün sayısı
  streakBroken: boolean  // hak yetmedi, seri sıfırlandı
}

// Açılışta / gün değişiminde çağrılır. lastActiveDate ile bugün arasında boş gün
// varsa: her boş gün için 1 dondurma harcanır ve gün frozenDates'e yazılır.
// Haklar tüm boşluğu kapatamıyorsa hiç harcanmaz (boşa yakmak seriyi kurtarmaz)
// ve seri sıfırlanır. Dondurmayla kapatılan seri, sayı artmadan sürer.
export function reconcileStreak(profile: UserProfile, today: string, yesterday: string): StreakReconcileResult {
  const none: StreakReconcileResult = { profile, changed: false, freezesSpent: 0, streakBroken: false }
  if (!profile.lastActiveDate) return none
  if (profile.lastActiveDate === today || profile.lastActiveDate === yesterday) return none

  const gap = datesBetween(profile.lastActiveDate, today)
  const freezes = getFreezes(profile)

  if (profile.streak > 0 && gap.length > 0 && gap.length <= freezes) {
    return {
      profile: {
        ...profile,
        streakFreezes: freezes - gap.length,
        frozenDates: [...(profile.frozenDates ?? []), ...gap],
        // Seri "dünü kapsıyor" say: bir sonraki tamamlama normal devam etsin.
        // Gerçek tamamlama günleri loglardan okunur; lastActiveDate burada
        // yalnızca seri sürekliliğinin imzasıdır.
        lastActiveDate: yesterday,
      },
      changed: true,
      freezesSpent: gap.length,
      streakBroken: false,
    }
  }

  if (profile.streak === 0 && getFreezeProgress(profile) === 0) return none
  return {
    profile: { ...profile, streak: 0, freezeProgress: 0 },
    changed: true,
    freezesSpent: 0,
    streakBroken: profile.streak > 0,
  }
}

/* Ana sayfadaki alev ikonunun durumu:
   - lit:     bugün seri devam ettirildi — alev yanıyor
   - frozen:  seri dondurmayla kurtarıldı, bugün henüz devam ettirilmedi — buzlu alev
   - pending: seri sağlam ama bugün henüz devam ettirilmedi — sönük alev
   - out:     seri yok */
export type FlameState = 'lit' | 'frozen' | 'pending' | 'out'

export function getFlameState(profile: UserProfile, today: string, yesterday: string): FlameState {
  if (profile.lastActiveDate === today) return 'lit'
  if (!profile.lastActiveDate || profile.streak === 0) return 'out'
  if ((profile.frozenDates ?? []).includes(yesterday)) return 'frozen'
  return 'pending'
}

// Son aktif gün dünden de eskiyse arada boş bir gün kalmıştır: seri kopmuştur.
// (reconcileStreak bunu dondurmalarla birlikte ele alır; bu saf soru ayrı işlerde
// hâlâ kullanışlı.)
export function isStreakStale(profile: UserProfile, today: string, yesterday: string): boolean {
  if (!profile.lastActiveDate) return false
  return profile.lastActiveDate !== today && profile.lastActiveDate !== yesterday
}
