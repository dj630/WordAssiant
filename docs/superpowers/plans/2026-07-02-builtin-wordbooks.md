# 内置单词本（人教版2024 · 三/四年级）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有听写 App 中内置人教版2024新版三/四年级英语词表（24 本、一单元一本），用户可在"单词本"页一键把某单元添加进自己的词库；单词本新增"年级"属性并支持按年级筛选。

**Architecture:** 一次性脚本把官方 `.txt` 解析成静态数据模块 `src/data/builtin-books.js`（运行时零网络）。新增只读目录页 `#/builtin` 展示 24 本并提供"添加到我的词库"（复用 `createWordbook`/`addWords` + 现有英文音标回填）。`Wordbook` 增加向后兼容的 `grade` 字段，"单词本"页据此做动态年级筛选。

**Tech Stack:** 原生 JS（ES Modules）、Vite、Vitest（jsdom + fake-indexeddb）、IndexedDB。

## Global Constraints

- 数据仅来自官方源文件，禁止臆造词条。源：`docs/pep2024-g3-g4-wordlist.txt`。
- 数据规模固定：**24 本、486 词条**（三上109 / 三下90 / 四上101 / 四下186）。
- 内置本 `type` 均为 `'en'`；词性已在 `meaning` 中（如 `n. 苹果`），原样保留。
- 单词本命名：`<年级简写><册简写> U<单元> <英文名>`，如 `三上 U1 Making Friends`；年级简写 三/四，册简写 上/下。
- 内置本 `id` 稳定格式：`pep2024-g{3|4}-t{1|2}-u{N}`（t1=上册，t2=下册）。
- `grade` 取值 `'三年级'`/`'四年级'`/`''`（未分类）。`DB_VERSION` 不变，无 schema 迁移。
- 不新增底部导航项；不预置音标到数据文件（沿用导入时联网回填）。
- 所有对用户可见文案用简体中文；测试输出须纯净（TTS/音标 fetch 用 mock）。
- 现有 51 个测试须持续全绿。

---

### Task 1: 生成脚本与内置数据模块

**Files:**
- Move: `三年级、四年级（2024新版）.txt` → `docs/pep2024-g3-g4-wordlist.txt`
- Create: `scripts/gen-builtin-books.mjs`
- Create（生成产物）: `src/data/builtin-books.js`
- Test: `src/data/builtin-books.test.js`

**Interfaces:**
- Consumes: 无（读源 `.txt`）
- Produces: `src/data/builtin-books.js` 导出 `BUILTIN_BOOKS: Array<{ id:string, name:string, type:'en', grade:'三年级'|'四年级', term:'上册'|'下册', unit:number, title:string, unitZh:string, entries:Array<{ text:string, meaning:string }> }>`

- [ ] **Step 1: 移动源文件到 docs/ 留档**

```bash
git mv "三年级、四年级（2024新版）.txt" docs/pep2024-g3-g4-wordlist.txt
```

- [ ] **Step 2: 创建生成脚本 `scripts/gen-builtin-books.mjs`**

```js
import fs from 'fs'

const SRC = process.argv[2] || 'docs/pep2024-g3-g4-wordlist.txt'
const OUT = process.argv[3] || 'src/data/builtin-books.js'
const raw = fs.readFileSync(SRC, 'utf8')
const lines = raw.split(/\r?\n/)

// 跳过表头与网址等噪音行
const NOISE = /^(book118\.com|docin\.com|xuehi\.cn|zxxk\.com|\+\d+|￼|英文|中文释义)\s*$/
const GRADE_RE = /^(三年级|四年级)(上册|下册)（2024新版）\s*$/
const UNIT_RE = /^Unit\s+(\d+)\s+(.+?)（(.+?)）\s*$/
const GC = { '三年级': 'g3', '四年级': 'g4' }
const TC = { '上册': 't1', '下册': 't2' }
const GS = { '三年级': '三', '四年级': '四' }
const TS = { '上册': '上', '下册': '下' }

let books = [], cur = null, grade = '', term = '', pending = null
function flush() { if (cur) books.push(cur) }

for (const l0 of lines) {
  const l = l0.trim()
  if (!l || NOISE.test(l)) continue
  const g = l.match(GRADE_RE)
  if (g) { grade = g[1]; term = g[2]; continue }
  const u = l.match(UNIT_RE)
  if (u) {
    flush()
    const unit = +u[1]
    cur = {
      id: `pep2024-${GC[grade]}-${TC[term]}-u${unit}`,
      name: `${GS[grade]}${TS[term]} U${unit} ${u[2].trim()}`,
      type: 'en', grade, term, unit,
      title: u[2].trim(), unitZh: u[3].trim(), entries: [],
    }
    pending = null
    continue
  }
  if (!cur) continue
  if (pending === null) pending = l            // 英文行
  else { cur.entries.push({ text: pending, meaning: l }); pending = null } // 中文行成对
}
flush()

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
let out = '// 自动生成，请勿手改。源：docs/pep2024-g3-g4-wordlist.txt\n'
out += '// 重新生成：node scripts/gen-builtin-books.mjs\n\n'
out += 'export const BUILTIN_BOOKS = [\n'
for (const b of books) {
  out += `  {\n    id: '${b.id}',\n    name: '${esc(b.name)}',\n    type: 'en',\n    grade: '${b.grade}',\n    term: '${b.term}',\n    unit: ${b.unit},\n    title: '${esc(b.title)}',\n    unitZh: '${esc(b.unitZh)}',\n    entries: [\n`
  for (const e of b.entries) out += `      { text: '${esc(e.text)}', meaning: '${esc(e.meaning)}' },\n`
  out += '    ],\n  },\n'
}
out += ']\n'
fs.writeFileSync(OUT, out)
console.log('books', books.length, 'entries', books.reduce((a, b) => a + b.entries.length, 0))
```

- [ ] **Step 3: 运行脚本生成数据模块**

Run: `node scripts/gen-builtin-books.mjs`
Expected: 输出 `books 24 entries 486`，生成 `src/data/builtin-books.js`。

- [ ] **Step 4: 写数据模块测试 `src/data/builtin-books.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { BUILTIN_BOOKS } from './builtin-books.js'

describe('内置单词本数据', () => {
  it('恰好 24 本、486 词条', () => {
    expect(BUILTIN_BOOKS).toHaveLength(24)
    const total = BUILTIN_BOOKS.reduce((a, b) => a + b.entries.length, 0)
    expect(total).toBe(486)
  })

  it('id 唯一', () => {
    const ids = new Set(BUILTIN_BOOKS.map((b) => b.id))
    expect(ids.size).toBe(24)
  })

  it('每本均为英文本、年级合法、词条齐全', () => {
    for (const b of BUILTIN_BOOKS) {
      expect(b.type).toBe('en')
      expect(['三年级', '四年级']).toContain(b.grade)
      expect(b.entries.length).toBeGreaterThan(0)
      for (const e of b.entries) {
        expect(e.text.trim()).not.toBe('')
        expect(e.meaning.trim()).not.toBe('')
      }
    }
  })

  it('命名格式抽查', () => {
    const first = BUILTIN_BOOKS.find((b) => b.id === 'pep2024-g3-t1-u1')
    expect(first.name).toBe('三上 U1 Making Friends')
    expect(first.unitZh).toBe('交朋友')
  })
})
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run src/data/builtin-books.test.js`
Expected: PASS（4 个用例）。

- [ ] **Step 6: 提交**

```bash
git add scripts/gen-builtin-books.mjs src/data/builtin-books.js src/data/builtin-books.test.js docs/pep2024-g3-g4-wordlist.txt
git commit -m "feat: 内置词库数据（人教版2024三四年级）与生成脚本"
```

---

### Task 2: `Wordbook` 增加 `grade` 字段

**Files:**
- Modify: `src/db/database.js`（`createWordbook`）
- Test: `src/db/database.test.js`（追加）

**Interfaces:**
- Consumes: 无
- Produces: `createWordbook({ name, type, grade })` —— `grade` 可选，缺省存 `''`；返回的 wordbook 含 `grade` 字段。既有调用 `createWordbook({ name, type })` 仍有效。

- [ ] **Step 1: 追加失败测试到 `src/db/database.test.js`**

```js
// 追加到现有 database.test.js 内（沿用文件顶部已有的 import 与 beforeEach）
describe('createWordbook grade 字段', () => {
  it('存储传入的 grade', async () => {
    const wb = await createWordbook({ name: '三上 U1 X', type: 'en', grade: '三年级' })
    const books = await getWordbooks()
    expect(books.find((b) => b.id === wb.id).grade).toBe('三年级')
  })

  it('未传 grade 时缺省为空串', async () => {
    const wb = await createWordbook({ name: '自建', type: 'zh' })
    const books = await getWordbooks()
    expect(books.find((b) => b.id === wb.id).grade).toBe('')
  })
})
```

（若 `createWordbook`/`getWordbooks` 未在文件顶部 import，则补充：`import { createWordbook, getWordbooks } from './database.js'`——先查看文件现有 import，避免重复。）

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/db/database.test.js`
Expected: FAIL（`grade` 为 `undefined`，非 `''`/`'三年级'`）。

- [ ] **Step 3: 修改 `createWordbook`（`src/db/database.js`）**

将：

```js
export async function createWordbook({ name, type }) {
  const db = await openDB()
  const wb = { id: crypto.randomUUID(), name, type, createdAt: Date.now() }
```

改为：

```js
export async function createWordbook({ name, type, grade = '' }) {
  const db = await openDB()
  const wb = { id: crypto.randomUUID(), name, type, grade, createdAt: Date.now() }
```

（函数其余部分不变。）

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/db/database.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/db/database.js src/db/database.test.js
git commit -m "feat: 单词本增加 grade 年级字段（向后兼容）"
```

---

### Task 3: 内置词库目录页与添加逻辑

**Files:**
- Create: `src/pages/builtin.js`
- Modify: `src/router.js`（增路由）
- Modify: `src/main.js`（注册页面）
- Test: `src/pages/builtin.test.js`

**Interfaces:**
- Consumes: `BUILTIN_BOOKS`（Task 1）；`createWordbook`（Task 2，含 grade）、`addWords`、`getWordbooks`、`updateWord`（`src/db/database.js`）；`fetchPhoneticsBatch`（`src/services/phonetic.js`，签名 `fetchPhoneticsBatch(words:string[]) => Promise<Map<string,string>>`）；`todayStr`（`src/utils/dates.js`）；`renderNav`（`src/components/nav.js`）
- Produces: `renderBuiltin(): Promise<HTMLElement>`；路由 `#/builtin`

- [ ] **Step 1: 写失败测试 `src/pages/builtin.test.js`**

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('../services/phonetic.js', () => ({
  fetchPhoneticsBatch: vi.fn(async () => new Map()),
}))

import { __resetForTests, getWordbooks, getWordsByBook } from '../db/database.js'
import { renderBuiltin } from './builtin.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('内置词库目录页', () => {
  it('展示分组并能把某单元添加进词库', async () => {
    const el = await renderBuiltin()
    // 4 个分组标题
    expect(el.textContent).toContain('三年级上册')
    expect(el.textContent).toContain('四年级下册')
    // 抽查一本名
    expect(el.textContent).toContain('三上 U1 Making Friends')

    // 添加"三上 U1"（id: pep2024-g3-t1-u1）
    el.querySelector('[data-add="pep2024-g3-t1-u1"]').click()
    await new Promise((r) => setTimeout(r, 30))

    const books = await getWordbooks()
    expect(books).toHaveLength(1)
    expect(books[0].name).toBe('三上 U1 Making Friends')
    expect(books[0].grade).toBe('三年级上册') // 年级+册组合，区分上下册
    expect(books[0].type).toBe('en')
    const words = await getWordsByBook(books[0].id)
    expect(words.length).toBe(17) // 三上 U1 词条数
    expect(words.some((w) => w.text === 'nice' && w.meaning.startsWith('adj.'))).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/pages/builtin.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/pages/builtin.js`**

```js
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
    // grade 存"年级+册"组合值（如 三年级上册），供单词本页按上下册筛选
    const wb = await createWordbook({ name: book.name, type: 'en', grade: book.grade + book.term })
    const added = await addWords(wb.id, book.entries, todayStr())
    // 英文音标回填；短语查不到或离线则留空，不阻塞
    try {
      const map = await fetchPhoneticsBatch(added.map((w) => w.text))
      for (const w of added) {
        const ph = map.get(w.text)
        if (ph) await updateWord({ ...w, phonetic: ph })
      }
    } catch { /* 忽略网络失败 */ }
    btn.textContent = '已添加 ✓'
  }

  el.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => addBook(btn))
  })

  el.appendChild(renderNav('wordbooks'))
  return el
}
```

- [ ] **Step 4: 注册路由（`src/router.js`）**

在 `ROUTES` 数组中，`wrongbook` 之后追加一行：

```js
  { name: 'wrongbook', pattern: /^#\/wrongbook$/, keys: [] },
  { name: 'builtin', pattern: /^#\/builtin$/, keys: [] },
]
```

- [ ] **Step 5: 注册页面（`src/main.js`）**

顶部 import 追加：

```js
import { renderBuiltin } from './pages/builtin.js'
```

`PAGES` 映射追加：

```js
  wrongbook: renderWrongbook,
  builtin: renderBuiltin,
}
```

- [ ] **Step 6: 跑测试确认通过**

Run: `npx vitest run src/pages/builtin.test.js`
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/pages/builtin.js src/pages/builtin.test.js src/router.js src/main.js
git commit -m "feat: 内置词库目录页与一键添加到词库"
```

---

### Task 4: "单词本"页入口按钮、年级筛选与建本年级

**Files:**
- Modify: `src/pages/wordbooks.js`（整体重写）
- Test: `src/pages/wordbooks.test.js`（扩充）

**Interfaces:**
- Consumes: `getWordbooks`、`createWordbook`（含 grade）；`navigate`（`src/router.js`）；`renderNav`
- Produces: `renderWordbooks(): Promise<HTMLElement>`（含内置词库入口、年级筛选、建本可选年级）

- [ ] **Step 1: 扩充测试 `src/pages/wordbooks.test.js`**

在现有 `describe('单词本页', ...)` 内追加两个用例（保留原两个用例不变）：

```js
  it('内置词库入口跳转 #/builtin', async () => {
    const el = await renderWordbooks()
    const btn = el.querySelector('[data-action=builtin]')
    expect(btn).not.toBeNull()
    btn.click()
    expect(location.hash).toBe('#/builtin')
  })

  it('按年级+册筛选（区分上下册）只显示该分类的单词本', async () => {
    // 建三上、三下、四上各一本 + 一本未分类
    const { createWordbook } = await import('../db/database.js')
    await createWordbook({ name: '三上 U1 A', type: 'en', grade: '三年级上册' })
    await createWordbook({ name: '三下 U1 B', type: 'en', grade: '三年级下册' })
    await createWordbook({ name: '四上 U1 C', type: 'en', grade: '四年级上册' })
    await createWordbook({ name: '自建 D', type: 'zh' }) // 未分类

    const el = await renderWordbooks()
    // 点"三年级上册"筛选块
    el.querySelector('[data-grade-filter="三年级上册"]').click()
    await new Promise((r) => setTimeout(r, 0))
    const list = el.querySelector('#wb-list')
    expect(list.textContent).toContain('三上 U1 A')
    expect(list.textContent).not.toContain('三下 U1 B') // 区分上下册
    expect(list.textContent).not.toContain('四上 U1 C')
    expect(list.textContent).not.toContain('自建 D')
  })
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/pages/wordbooks.test.js`
Expected: FAIL（无 `[data-action=builtin]` / 无筛选块）。

- [ ] **Step 3: 重写 `src/pages/wordbooks.js`**

```js
import { getWordbooks, createWordbook } from '../db/database.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'

const TYPE_LABEL = { en: '英文', zh: '中文' }

export async function renderWordbooks() {
  const el = document.createElement('div')
  const books = await getWordbooks()

  // 年级筛选选项：全部 + 出现过的年级 + （存在未分类本时）未分类
  const grades = [...new Set(books.map((b) => b.grade).filter(Boolean))]
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
          <option value="三年级上册">三年级上册</option>
          <option value="三年级下册">三年级下册</option>
          <option value="四年级上册">四年级上册</option>
          <option value="四年级下册">四年级下册</option>
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
```

- [ ] **Step 4: 补充 `.chip` 样式（`src/styles/main.css`）**

全局样式文件为 `src/styles/main.css`（`index.html` 中通过 `<link rel="stylesheet" href="/src/styles/main.css" />` 引入，含 `.card`/`.row`/`.muted`/`.secondary` 等类）。在其末尾追加：

```css
.chip {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid #cfcfcf;
  background: #fff;
  font-size: 0.9rem;
}
.chip-active {
  background: #2e7d32;
  color: #fff;
  border-color: #2e7d32;
}
```

（若全局样式文件名不同，放入现有那个文件；不要新建样式文件。样式不影响测试，仅视觉。）

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run src/pages/wordbooks.test.js`
Expected: PASS（原 2 + 新 2 = 4 个用例）。

- [ ] **Step 6: 全量回归**

Run: `npx vitest run`
Expected: 全绿（此前 51 + 新增用例）。

- [ ] **Step 7: 提交**

```bash
git add src/pages/wordbooks.js src/pages/wordbooks.test.js src/styles/main.css
git commit -m "feat: 单词本页内置词库入口与年级筛选"
```

---

## Self-Review

**1. Spec 覆盖核对：**
- §2 数据规模（24 本/486 词） → Task 1（生成 + 测试断言）✓
- §3 数据来源与生成（脚本 + 静态模块 + 结构） → Task 1 ✓
- §4 命名（`三上 U1 …`） → Task 1（生成器命名 + 测试抽查）✓
- §5.1 grade 字段（向后兼容、createWordbook） → Task 2 ✓
- §5.2 年级筛选（动态派生、全部/年级/未分类） → Task 4 ✓
- §6.1 单词本页入口按钮 + 建本年级 + 列表显示年级 → Task 4 ✓
- §6.2 内置目录页 + 路由 + main 注册 → Task 3 ✓
- §6.3 添加逻辑（createWordbook+addWords+音标回填、不跳转、已添加提示） → Task 3 ✓
- §7 测试要点（数据模块 / 添加逻辑 / 年级筛选 / 命名分组） → Task 1/3/4 ✓

**2. 占位符扫描：** 无 TBD/TODO；每个代码步骤含完整代码。`builtin-books.js` 为生成产物，由 Step 3 运行脚本产出（不手写内联）。

**3. 类型一致性：**
- `createWordbook({ name, type, grade })` 在 Task 2 定义，Task 3/4 一致调用。
- `BUILTIN_BOOKS` 项字段（`id/name/type/grade/term/unit/title/unitZh/entries[{text,meaning}]`）在 Task 1 定义，Task 3 目录页与添加逻辑按此消费（`b.name/b.grade/b.term/b.unitZh/b.entries`）。
- `fetchPhoneticsBatch(string[]) => Map` 与现有 `wordbook-detail.js` 用法一致（Task 3 复用）。
- 内置本 id `pep2024-g3-t1-u1` 在 Task 1 生成、Task 3 测试点击选择，一致。
