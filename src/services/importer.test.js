import { describe, it, expect } from 'vitest'
import { parseImport } from './importer.js'

describe('parseImport 英文本', () => {
  it('支持 Tab / 逗号 / 中文逗号 / 中文起始切分，含带空格短语', () => {
    const text = [
      'apple\t苹果',
      'banana，香蕉',
      'cat,猫',
      'go to school 去上学',
      'hello',
      '',
      '   ',
    ].join('\n')
    const { entries, skipped } = parseImport(text, 'en')
    expect(entries).toEqual([
      { text: 'apple', meaning: '苹果', pinyin: '' },
      { text: 'banana', meaning: '香蕉', pinyin: '' },
      { text: 'cat', meaning: '猫', pinyin: '' },
      { text: 'go to school', meaning: '去上学', pinyin: '' },
      { text: 'hello', meaning: '', pinyin: '' },
    ])
    expect(skipped).toBe(2)
  })
})

describe('parseImport 中文本', () => {
  it('词语 + 可选拼音', () => {
    const text = ['葡萄', '美丽  měi lì', '朋友,péng you'].join('\n')
    const { entries } = parseImport(text, 'zh')
    expect(entries).toEqual([
      { text: '葡萄', meaning: '', pinyin: '' },
      { text: '美丽', meaning: '', pinyin: 'měi lì' },
      { text: '朋友', meaning: '', pinyin: 'péng you' },
    ])
  })
})
