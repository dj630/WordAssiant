import { getWordbooks, createWordbook } from '../db/database.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'

const TYPE_LABEL = { en: '英文', zh: '中文' }

export async function renderWordbooks() {
  const el = document.createElement('div')
  const books = await getWordbooks()

  // 年级筛选选项：全部 + 出现过的年级 + （存在未分类本时）未分类
  // 按固定顺序（三上→三下→四上→四下→其他）排列，避免因建本顺序不同导致块乱序
  const GRADE_ORDER = ['三上', '三下', '四上', '四下']
  const grades = [...new Set(books.map((b) => b.grade).filter(Boolean))]
    .sort((a, b) => {
      const ia = GRADE_ORDER.indexOf(a)
      const ib = GRADE_ORDER.indexOf(b)
      return (ia < 0 ? GRADE_ORDER.length : ia) - (ib < 0 ? GRADE_ORDER.length : ib) || a.localeCompare(b)
    })
  const hasUncategorized = books.some((b) => !b.grade)
  let activeGrade = 'all'

  function itemHtml(b) {
    const gradeTag = b.grade ? ` <span class="muted">${b.grade}</span>` : ''
    return `<div class="card wb-item" data-id="${b.id}">
        <strong>${b.name}</strong> <span class="muted">${TYPE_LABEL[b.type]}</span>${gradeTag}
      </div>`
  }

  function filterHtml() {
    const chips = ['all', ...grades]
    if (hasUncategorized) chips.push('none')
    const label = (g) => (g === 'all' ? '全部' : g === 'none' ? '未分类' : g)
    return chips
      .map((g) => `<button class="chip${g === activeGrade ? ' chip-active' : ''}" data-grade-filter="${g}">${label(g)}</button>`)
      .join('')
  }

  function listHtml() {
    let shown = books
    if (activeGrade === 'none') shown = books.filter((b) => !b.grade)
    else if (activeGrade !== 'all') shown = books.filter((b) => b.grade === activeGrade)
    return shown.length ? shown.map(itemHtml).join('') : '<p class="muted">没有符合条件的单词本。</p>'
  }

  const showFilter = grades.length || hasUncategorized

  el.innerHTML = `
    <h1 class="page-title">单词本</h1>
    <button data-action="builtin" class="secondary" style="margin-bottom:12px">＋ 内置词库（人教版2024）</button>
    ${showFilter ? `<div class="row" id="wb-filter" style="flex-wrap:wrap;gap:8px;margin-bottom:12px">${filterHtml()}</div>` : ''}
    <div id="wb-list">${books.length ? listHtml() : '<p class="muted">还没有单词本，先在下面新建一个吧。</p>'}</div>
    <div class="card">
      <h3>新建单词本</h3>
      <input name="wb-name" placeholder="单词本名称，如 五上 U3" />
      <div class="row" style="margin-top:8px">
        <select name="wb-type">
          <option value="en">英文</option>
          <option value="zh">中文</option>
        </select>
        <select name="wb-grade">
          <option value="">不限年级</option>
          <option value="三上">三上</option>
          <option value="三下">三下</option>
          <option value="四上">四上</option>
          <option value="四下">四下</option>
        </select>
        <button data-action="create">创建</button>
      </div>
    </div>
  `

  function bindItems() {
    el.querySelectorAll('.wb-item').forEach((item) => {
      item.addEventListener('click', () => navigate(`#/wordbook/${item.dataset.id}`))
    })
  }
  bindItems()

  el.querySelector('[data-action=builtin]').addEventListener('click', () => navigate('#/builtin'))

  el.querySelectorAll('[data-grade-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeGrade = chip.dataset.gradeFilter
      el.querySelectorAll('[data-grade-filter]').forEach((c) =>
        c.classList.toggle('chip-active', c.dataset.gradeFilter === activeGrade))
      el.querySelector('#wb-list').innerHTML = listHtml()
      bindItems()
    })
  })

  el.querySelector('[data-action=create]').addEventListener('click', async () => {
    const name = el.querySelector('[name=wb-name]').value.trim()
    const type = el.querySelector('[name=wb-type]').value
    const grade = el.querySelector('[name=wb-grade]').value
    if (!name) return
    const wb = await createWordbook({ name, type, grade })

    // 就地插入新项，保证 jsdom 下也能立即看到（导航不重渲染）
    const wbList = el.querySelector('#wb-list')
    const empty = wbList.querySelector('p.muted')
    if (empty) wbList.innerHTML = ''
    const item = document.createElement('div')
    item.className = 'card wb-item'
    item.dataset.id = wb.id
    const gradeTag = grade ? ` <span class="muted">${grade}</span>` : ''
    item.innerHTML = `<strong>${wb.name}</strong> <span class="muted">${TYPE_LABEL[type]}</span>${gradeTag}`
    item.addEventListener('click', () => navigate(`#/wordbook/${wb.id}`))
    wbList.appendChild(item)

    navigate(`#/wordbook/${wb.id}`)
  })

  el.appendChild(renderNav('wordbooks'))
  return el
}
