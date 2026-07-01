import { getWordbooks, createWordbook } from '../db/database.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'

const TYPE_LABEL = { en: '英文', zh: '中文' }

export async function renderWordbooks() {
  const el = document.createElement('div')
  const books = await getWordbooks()

  const listHtml = books.length
    ? books.map((b) => `<div class="card wb-item" data-id="${b.id}">
        <strong>${b.name}</strong> <span class="muted">${TYPE_LABEL[b.type]}</span>
      </div>`).join('')
    : '<p class="muted">还没有单词本，先在下面新建一个吧。</p>'

  el.innerHTML = `
    <h1 class="page-title">单词本</h1>
    <div id="wb-list">${listHtml}</div>
    <div class="card">
      <h3>新建单词本</h3>
      <input name="wb-name" placeholder="单词本名称，如 五年级上 U3" />
      <div class="row" style="margin-top:8px">
        <select name="wb-type">
          <option value="en">英文</option>
          <option value="zh">中文</option>
        </select>
        <button data-action="create">创建</button>
      </div>
    </div>
  `

  el.querySelectorAll('.wb-item').forEach((item) => {
    item.addEventListener('click', () => navigate(`#/wordbook/${item.dataset.id}`))
  })

  el.querySelector('[data-action=create]').addEventListener('click', async () => {
    const name = el.querySelector('[name=wb-name]').value.trim()
    const type = el.querySelector('[name=wb-type]').value
    if (!name) return
    const wb = await createWordbook({ name, type })

    // Update the list in place so the new item is visible
    const wbList = el.querySelector('#wb-list')
    const item = document.createElement('div')
    item.className = 'card wb-item'
    item.dataset.id = wb.id
    item.innerHTML = `<strong>${wb.name}</strong> <span class="muted">${TYPE_LABEL[wb.type]}</span>`
    item.addEventListener('click', () => navigate(`#/wordbook/${wb.id}`))
    // Replace empty-state paragraph if present
    const empty = wbList.querySelector('p.muted')
    if (empty) wbList.innerHTML = ''
    wbList.appendChild(item)

    navigate(`#/wordbook/${wb.id}`)
  })

  el.appendChild(renderNav('wordbooks'))
  return el
}
