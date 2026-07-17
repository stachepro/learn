/* Kayıtlı verinin sürümü. Bugün tek sürüm var; asıl kazanç ileride:
   veri sürümlenmemişse hangi biçimde olduğunu tahmin etmek zorunda kalırsın.
   Damga bugün bedava, kullanıcılar veri biriktirdikten sonra pahalı. */

export const SCHEMA_VERSION = 4

export interface Migration {
  to: number          // bu adım veriyi hangi sürüme taşır
  describe: string
  run: () => void
}

/* v2: Seri dondurma alanları. Mevcut kullanıcıya jest: o anki serisinin her 7
   günü için 1 dondurma (maks 3) verilir; sayaç serinin kalanından başlar.
   Adımlar geçmişin fotoğrafıdır — güncel storage modülüne değil, o günkü ham
   anahtara yazar (aksi halde ileride storage değişince geçmiş adım da değişir). */
function grantInitialFreezes(): void {
  try {
    const raw = localStorage.getItem('luupi_user_profile')
    if (!raw) return
    const p = JSON.parse(raw) as { streak?: number; streakFreezes?: number; freezeProgress?: number }
    if (p.streakFreezes !== undefined) return
    const streak = p.streak ?? 0
    const freezes = Math.min(3, Math.floor(streak / 7))
    p.streakFreezes = freezes
    p.freezeProgress = freezes < 3 ? streak % 7 : 0
    localStorage.setItem('luupi_user_profile', JSON.stringify(p))
  } catch { /* profil okunamıyorsa varsayılanlar (0 dondurma) yeter */ }
}

/* v3: İlk tamamlamaları profilde kalıcı bir streak günlüğüne taşır. Böylece
   kullanıcı bir habit tamamlamasını geri alsa veya habit'i silse bile daha önce
   kazanılmış seri günü takvimden kaybolmaz. */
function persistStreakActiveDates(): void {
  try {
    const profileRaw = localStorage.getItem('luupi_user_profile')
    if (!profileRaw) return
    const profile = JSON.parse(profileRaw) as { lastActiveDate?: string; frozenDates?: string[]; streakActiveDates?: string[] }
    if (profile.streakActiveDates !== undefined) return

    const dates = new Set<string>()
    const logsRaw = localStorage.getItem('luupi_daily_logs')
    if (logsRaw) {
      const logs = JSON.parse(logsRaw) as Record<string, { habits?: Record<string, { completed?: boolean }> }>
      for (const [date, day] of Object.entries(logs)) {
        if (Object.values(day.habits ?? {}).some((log) => log.completed)) dates.add(date)
      }
    }
    if (profile.lastActiveDate && !(profile.frozenDates ?? []).includes(profile.lastActiveDate)) dates.add(profile.lastActiveDate)
    profile.streakActiveDates = [...dates].sort()
    localStorage.setItem('luupi_user_profile', JSON.stringify(profile))
  } catch { /* Eski veri okunamıyorsa boş geçmişle devam etmek daha güvenlidir. */ }
}

// Yeni bir sürüme geçerken buraya bir adım eklenir; kullanıcının bulunduğu
// sürümden itibaren sırayla çalıştırılır.
export const MIGRATIONS: Migration[] = [
  { to: 2, describe: 'Seri dondurma: mevcut seriden başlangıç hakkı tanı', run: grantInitialFreezes },
  { to: 3, describe: 'Tamamlanan seri günlerini kalıcı geçmişe taşı', run: persistStreakActiveDates },
  // İkon verisi storage.runMigrations içinde iki depoya birden yazılır.
  { to: 4, describe: 'Emoji kimliklerini ortak ikon sistemine taşı', run: () => {} },
]

// Saf: `from` sürümünden `to` sürümüne çıkmak için gereken adımlar, sırayla.
export function migrationsToRun(from: number, to: number = SCHEMA_VERSION, all: Migration[] = MIGRATIONS): Migration[] {
  return all.filter((m) => m.to > from && m.to <= to).sort((a, b) => a.to - b.to)
}

export type MigrationOutcome =
  | { status: 'fresh' }        // ilk kurulum ya da sürümlenmemiş eski veri
  | { status: 'current' }      // zaten güncel
  | { status: 'migrated'; from: number; ran: number[] }
  | { status: 'downgrade'; from: number }  // veri uygulamadan yeni; dokunma
