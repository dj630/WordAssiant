import { BUILTIN_BOOKS } from '../data/builtin-books.js'
import { createWordbook, addWords, getWordbooks, updateWord } from '../db/database.js'
import { fetchPhoneticsBatch } from '../services/phonetic.js'
import { todayStr } from '../utils/dates.js'
import { renderNav } from '../components/nav.js'

const GROUPS = [
  { grade: '三年级', term: '上册' },
  { grade: '三年级', term: '下册' },
  { grade: '四年级', term: '上册' },
  { grade: '四年级', term: '下册' },
]

export async function renderBuiltin() {
  const el = document.createElement('div')
  const existingNames = new Set((await getWordbooks()).map((b) => b.name))

  const groupsHtml = GROUPS.map((g) => {
    const rows = BUILTIN_BOOKS
      .filter((b) => b.grade === g.grade && b.term === g.term)
      .map((b) => `<div class="card">
        <div class="row">
          <span><strong>${b.name}</strong> <span class="muted">${b.unitZh} · ${b.entries.length} 词</span></span>
          <button data-add="${b.id}" style="flex:0 0 auto">${existingNames.has(b.name) ? '再加一次' : '添加到我的词库'}</button>
        </div>
      </div>`).join('')
    return `<h3>${g.grade}${g.term}</h3>${rows}`
  }).join('')

  el.innerHTML = `
    <h1 class="page-title">内置词库 · 人教版2024</h1>
    <p class="muted">点"添加到我的词库"把某单元存为一本单词本，可直接听写与复习。</p>
    ${groupsHtml}
  `

  async function addBook(btn) {
    const book = BUILTIN_BOOKS.find((b) => b.id === btn.dataset.add)
    if (!book) return
    btn.disabled = true
    btn.textContent = '添加中…'
    let added
    try {
      // grade 存"年级+册"组合值（如 三年级上册），供单词本页按上下册筛选
      const wb = await createWordbook({ name: book.name, type: 'en', grade: book.grade + book.term })
      added = await addWords(wb.id, book.entries, todayStr())
    } catch {
      // 建本/写词失败：恢复按钮，允许重试
      btn.disabled = false
      btn.textContent = '添加失败，重试'
      return
    }
    // 数据已持久化，立即反馈；音标在后台回填
    btn.textContent = '已添加 ✓'
    backfillPhonetics(added)
  }

  // 英文音标回填；短语查不到或离线则留空，不阻塞，失败静默
  async function backfillPhonetics(words) {
    try {
      const map = await fetchPhoneticsBatch(words.map((w) => w.text))
      for (const w of words) {
        const ph = map.get(w.text)
        if (ph) await updateWord({ ...w, phonetic: ph })
      }
    } catch { /* 忽略网络失败 */ }
  }

  el.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => addBook(btn))
  })

  el.appendChild(renderNav('wordbooks'))
  return el
}
