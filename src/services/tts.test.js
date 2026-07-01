import { describe, it, expect, vi } from 'vitest'
import { pickVoice, speak, checkVoiceAvailability } from './tts.js'

const voices = [
  { lang: 'en-US', name: 'US' },
  { lang: 'en-GB', name: 'GB' },
  { lang: 'zh-CN', name: 'CN' },
]

describe('pickVoice', () => {
  it('精确匹配优先', () => {
    expect(pickVoice(voices, 'en-US').name).toBe('US')
    expect(pickVoice(voices, 'zh-CN').name).toBe('CN')
  })
  it('退化为语言前缀匹配', () => {
    expect(pickVoice(voices, 'en-AU').name).toBe('US')
  })
  it('无匹配返回 null', () => {
    expect(pickVoice(voices, 'fr-FR')).toBe(null)
  })
})

describe('checkVoiceAvailability', () => {
  it('检测中英文可用性', () => {
    expect(checkVoiceAvailability(voices)).toEqual({ en: true, zh: true })
    expect(checkVoiceAvailability([{ lang: 'en-US' }])).toEqual({ en: true, zh: false })
  })
})

describe('speak', () => {
  it('先 cancel 再 speak，并设置语言/音色', () => {
    const synth = { cancel: vi.fn(), speak: vi.fn(), getVoices: () => voices }
    const utterances = []
    class FakeUtterance {
      constructor(text) { this.text = text; utterances.push(this) }
    }
    speak('apple', 'en-US', synth, FakeUtterance)
    expect(synth.cancel).toHaveBeenCalled()
    expect(synth.speak).toHaveBeenCalled()
    expect(utterances[0].text).toBe('apple')
    expect(utterances[0].lang).toBe('en-US')
    expect(utterances[0].voice.name).toBe('US')
  })
})
