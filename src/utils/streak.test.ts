import { describe, it, expect } from 'vitest'
import {
  applyCompletionStreak, isStreakStale, reconcileStreak, getFlameState,
  MAX_STREAK_FREEZES, FREEZE_EARN_DAYS,
} from './streak'
import type { UserProfile } from '../types'

const TODAY = '2026-07-10'
const YESTERDAY = '2026-07-09'

function profile(partial: Partial<UserProfile> = {}): UserProfile {
  return {
    username: 'Test', streak: 0, longestStreak: 0, totalExp: 0,
    level: 1, badges: [], lastActiveDate: '', ...partial,
  }
}

describe('applyCompletionStreak', () => {
  it('ilk tamamlamada seriyi 1 yapar', () => {
    const p = applyCompletionStreak(profile(), TODAY, YESTERDAY)
    expect(p.streak).toBe(1)
    expect(p.lastActiveDate).toBe(TODAY)
  })

  it('dün de aktifse seriyi sürdürür', () => {
    const p = applyCompletionStreak(profile({ streak: 5, longestStreak: 5, lastActiveDate: YESTERDAY }), TODAY, YESTERDAY)
    expect(p.streak).toBe(6)
    expect(p.longestStreak).toBe(6)
  })

  it('araya boş gün girdiyse seriyi 1\'e döndürür', () => {
    const p = applyCompletionStreak(profile({ streak: 9, longestStreak: 9, lastActiveDate: '2026-07-05' }), TODAY, YESTERDAY)
    expect(p.streak).toBe(1)
    expect(p.longestStreak).toBe(9)  // rekor korunur
  })

  it('aynı gün ikinci tamamlamada seriyi artırmaz', () => {
    const already = profile({ streak: 3, longestStreak: 3, lastActiveDate: TODAY })
    expect(applyCompletionStreak(already, TODAY, YESTERDAY)).toBe(already)
  })

  // Kural: tamamlamayı geri almak günü seriden düşürmez. Geri alma lastActiveDate'i
  // değiştirmediği için, aynı gün tekrar tamamlandığında seri ikinci kez artmaz.
  it('geri al + tekrar tamamla seriyi şişirmez', () => {
    const afterFirst = applyCompletionStreak(profile({ lastActiveDate: YESTERDAY, streak: 2, longestStreak: 2 }), TODAY, YESTERDAY)
    expect(afterFirst.streak).toBe(3)
    // geri alma profile'a dokunmaz; kullanıcı tekrar tamamlar
    const afterRedo = applyCompletionStreak(afterFirst, TODAY, YESTERDAY)
    expect(afterRedo.streak).toBe(3)
  })

  it('rekorun altındaki seri rekoru düşürmez', () => {
    const p = applyCompletionStreak(profile({ streak: 0, longestStreak: 40, lastActiveDate: '' }), TODAY, YESTERDAY)
    expect(p.streak).toBe(1)
    expect(p.longestStreak).toBe(40)
  })

  it('girdi profilini değiştirmez', () => {
    const original = profile({ streak: 1, lastActiveDate: YESTERDAY })
    applyCompletionStreak(original, TODAY, YESTERDAY)
    expect(original.streak).toBe(1)
    expect(original.lastActiveDate).toBe(YESTERDAY)
  })

  /* ── Dondurma kazanımı ── */

  it('her aktif gün dondurma sayacını 1 ilerletir', () => {
    const p = applyCompletionStreak(profile({ lastActiveDate: YESTERDAY, streak: 3, freezeProgress: 2 }), TODAY, YESTERDAY)
    expect(p.freezeProgress).toBe(3)
    expect(p.streakFreezes).toBe(0)
  })

  it(`${FREEZE_EARN_DAYS}. kesintisiz günde +1 dondurma verir ve sayacı sıfırlar`, () => {
    const p = applyCompletionStreak(
      profile({ lastActiveDate: YESTERDAY, streak: 6, freezeProgress: FREEZE_EARN_DAYS - 1 }),
      TODAY, YESTERDAY,
    )
    expect(p.streakFreezes).toBe(1)
    expect(p.freezeProgress).toBe(0)
  })

  it(`haklar doluyken (${MAX_STREAK_FREEZES}/${MAX_STREAK_FREEZES}) sayaç ilerlemez`, () => {
    const p = applyCompletionStreak(
      profile({ lastActiveDate: YESTERDAY, streak: 30, streakFreezes: MAX_STREAK_FREEZES, freezeProgress: 4 }),
      TODAY, YESTERDAY,
    )
    expect(p.streakFreezes).toBe(MAX_STREAK_FREEZES)
    expect(p.freezeProgress).toBe(4)
  })

  it('seri koptuğunda sayaç sıfırdan başlar ama eldeki haklar korunur', () => {
    const p = applyCompletionStreak(
      profile({ lastActiveDate: '2026-07-05', streak: 9, streakFreezes: 2, freezeProgress: 5 }),
      TODAY, YESTERDAY,
    )
    expect(p.streak).toBe(1)
    expect(p.streakFreezes).toBe(2)
    expect(p.freezeProgress).toBe(1)  // bugün sayılır
  })
})

describe('reconcileStreak', () => {
  it('bugün ya da dün aktifse dokunmaz', () => {
    expect(reconcileStreak(profile({ lastActiveDate: TODAY, streak: 4 }), TODAY, YESTERDAY).changed).toBe(false)
    expect(reconcileStreak(profile({ lastActiveDate: YESTERDAY, streak: 4 }), TODAY, YESTERDAY).changed).toBe(false)
  })

  it('hiç aktif gün yoksa dokunmaz', () => {
    expect(reconcileStreak(profile(), TODAY, YESTERDAY).changed).toBe(false)
  })

  it('1 kaçırılan günü 1 dondurmayla kapatır, seri sayısı değişmez', () => {
    const r = reconcileStreak(
      profile({ lastActiveDate: '2026-07-08', streak: 7, streakFreezes: 2 }),
      TODAY, YESTERDAY,
    )
    expect(r.changed).toBe(true)
    expect(r.freezesSpent).toBe(1)
    expect(r.streakBroken).toBe(false)
    expect(r.profile.streak).toBe(7)
    expect(r.profile.streakFreezes).toBe(1)
    expect(r.profile.frozenDates).toEqual([YESTERDAY])
    expect(r.profile.lastActiveDate).toBe(YESTERDAY)
  })

  it('2 kaçırılan gün 2 dondurma harcar', () => {
    const r = reconcileStreak(
      profile({ lastActiveDate: '2026-07-07', streak: 10, streakFreezes: 3 }),
      TODAY, YESTERDAY,
    )
    expect(r.freezesSpent).toBe(2)
    expect(r.profile.streakFreezes).toBe(1)
    expect(r.profile.frozenDates).toEqual(['2026-07-08', '2026-07-09'])
    expect(r.profile.streak).toBe(10)
  })

  it('hak yetmezse hiç harcamaz, seri sıfırlanır, haklar cepte kalır', () => {
    const r = reconcileStreak(
      profile({ lastActiveDate: '2026-07-06', streak: 12, streakFreezes: 2, freezeProgress: 5 }),
      TODAY, YESTERDAY,
    )
    expect(r.streakBroken).toBe(true)
    expect(r.freezesSpent).toBe(0)
    expect(r.profile.streak).toBe(0)
    expect(r.profile.streakFreezes).toBe(2)
    expect(r.profile.freezeProgress).toBe(0)
  })

  it('dondurmayla kurtarılan seri ertesi tamamlamada normal devam eder', () => {
    const saved = reconcileStreak(
      profile({ lastActiveDate: '2026-07-08', streak: 7, streakFreezes: 1 }),
      TODAY, YESTERDAY,
    ).profile
    const p = applyCompletionStreak(saved, TODAY, YESTERDAY)
    expect(p.streak).toBe(8)
  })

  it('dondurulan gün kazanım sayacını ilerletmez', () => {
    const saved = reconcileStreak(
      profile({ lastActiveDate: '2026-07-08', streak: 7, streakFreezes: 1, freezeProgress: 3 }),
      TODAY, YESTERDAY,
    ).profile
    expect(saved.freezeProgress ?? 3).toBe(3)
    const p = applyCompletionStreak(saved, TODAY, YESTERDAY)
    expect(p.freezeProgress).toBe(4)  // yalnızca bugünkü gerçek tamamlama saydı
  })

  it('seri zaten 0 ise tekrar tekrar değişiklik üretmez', () => {
    const r = reconcileStreak(
      profile({ lastActiveDate: '2026-07-01', streak: 0, streakFreezes: 1 }),
      TODAY, YESTERDAY,
    )
    expect(r.changed).toBe(false)
  })
})

describe('getFlameState', () => {
  it('bugün aktifse alev yanar', () => {
    expect(getFlameState(profile({ lastActiveDate: TODAY, streak: 3 }), TODAY, YESTERDAY)).toBe('lit')
  })

  it('seri yoksa alev söner', () => {
    expect(getFlameState(profile(), TODAY, YESTERDAY)).toBe('out')
    expect(getFlameState(profile({ lastActiveDate: '2026-07-01', streak: 0 }), TODAY, YESTERDAY)).toBe('out')
  })

  it('dün donduruldu + bugün henüz yapılmadıysa buzlu alev', () => {
    const p = profile({ lastActiveDate: YESTERDAY, streak: 7, frozenDates: [YESTERDAY] })
    expect(getFlameState(p, TODAY, YESTERDAY)).toBe('frozen')
  })

  it('seri sağlam ama bugün henüz yapılmadıysa sönük bekler', () => {
    expect(getFlameState(profile({ lastActiveDate: YESTERDAY, streak: 7 }), TODAY, YESTERDAY)).toBe('pending')
  })

  it('bugün tamamlanınca buzlu alev tekrar yanar', () => {
    const p = profile({ lastActiveDate: TODAY, streak: 8, frozenDates: [YESTERDAY] })
    expect(getFlameState(p, TODAY, YESTERDAY)).toBe('lit')
  })
})

describe('isStreakStale', () => {
  it('hiç aktif gün yoksa bayat değildir', () => {
    expect(isStreakStale(profile(), TODAY, YESTERDAY)).toBe(false)
  })

  it('bugün ya da dün aktifse bayat değildir', () => {
    expect(isStreakStale(profile({ lastActiveDate: TODAY }), TODAY, YESTERDAY)).toBe(false)
    expect(isStreakStale(profile({ lastActiveDate: YESTERDAY }), TODAY, YESTERDAY)).toBe(false)
  })

  it('dünden eskiyse bayattır', () => {
    expect(isStreakStale(profile({ lastActiveDate: '2026-07-08' }), TODAY, YESTERDAY)).toBe(true)
  })
})
