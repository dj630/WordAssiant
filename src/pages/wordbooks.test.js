// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests } from '../db/database.js'
import { renderWordbooks } from './wordbooks.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('单词本页', () => {
  it('空状态显示引导', async () => {
    const el = await renderWordbooks()
    expect(el.textContent).toContain('还没有单词本')
  })

  it('能新建并显示单词本', async () => {
    const el = await renderWordbooks()
    el.querySelector('[name=wb-name]').value = '五年级上 U3'
    el.querySelector('[name=wb-type]').value = 'en'
    el.querySelector('[data-action=create]').click()
    await new Promise((r) => setTimeout(r, 10))
    expect(el.textContent).toContain('五年级上 U3')
  })
})
