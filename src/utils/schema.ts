/* Kayıtlı verinin sürümü. Bugün tek sürüm var; asıl kazanç ileride:
   veri sürümlenmemişse hangi biçimde olduğunu tahmin etmek zorunda kalırsın.
   Damga bugün bedava, kullanıcılar veri biriktirdikten sonra pahalı. */

export const SCHEMA_VERSION = 2

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

// Yeni bir sürüme geçerken buraya bir adım eklenir; kullanıcının bulunduğu
// sürümden itibaren sırayla çalıştırılır.
export const MIGRATIONS: Migration[] = [
  { to: 2, describe: 'Seri dondurma: mevcut seriden başlangıç hakkı tanı', run: grantInitialFreezes },
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
