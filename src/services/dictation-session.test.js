import { describe, it, expect } from 'vitest'
import { setSession, getSession, clearSession, speakTextFor } from './dictation-session.js'

describe('dictation session', () => {
  it('存取与清空', () => {
    setSession({ words: [{ id: 'a' }], bookType: 'en', mode: 'spell' })
    expect(getSession().words).toHaveLength(1)
    clearSession()
    expect(getSession()).toBe(null)
  })
})

describe('speakTextFor', () => {
  const w = { text: 'apple', meaning: '苹果' }
  it('中文本读词语', () => {
    expect(speakTextFor({ text: '葡萄' }, 'zh', 'spell')).toEqual({ text: '葡萄', lang: 'zh-CN' })
  })
  it('英文 spell 读英文', () => {
    expect(speakTextFor(w, 'en', 'spell')).toEqual({ text: 'apple', lang: 'en-US' })
  })
  it('英文 meaning 读中文', () => {
    expect(speakTextFor(w, 'en', 'meaning')).toEqual({ text: '苹果', lang: 'zh-CN' })
  })
})
