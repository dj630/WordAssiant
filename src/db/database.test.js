// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  createWordbook, getWordbooks, deleteWordbook,
  addWords, getWordsByBook, updateWord,
  getDueWords, getWrongWords, getAllData, replaceAllData, __resetForTests,
} from './database.js'

beforeEach(async () => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('database', () => {
  it('创建并读取单词本', async () => {
    const wb = await createWordbook({ name: '本A', type: 'en' })
    expect(wb.id).toBeTruthy()
    const all = await getWordbooks()
    expect(all).toHaveLength(1)
    expect(all[0].name).toBe('本A')
  })

  it('加词带复习初始态，按本读取', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const added = await addWords(wb.id, [{ text: 'apple', meaning: '苹果', pinyin: '' }], '2026-06-29')
    expect(added[0]).toMatchObject({
      wordbookId: wb.id, text: 'apple', level: 0, dueDate: '2026-06-29', isWrong: 0,
    })
    const list = await getWordsByBook(wb.id)
    expect(list).toHaveLength(1)
  })

  it('getDueWords 只返回到期词', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const [w] = await addWords(wb.id, [{ text: 'a', meaning: '', pinyin: '' }], '2026-06-29')
    await updateWord({ ...w, dueDate: '2026-07-10' })
    expect(await getDueWords('2026-06-29')).toHaveLength(0)
    expect(await getDueWords('2026-07-10')).toHaveLength(1)
  })

  it('getWrongWords 只返回错词', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const [w] = await addWords(wb.id, [{ text: 'a', meaning: '', pinyin: '' }], '2026-06-29')
    expect(await getWrongWords()).toHaveLength(0)
    await updateWord({ ...w, isWrong: 1 })
    expect(await getWrongWords()).toHaveLength(1)
  })

  it('删本级联删词', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    await addWords(wb.id, [{ text: 'a', meaning: '', pinyin: '' }], '2026-06-29')
    await deleteWordbook(wb.id)
    expect(await getWordbooks()).toHaveLength(0)
    expect(await getWordsByBook(wb.id)).toHaveLength(0)
  })

  it('replaceAllData 覆盖现有数据', async () => {
    const wb = await createWordbook({ name: '旧', type: 'en' })
    await addWords(wb.id, [{ text: 'old', meaning: '', pinyin: '' }], '2026-06-29')
    await replaceAllData({
      wordbooks: [{ id: 'b9', name: '新', type: 'zh', createdAt: 1 }],
      words: [{ id: 'w9', wordbookId: 'b9', text: '新', meaning: '', pinyin: '', level: 0, dueDate: '2026-06-29', isWrong: 0, lastReviewedAt: null, createdAt: 1 }],
    })
    const { wordbooks, words } = await getAllData()
    expect(wordbooks).toHaveLength(1)
    expect(wordbooks[0].name).toBe('新')
    expect(words).toHaveLength(1)
  })
})

describe('createWordbook grade 字段', () => {
  it('存储传入的 grade', async () => {
    const wb = await createWordbook({ name: '三上 U1 X', type: 'en', grade: '三上' })
    const books = await getWordbooks()
    expect(books.find((b) => b.id === wb.id).grade).toBe('三上')
  })

  it('未传 grade 时缺省为空串', async () => {
    const wb = await createWordbook({ name: '自建', type: 'zh' })
    const books = await getWordbooks()
    expect(books.find((b) => b.id === wb.id).grade).toBe('')
  })
})
