import { describe, it, expect, vi } from 'vitest'
import { fetchPhonetic, fetchPhoneticsBatch } from './phonetic.js'

function okResponse(body) {
  return { ok: true, json: async () => body }
}

describe('fetchPhonetic', () => {
  it('取顶层 phonetic', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse([{ phonetic: '/ˈæpəl/' }]))
    expect(await fetchPhonetic('apple', fetchFn)).toBe('/ˈæpəl/')
    expect(fetchFn).toHaveBeenCalledWith('https://api.dictionaryapi.dev/api/v2/entries/en/apple')
  })

  it('顶层缺失时从 phonetics[].text 取第一个非空', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      okResponse([{ phonetics: [{ text: '' }, { text: '/kæt/' }] }]),
    )
    expect(await fetchPhonetic('cat', fetchFn)).toBe('/kæt/')
  })

  it('404 / 非数组 返回空串', async () => {
    expect(await fetchPhonetic('zzz', vi.fn().mockResolvedValue({ ok: false }))).toBe('')
    expect(await fetchPhonetic('zzz', vi.fn().mockResolvedValue(okResponse({ title: 'No Definitions' })))).toBe('')
  })

  it('网络异常返回空串', async () => {
    expect(await fetchPhonetic('x', vi.fn().mockRejectedValue(new Error('offline')))).toBe('')
  })

  it('对单词做 URL 编码', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse([{ phonetic: '/p/' }]))
    await fetchPhonetic('a b', fetchFn)
    expect(fetchFn).toHaveBeenCalledWith('https://api.dictionaryapi.dev/api/v2/entries/en/a%20b')
  })
})

describe('fetchPhoneticsBatch', () => {
  it('返回每个词的音标 Map', async () => {
    const fetchFn = vi.fn().mockImplementation((url) =>
      Promise.resolve(okResponse([{ phonetic: '/' + url.split('/').pop() + '/' }])),
    )
    const map = await fetchPhoneticsBatch(['a', 'b', 'c'], { concurrency: 2, fetchFn })
    expect(map.get('a')).toBe('/a/')
    expect(map.get('b')).toBe('/b/')
    expect(map.get('c')).toBe('/c/')
  })
})
