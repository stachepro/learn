import { describe, it, expect } from 'vitest'
import { calcSessionsExp, calcHabitExp, calcTotalExp, getLevelFromExp, HABIT_COMPLETION_EXP } from './exp'
import type { DailyLogs, HabitLog, PomodoroSession } from '../types'

function session(xp?: number): PomodoroSession {
  return {
    id: crypto.randomUUID(), habitId: 'h1', date: '2026-07-01',
    workDuration: 25, breakDuration: 5, timestamp: '2026-07-01T09:00:00.000Z',
    ...(xp != null && { xp }),
  }
}

function log(partial: Partial<HabitLog>): HabitLog {
  return { completed: false, boostMode: false, boostUsed: false, notes: '', pomodoroSessions: [], ...partial }
}

function logsOf(habits: Record<string, HabitLog>): DailyLogs {
  return { '2026-07-01': { date: '2026-07-01', habits } }
}

const noProfile = {}
const noFree: PomodoroSession[] = []

describe('calcSessionsExp', () => {
  it('xp alanı olmayan eski oturumları 10 sayar', () => {
    expect(calcSessionsExp([session(), session()])).toBe(20)
  })

  it('boost oturumlarının kendi xp değerini kullanır', () => {
    expect(calcSessionsExp([session(15), session(10)])).toBe(25)
  })
})

describe('calcHabitExp', () => {
  it('tamamlanan alışkanlığa bonus verir', () => {
    expect(calcHabitExp(log({ completed: true }))).toBe(HABIT_COMPLETION_EXP)
  })

  // Regresyon: pomodoro çevirip alışkanlığı bitirmeyen kullanıcı XP'sini kaybediyordu
  it('tamamlanmasa bile oturum XP\'sini sayar', () => {
    expect(calcHabitExp(log({ completed: false, pomodoroSessions: [session(15)] }))).toBe(15)
  })

  it('tamamlama bonusu ile oturum XP\'sini toplar', () => {
    expect(calcHabitExp(log({ completed: true, pomodoroSessions: [session(10), session(15)] }))).toBe(75)
  })
})

describe('calcTotalExp', () => {
  it('boş durumda sıfırdır', () => {
    expect(calcTotalExp({}, noProfile, noFree)).toBe(0)
  })

  it('tüm günlerin ve alışkanlıkların XP\'sini toplar', () => {
    const logs: DailyLogs = {
      '2026-07-01': { date: '2026-07-01', habits: { h1: log({ completed: true }) } },
      '2026-07-02': { date: '2026-07-02', habits: { h1: log({ completed: true }), h2: log({ completed: true }) } },
    }
    expect(calcTotalExp(logs, noProfile, noFree)).toBe(150)
  })

  // Regresyon: serbest pomodoro anında +10 XP veriyor, ama sonraki hesapta
  // formülde yer almadığı için silinip gidiyordu
  it('serbest pomodoro oturumlarını sayar', () => {
    expect(calcTotalExp({}, noProfile, [session(), session(15)])).toBe(25)
  })

  it('Just Start XP\'sini ekler', () => {
    expect(calcTotalExp({}, { justStartXP: 30 }, noFree)).toBe(30)
  })

  // Regresyon: alışkanlık silmek kayıtları temizler ama XP geri alınmamalı
  it('silinen alışkanlıklardan bankaya alınan XP\'yi ekler', () => {
    expect(calcTotalExp({}, { bankedExp: 50 }, noFree)).toBe(50)
  })

  it('silmeden önceki ve sonraki toplam aynı kalır', () => {
    const before = calcTotalExp(logsOf({ h1: log({ completed: true, pomodoroSessions: [session(15)] }) }), noProfile, noFree)
    // deleteHabit kaydı temizler ve aynı miktarı bankaya taşır
    const after = calcTotalExp({}, { bankedExp: before }, noFree)
    expect(before).toBe(65)
    expect(after).toBe(before)
  })

  it('tüm kaynakları birlikte toplar', () => {
    const logs = logsOf({ h1: log({ completed: true, pomodoroSessions: [session(10)] }) })
    expect(calcTotalExp(logs, { justStartXP: 30, bankedExp: 50 }, [session()])).toBe(150)
  })

  it('eski hardMode kaydını okuyabilir', () => {
    const logs = { '2026-07-01': { date: '2026-07-01', habits: { h1: { completed: true, hardMode: true } as unknown as HabitLog } } }
    expect(calcTotalExp(logs, noProfile, noFree)).toBe(HABIT_COMPLETION_EXP)
  })
})

describe('getLevelFromExp', () => {
  it('sıfır XP birinci seviyedir', () => {
    expect(getLevelFromExp(0)).toBe(1)
  })

  it('seviye eşiğinde bir üst seviyeye çıkar', () => {
    expect(getLevelFromExp(199)).toBe(1)
    expect(getLevelFromExp(200)).toBe(2)
  })

  it('XP arttıkça seviye azalmaz', () => {
    let prev = 1
    for (let exp = 0; exp <= 5000; exp += 137) {
      const level = getLevelFromExp(exp)
      expect(level).toBeGreaterThanOrEqual(prev)
      prev = level
    }
  })
})
