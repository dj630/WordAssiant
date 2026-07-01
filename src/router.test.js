import { describe, it, expect } from 'vitest'
import { parseRoute } from './router.js'

describe('parseRoute', () => {
  it('空 hash → home', () => {
    expect(parseRoute('')).toEqual({ name: 'home', params: {} })
    expect(parseRoute('#/')).toEqual({ name: 'home', params: {} })
  })
  it('解析带参数路由', () => {
    expect(parseRoute('#/wordbook/abc')).toEqual({ name: 'wordbook', params: { id: 'abc' } })
    expect(parseRoute('#/dictation/abc')).toEqual({ name: 'dictation', params: { id: 'abc' } })
  })
  it('解析简单路由', () => {
    expect(parseRoute('#/wordbooks')).toEqual({ name: 'wordbooks', params: {} })
    expect(parseRoute('#/wrongbook')).toEqual({ name: 'wrongbook', params: {} })
  })
})
