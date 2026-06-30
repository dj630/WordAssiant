import { newReviewState } from '../services/review.js'

const DB_NAME = 'word-dictation'
const DB_VERSION = 1
let dbPromise = null
let _currentDb = null

export function __resetForTests() {
  if (_currentDb) {
    _currentDb.close()
    _currentDb = null
  }
  dbPromise = null
}

export function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('wordbooks')) {
        db.createObjectStore('wordbooks', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('words')) {
        const store = db.createObjectStore('words', { keyPath: 'id' })
        store.createIndex('wordbookId', 'wordbookId', { unique: false })
        store.createIndex('dueDate', 'dueDate', { unique: false })
        store.createIndex('isWrong', 'isWrong', { unique: false })
      }
    }
    req.onsuccess = () => {
      _currentDb = req.result
      _currentDb.onversionchange = () => {
        _currentDb.close()
        _currentDb = null
        dbPromise = null
      }
      resolve(_currentDb)
    }
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(db, stores, mode) {
  return db.transaction(stores, mode)
}

function reqPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function txDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function createWordbook({ name, type }) {
  const db = await openDB()
  const wb = { id: crypto.randomUUID(), name, type, createdAt: Date.now() }
  const t = tx(db, ['wordbooks'], 'readwrite')
  t.objectStore('wordbooks').add(wb)
  await txDone(t)
  return wb
}

export async function getWordbooks() {
  const db = await openDB()
  return reqPromise(tx(db, ['wordbooks'], 'readonly').objectStore('wordbooks').getAll())
}

export async function deleteWordbook(id) {
  const db = await openDB()
  const t = tx(db, ['wordbooks', 'words'], 'readwrite')
  t.objectStore('wordbooks').delete(id)
  const idx = t.objectStore('words').index('wordbookId')
  const keysReq = idx.getAllKeys(IDBKeyRange.only(id))
  keysReq.onsuccess = () => {
    for (const key of keysReq.result) t.objectStore('words').delete(key)
  }
  await txDone(t)
}

export async function addWords(wordbookId, entries, today) {
  const db = await openDB()
  const t = tx(db, ['words'], 'readwrite')
  const store = t.objectStore('words')
  const created = entries.map((e) => ({
    id: crypto.randomUUID(),
    wordbookId,
    text: e.text,
    meaning: e.meaning || '',
    pinyin: e.pinyin || '',
    phonetic: e.phonetic || '',
    createdAt: Date.now(),
    ...newReviewState(today),
  }))
  for (const w of created) store.add(w)
  await txDone(t)
  return created
}

export async function getWordsByBook(wordbookId) {
  const db = await openDB()
  const idx = tx(db, ['words'], 'readonly').objectStore('words').index('wordbookId')
  return reqPromise(idx.getAll(IDBKeyRange.only(wordbookId)))
}

export async function updateWord(word) {
  const db = await openDB()
  const t = tx(db, ['words'], 'readwrite')
  t.objectStore('words').put(word)
  await txDone(t)
}

export async function deleteWord(id) {
  const db = await openDB()
  const t = tx(db, ['words'], 'readwrite')
  t.objectStore('words').delete(id)
  await txDone(t)
}

export async function getDueWords(today) {
  const db = await openDB()
  const idx = tx(db, ['words'], 'readonly').objectStore('words').index('dueDate')
  const all = await reqPromise(idx.getAll(IDBKeyRange.upperBound(today)))
  return all
}

export async function getWrongWords() {
  const db = await openDB()
  const idx = tx(db, ['words'], 'readonly').objectStore('words').index('isWrong')
  return reqPromise(idx.getAll(IDBKeyRange.only(1)))
}

export async function getAllData() {
  const db = await openDB()
  const t = tx(db, ['wordbooks', 'words'], 'readonly')
  const wordbooks = await reqPromise(t.objectStore('wordbooks').getAll())
  const words = await reqPromise(t.objectStore('words').getAll())
  return { wordbooks, words }
}

export async function replaceAllData({ wordbooks, words }) {
  const db = await openDB()
  const t = tx(db, ['wordbooks', 'words'], 'readwrite')
  t.objectStore('wordbooks').clear()
  t.objectStore('words').clear()
  for (const wb of wordbooks) t.objectStore('wordbooks').add(wb)
  for (const w of words) t.objectStore('words').add(w)
  await txDone(t)
}
