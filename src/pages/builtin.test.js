// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('../services/phonetic.js', () => ({
  fetchPhoneticsBatch: vi.fn(async () => new Map()),
}))

import { __resetForTests, getWordbooks, getWordsByBook } from '../db/database.js'
import { renderBuiltin } from './builtin.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('内置词库目录页', () => {
  it('展示分组并能把某单元添加进词库', async () => {
    const el = await renderBuiltin()
    // 4 个分组标题
    expect(el.textContent).toContain('三年级上册')
    expect(el.textContent).toContain('四年级下册')
    // 抽查一本名
    expect(el.textContent).toContain('三上 U1 Making Friends')

    // 添加"三上 U1"（id: pep2024-g3-t1-u1）
    el.querySelector('[data-add="pep2024-g3-t1-u1"]').click()
    await new Promise((r) => setTimeout(r, 30))

    const books = await getWordbooks()
    expect(books).toHaveLength(1)
    expect(books[0].name).toBe('三上 U1 Making Friends')
    expect(books[0].grade).toBe('三年级上册') // 年级+册组合，区分上下册
    expect(books[0].type).toBe('en')
    const words = await getWordsByBook(books[0].id)
    expect(words.length).toBe(17) // 三上 U1 词条数
    expect(words.some((w) => w.text === 'nice' && w.meaning.startsWith('adj.'))).toBe(true)
  })
})
