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

  it('内置词库入口跳转 #/builtin', async () => {
    const el = await renderWordbooks()
    const btn = el.querySelector('[data-action=builtin]')
    expect(btn).not.toBeNull()
    btn.click()
    expect(location.hash).toBe('#/builtin')
  })

  it('按年级+册筛选（区分上下册）只显示该分类的单词本', async () => {
    // 建三上、三下、四上各一本 + 一本未分类
    const { createWordbook } = await import('../db/database.js')
    await createWordbook({ name: '三上 U1 A', type: 'en', grade: '三年级上册' })
    await createWordbook({ name: '三下 U1 B', type: 'en', grade: '三年级下册' })
    await createWordbook({ name: '四上 U1 C', type: 'en', grade: '四年级上册' })
    await createWordbook({ name: '自建 D', type: 'zh' }) // 未分类

    const el = await renderWordbooks()
    // 点"三年级上册"筛选块
    el.querySelector('[data-grade-filter="三年级上册"]').click()
    await new Promise((r) => setTimeout(r, 0))
    const list = el.querySelector('#wb-list')
    expect(list.textContent).toContain('三上 U1 A')
    expect(list.textContent).not.toContain('三下 U1 B') // 区分上下册
    expect(list.textContent).not.toContain('四上 U1 C')
    expect(list.textContent).not.toContain('自建 D')
  })
})
