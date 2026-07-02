import {
  getWordbooks, getWordsByBook, addWords, deleteWord, deleteWordbook, updateWord,
} from '../db/database.js'
import { parseImport } from '../services/importer.js'
import { fetchPhoneticsBatch } from '../services/phonetic.js'
import { todayStr } from '../utils/dates.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'

function wordLine(w, isEn) {
  const ph = isEn && w.phonetic ? ` <span class="muted">${w.phonetic}</span>` : ''
  const sub = isEn ? w.meaning : w.pinyin
  return `<div class="card word-item" data-id="${w.id}">
    <div class="row"><span><strong>${w.text}</strong>${ph} <span class="muted">${sub || ''}</span></span>
    <button class="secondary" data-del="${w.id}" style="flex:0 0 auto">删</button></div>
  </div>`
}

export async function renderWordbookDetail({ id }) {
  const el = document.createElement('div')
  const wb = (await getWordbooks()).find((b) => b.id === id)
  if (!wb) {
    el.innerHTML = '<p>单词本不存在</p>'
    el.appendChild(renderNav('wordbooks'))
    return el
  }
  const isEn = wb.type === 'en'

  async function refreshList() {
    const words = await getWordsByBook(id)
    el.querySelector('#word-list').innerHTML = words.length
      ? words.map((w) => wordLine(w, isEn)).join('')
      : '<p class="muted">本词本还没有单词。</p>'
    el.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        await deleteWord(btn.dataset.del)
        await refreshList()
      })
    })
    el.querySelector('#word-count').textContent = words.length
  }

  el.innerHTML = `
    <h1 class="page-title">${wb.name}（${isEn ? '英文' : '中文'}）</h1>
    <div class="row">
      <button data-action="start">开始听写</button>
      <button class="danger" data-action="del-book" style="flex:0 0 auto">删本</button>
    </div>
    <p>共 <span id="word-count">0</span> 个词</p>
    <div id="word-list"></div>
    <div class="card">
      <h3>批量导入</h3>
      <p class="muted">${isEn ? '每行：英文 释义（音标自动获取）' : '每行：词语 可选拼音'}</p>
      <textarea name="import-text" rows="5" placeholder="${isEn ? 'apple 苹果' : '葡萄'}"></textarea>
      <button data-action="preview" style="margin-top:8px">预览</button>
      <div id="import-preview"></div>
    </div>
    <div class="card">
      <h3>手动添加</h3>
      <input name="add-text" placeholder="${isEn ? '英文' : '词语'}" />
      <input name="add-extra" placeholder="${isEn ? '中文释义' : '拼音（可选）'}" style="margin-top:8px" />
      <button data-action="add-one" style="margin-top:8px">添加</button>
    </div>
  `

  let pendingEntries = []

  el.querySelector('[data-action=preview]').addEventListener('click', () => {
    const text = el.querySelector('[name=import-text]').value
    const { entries, skipped } = parseImport(text, wb.type)
    pendingEntries = entries
    el.querySelector('#import-preview').innerHTML = entries.length
      ? `<p>将导入 ${entries.length} 个词${skipped ? `，跳过 ${skipped} 行` : ''}</p>
         <button data-action="confirm-import">确认导入</button>`
      : '<p class="muted">没有可导入的词。</p>'
    const confirm = el.querySelector('[data-action=confirm-import]')
    if (confirm) confirm.addEventListener('click', doImport)
  })

  async function doImport() {
    const entries = pendingEntries
    const added = await addWords(id, entries, todayStr())
    await refreshList()
    el.querySelector('#import-preview').innerHTML = '<p class="muted">导入完成。</p>'
    el.querySelector('[name=import-text]').value = ''
    if (isEn) backfillPhonetics(added)
  }

  async function backfillPhonetics(words) {
    const map = await fetchPhoneticsBatch(words.map((w) => w.text))
    for (const w of words) {
      const ph = map.get(w.text)
      if (ph) await updateWord({ ...w, phonetic: ph })
    }
    await refreshList()
  }

  el.querySelector('[data-action=add-one]').addEventListener('click', async () => {
    const text = el.querySelector('[name=add-text]').value.trim()
    if (!text) return
    const extra = el.querySelector('[name=add-extra]').value.trim()
    const entry = isEn
      ? { text, meaning: extra, pinyin: '' }
      : { text, meaning: '', pinyin: extra }
    const added = await addWords(id, [entry], todayStr())
    el.querySelector('[name=add-text]').value = ''
    el.querySelector('[name=add-extra]').value = ''
    await refreshList()
    if (isEn) backfillPhonetics(added)
  })

  el.querySelector('[data-action=start]').addEventListener('click', () => {
    navigate(`#/dictation-setup/${id}`)
  })

  el.querySelector('[data-action=del-book]').addEventListener('click', async () => {
    if (!confirm(`确定删除单词本「${wb.name}」及其全部单词？`)) return
    await deleteWordbook(id)
    navigate('#/wordbooks')
  })

  el.appendChild(renderNav('wordbooks'))
  await refreshList()
  return el
}
