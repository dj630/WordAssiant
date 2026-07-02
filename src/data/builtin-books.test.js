import { describe, it, expect } from 'vitest'
import { BUILTIN_BOOKS } from './builtin-books.js'

describe('内置单词本数据', () => {
  it('恰好 24 本、486 词条', () => {
    expect(BUILTIN_BOOKS).toHaveLength(24)
    const total = BUILTIN_BOOKS.reduce((a, b) => a + b.entries.length, 0)
    expect(total).toBe(486)
  })

  it('id 唯一', () => {
    const ids = new Set(BUILTIN_BOOKS.map((b) => b.id))
    expect(ids.size).toBe(24)
  })

  it('每本均为英文本、年级合法、词条齐全', () => {
    for (const b of BUILTIN_BOOKS) {
      expect(b.type).toBe('en')
      expect(['三年级', '四年级']).toContain(b.grade)
      expect(b.entries.length).toBeGreaterThan(0)
      for (const e of b.entries) {
        expect(e.text.trim()).not.toBe('')
        expect(e.meaning.trim()).not.toBe('')
      }
    }
  })

  it('命名格式抽查', () => {
    const first = BUILTIN_BOOKS.find((b) => b.id === 'pep2024-g3-t1-u1')
    expect(first.name).toBe('三上 U1 Making Friends')
    expect(first.unitZh).toBe('交朋友')
  })
})
