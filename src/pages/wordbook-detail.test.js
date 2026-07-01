// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests, createWordbook, getWordsByBook } from '../db/database.js'

vi.mock('../services/phonetic.js', () => ({
  fetchPhoneticsBatch: vi.fn().mockResolvedValue(new Map([['apple', '/ˈæpəl/']])),
}))

import { renderWordbookDetail } from './wordbook-detail.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('单词本详情', () => {
  it('批量导入预览后入库', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const el = await renderWordbookDetail({ id: wb.id })
    el.querySelector('[name=import-text]').value = 'apple 苹果\nbanana 香蕉'
    el.querySelector('[data-action=preview]').click()
    await new Promise((r) => setTimeout(r, 0))
    expect(el.textContent).toContain('将导入 2')
    el.querySelector('[data-action=confirm-import]').click()
    await new Promise((r) => setTimeout(r, 20))
    const words = await getWordsByBook(wb.id)
    expect(words).toHaveLength(2)
    expect(words.map((w) => w.text).sort()).toEqual(['apple', 'banana'])
  })
})
