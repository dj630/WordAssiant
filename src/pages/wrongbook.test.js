// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests, createWordbook, addWords, updateWord, getWordsByBook } from '../db/database.js'
import { renderWrongbook } from './wrongbook.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('错词本页', () => {
  it('显示错词数量', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const [w] = await addWords(wb.id, [{ text: 'apple', meaning: '苹果' }], '2026-06-29')
    await updateWord({ ...w, isWrong: 1 })
    const el = await renderWrongbook()
    expect(el.textContent).toContain('共 1 个错词')
    expect(el.textContent).toContain('apple')
  })
})
