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

import { describe as d2, it as i2, expect as e2 } from 'vitest'
import { speakTextFor as stf } from './dictation-session.js'

d2('混合本按词自判语言', () => {
  i2('英文词读英文、中文词读中文', () => {
    e2(stf({ text: 'apple', meaning: '苹果' }, 'mixed', 'spell')).toEqual({ text: 'apple', lang: 'en-US' })
    e2(stf({ text: '葡萄', meaning: '' }, 'mixed', 'spell')).toEqual({ text: '葡萄', lang: 'zh-CN' })
  })
})
