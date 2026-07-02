// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('../services/tts.js', () => ({ speak: vi.fn() }))

import { __resetForTests, createWordbook, addWords, getWordsByBook } from '../db/database.js'
import { setSession } from '../services/dictation-session.js'
import { renderDictation } from './dictation.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
  // 冻结系统日期为 2026-06-29，使 finish() 内部 todayStr() 的结果与用例断言
  // （dueDate: '2026-06-30'）保持确定性，不依赖测试实际运行的自然日。
  // 仅伪造 Date，不伪造计时器，避免影响用例中真实的 setTimeout 等待。
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 5, 29))
  // jsdom 未实现 window.confirm，默认桩为 false 以保持输出纯净；需要重练的用例自行覆盖。
  vi.spyOn(window, 'confirm').mockReturnValue(false)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('听写进行与核对', () => {
  it('进行页不显示答案，核对后写回复习状态', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const words = await addWords(wb.id, [{ text: 'apple', meaning: '苹果' }], '2026-06-29')
    setSession({ words, bookType: 'en', mode: 'spell', autoPlay: false, interval: 8 })

    const el = await renderDictation({ id: wb.id })
    // 进行页不出现答案
    expect(el.textContent).not.toContain('apple')
    // 走到核对
    el.querySelector('[data-action=next]').click()
    await new Promise((r) => setTimeout(r, 0))
    expect(el.textContent).toContain('apple') // 核对页显示答案
    // 标错
    el.querySelector('[data-mark="wrong"]').click()
    el.querySelector('[data-action=finish]').click()
    await new Promise((r) => setTimeout(r, 20))

    const after = await getWordsByBook(wb.id)
    expect(after[0].isWrong).toBe(1)
    expect(after[0].dueDate).toBe('2026-06-30')
  })

  it('确认重练错词时就地重开一轮只含错词', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const words = await addWords(
      wb.id,
      [{ text: 'apple', meaning: '苹果' }, { text: 'cat', meaning: '猫' }],
      '2026-06-29',
    )
    setSession({ words, bookType: 'en', mode: 'spell', autoPlay: false, interval: 8 })
    window.confirm.mockReturnValue(true)

    const el = await renderDictation({ id: wb.id })
    // apple(进行) → cat(进行) → 核对
    el.querySelector('[data-action=next]').click()
    await new Promise((r) => setTimeout(r, 0))
    el.querySelector('[data-action=next]').click()
    await new Promise((r) => setTimeout(r, 0))
    // 只标 apple 错
    el.querySelectorAll('[data-mark="wrong"]')[0].click()
    el.querySelector('[data-action=finish]').click()
    await new Promise((r) => setTimeout(r, 20))

    // 就地回到进行页，且只剩 1 个词（错词 apple）
    expect(el.querySelector('[data-action=next]')).not.toBeNull()
    expect(el.textContent).toContain('第 1 / 1')
  })
})
