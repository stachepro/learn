import { describe, it, expect } from 'vitest'
import { appendCrash, toCrashEntry, type CrashEntry } from './errorReporting'

const entry = (message: string): CrashEntry => ({
  id: crypto.randomUUID(), at: new Date().toISOString(), message, source: 'render',
})

describe('appendCrash', () => {
  it('en yeni kaydı başa koyar', () => {
    const list = appendCrash([entry('eski')], entry('yeni'))
    expect(list.map((c) => c.message)).toEqual(['yeni', 'eski'])
  })

  it('sınırı aşan eski kayıtları atar', () => {
    let list: CrashEntry[] = []
    for (let i = 1; i <= 5; i++) list = appendCrash(list, entry(`hata${i}`), 3)
    expect(list.map((c) => c.message)).toEqual(['hata5', 'hata4', 'hata3'])
  })

  it('girdi listesini değiştirmez', () => {
    const original = [entry('a')]
    appendCrash(original, entry('b'))
    expect(original).toHaveLength(1)
  })
})

describe('toCrashEntry', () => {
  it('Error nesnesinden mesaj ve yığın alır', () => {
    const e = toCrashEntry(new Error('patladı'), 'render')
    expect(e.message).toBe('patladı')
    expect(e.stack).toBeTruthy()
    expect(e.source).toBe('render')
  })

  // Reddedilen promise'ler ve throw edilen dizeler Error olmayabilir
  it('Error olmayan değerleri dizeye çevirir', () => {
    expect(toCrashEntry('düz metin hata', 'promise').message).toBe('düz metin hata')
    expect(toCrashEntry(undefined, 'window').message).toBe('undefined')
  })

  it('componentStack verilirse taşır, verilmezse alanı hiç eklemez', () => {
    expect(toCrashEntry(new Error('x'), 'render', '  at Foo').componentStack).toBe('  at Foo')
    expect('componentStack' in toCrashEntry(new Error('x'), 'render')).toBe(false)
  })
})
