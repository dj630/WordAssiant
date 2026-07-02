// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests, createWordbook, addWords } from '../db/database.js'
import { getSession } from '../services/dictation-session.js'
import { renderDictationSetup } from './dictation-setup.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('听写设置', () => {
  it('整本开始建立会话', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    await addWords(wb.id, [{ text: 'apple', meaning: '苹果' }, { text: 'cat', meaning: '猫' }], '2026-06-29')
    const el = await renderDictationSetup({ id: wb.id })
    el.querySelector('[data-action=start]').click()
    await new Promise((r) => setTimeout(r, 10))
    const s = getSession()
    expect(s.words).toHaveLength(2)
    expect(s.bookType).toBe('en')
    expect(s.mode).toBe('spell')
  })

  it('间隔超出 5–20 时被夹取', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    await addWords(wb.id, [{ text: 'apple', meaning: '苹果' }], '2026-06-29')
    const el = await renderDictationSetup({ id: wb.id })
    el.querySelector('[name=interval]').value = '999'
    el.querySelector('[data-action=start]').click()
    await new Promise((r) => setTimeout(r, 10))
    expect(getSession().interval).toBe(20)

    const el2 = await renderDictationSetup({ id: wb.id })
    el2.querySelector('[name=interval]').value = '1'
    el2.querySelector('[data-action=start]').click()
    await new Promise((r) => setTimeout(r, 10))
    expect(getSession().interval).toBe(5)
  })
})
