// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests, createWordbook, addWords, getAllData } from '../db/database.js'
import { applyImportText } from './backup-section.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('备份导入', () => {
  it('applyImportText 覆盖写入数据', async () => {
    await createWordbook({ name: '旧', type: 'en' })
    const json = JSON.stringify({
      version: 1, exportedAt: '2026-06-29',
      wordbooks: [{ id: 'b1', name: '新', type: 'zh', createdAt: 1 }],
      words: [],
    })
    await applyImportText(json)
    const { wordbooks } = await getAllData()
    expect(wordbooks).toHaveLength(1)
    expect(wordbooks[0].name).toBe('新')
  })
})
