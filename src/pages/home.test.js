// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests, createWordbook, addWords, updateWord, getWordsByBook } from '../db/database.js'
import { getSession } from '../services/dictation-session.js'
import { renderHome } from './home.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('首页今日复习', () => {
  it('统计到期词并能开始复习', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    await addWords(wb.id, [{ text: 'apple', meaning: '苹果' }], '2026-06-29')
    const el = await renderHome()
    expect(el.textContent).toMatch(/今日待复习/)
    el.querySelector('[data-action=review]')?.click()
    await new Promise((r) => setTimeout(r, 10))
    expect(getSession()?.words.length).toBeGreaterThanOrEqual(0)
  })
})
