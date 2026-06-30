import { describe, it, expect } from 'vitest'
import { buildBackup, serializeBackup, parseBackup } from './backup.js'

const wbs = [{ id: 'b1', name: '本', type: 'en', createdAt: 1 }]
const ws = [{ id: 'w1', wordbookId: 'b1', text: 'apple', meaning: '苹果' }]

describe('backup', () => {
  it('buildBackup 带版本与时间', () => {
    expect(buildBackup(wbs, ws, '2026-06-29')).toEqual({
      version: 1, exportedAt: '2026-06-29', wordbooks: wbs, words: ws,
    })
  })

  it('序列化后能解析回来', () => {
    const json = serializeBackup(wbs, ws, '2026-06-29')
    expect(parseBackup(json)).toEqual({ wordbooks: wbs, words: ws })
  })

  it('非法 JSON 抛错', () => {
    expect(() => parseBackup('{ not json')).toThrow()
  })

  it('结构缺字段抛错', () => {
    expect(() => parseBackup(JSON.stringify({ version: 1 }))).toThrow(/格式/)
  })
})
