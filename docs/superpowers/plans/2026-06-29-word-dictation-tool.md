# 儿童单词听写助手 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个本地优先的 PWA，帮助儿童按遗忘曲线复习并听写中/英文单词，纸上手写作答、人工标记对错、错词重练，英文词自动联网取音标。

**Architecture:** 纯前端单页应用：原生 JS 模块化 + 简单 hash 路由。核心业务逻辑（复习算法、导入解析、音标获取、备份、日期）为纯函数，单元测试用 Vitest；数据持久化用 IndexedDB（测试用 fake-indexeddb）；UI 为原生 DOM 渲染函数（关键交互用 jsdom 测试）。朗读用 Web Speech API，音标用 Free Dictionary API。

**Tech Stack:** Vite, vite-plugin-pwa, 原生 JavaScript (ES Modules), Vitest, jsdom, fake-indexeddb, @testing-library/dom, IndexedDB, Web Speech API, Free Dictionary API。

## Global Constraints

- 运行环境 Node.js v24.14.0 / npm 11.12.0（已确认）。
- 不引入前端框架（无 React/Vue/Svelte）；UI 用原生 DOM。
- 数据存浏览器 IndexedDB，数据库名 `word-dictation`，版本 `1`。
- 仅"录入英文词取音标"这一步可联网；其余功能离线可用。
- 复习间隔档位天数固定：`[1, 2, 4, 7, 15, 30]`。
- 日期一律用本地日期字符串 `YYYY-MM-DD`，只比较到"天"。
- `isWrong` 在 IndexedDB 中以数字 `0 | 1` 存储（布尔不能作索引键）。
- 单词本 `type`：`'en'`（英文）| `'zh'`（中文）。
- 音标接口：`GET https://api.dictionaryapi.dev/api/v2/entries/en/<word>`。
- 所有 ID 用 `crypto.randomUUID()`。
- 提交信息使用中文 `feat:` / `test:` / `chore:` 前缀。

---

### Task 1: 项目脚手架与测试环境

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `vitest.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles/main.css`
- Create: `.gitignore`
- Test: `src/__tests__/smoke.test.js`

**Interfaces:**
- Consumes: 无
- Produces: 可运行的 `npm run dev` / `npm run build` / `npm test`；`index.html` 内含 `<div id="app"></div>` 与 `<script type="module" src="/src/main.js">`。

- [ ] **Step 1: 写 `.gitignore`**

```
node_modules/
dist/
dev-dist/
*.log
```

- [ ] **Step 2: 写 `package.json`**

```json
{
  "name": "child-word-assistant",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0",
    "fake-indexeddb": "^6.0.0",
    "@testing-library/dom": "^10.4.0"
  }
}
```

- [ ] **Step 3: 安装依赖**

Run: `npm install`
Expected: 成功生成 `node_modules` 与 `package-lock.json`，无报错。

- [ ] **Step 4: 写 `vite.config.js`（PWA 留到 Task 16，先最简）**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  server: { host: true },
})
```

- [ ] **Step 5: 写 `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 6: 写 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>单词听写助手</title>
    <link rel="stylesheet" href="/src/styles/main.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 7: 写最简 `src/main.js`**

```js
const app = document.getElementById('app')
app.textContent = '单词听写助手加载成功'
```

- [ ] **Step 8: 写 `src/styles/main.css`（基础重置 + 大字大按钮）**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --pad: 16px; --accent: #2e7d32; --danger: #c62828; }
html, body { height: 100%; }
body {
  font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 18px; color: #222; background: #f5f5f5;
  -webkit-text-size-adjust: 100%;
}
button {
  font-size: 1rem; padding: 12px 20px; border: none; border-radius: 10px;
  background: var(--accent); color: #fff; cursor: pointer; min-height: 48px;
}
button.secondary { background: #e0e0e0; color: #222; }
button.danger { background: var(--danger); }
input, select, textarea {
  font-size: 1rem; padding: 10px; border: 1px solid #ccc; border-radius: 8px; width: 100%;
}
#app { max-width: 640px; margin: 0 auto; padding: var(--pad) var(--pad) 80px; }
```

- [ ] **Step 9: 写冒烟测试 `src/__tests__/smoke.test.js`**

```js
import { describe, it, expect } from 'vitest'

describe('环境冒烟', () => {
  it('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 10: 跑测试确认通过**

Run: `npm test`
Expected: PASS，1 个测试通过。

- [ ] **Step 11: 启动 dev 确认页面**

Run: `npm run dev`（手动浏览器打开后 Ctrl+C 结束）
Expected: 页面显示"单词听写助手加载成功"。

- [ ] **Step 12: 提交**

```bash
git add -A
git commit -m "chore: 初始化 Vite + Vitest 项目脚手架"
```

---

### Task 2: 日期工具 `dates.js`

**Files:**
- Create: `src/utils/dates.js`
- Test: `src/utils/dates.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `todayStr(now = new Date()): string` —— 返回本地 `YYYY-MM-DD`
  - `addDaysStr(dateStr: string, days: number): string`
  - `isDueOnOrBefore(dueStr: string, todayStr: string): boolean` —— `dueStr <= todayStr`

- [ ] **Step 1: 写失败测试 `src/utils/dates.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { todayStr, addDaysStr, isDueOnOrBefore } from './dates.js'

describe('dates', () => {
  it('todayStr 用本地时间格式化为 YYYY-MM-DD', () => {
    expect(todayStr(new Date(2026, 5, 29))).toBe('2026-06-29')
    expect(todayStr(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('addDaysStr 跨月加天', () => {
    expect(addDaysStr('2026-06-29', 2)).toBe('2026-07-01')
    expect(addDaysStr('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysStr('2026-06-29', 0)).toBe('2026-06-29')
  })

  it('isDueOnOrBefore 按天比较', () => {
    expect(isDueOnOrBefore('2026-06-28', '2026-06-29')).toBe(true)
    expect(isDueOnOrBefore('2026-06-29', '2026-06-29')).toBe(true)
    expect(isDueOnOrBefore('2026-06-30', '2026-06-29')).toBe(false)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/utils/dates.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/utils/dates.js`**

```js
function pad2(n) {
  return String(n).padStart(2, '0')
}

export function todayStr(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

export function addDaysStr(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return todayStr(dt)
}

export function isDueOnOrBefore(dueStr, todayStr) {
  return dueStr <= todayStr
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/utils/dates.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/utils/dates.js src/utils/dates.test.js
git commit -m "feat: 本地日期工具（按天比较）"
```

---

### Task 3: 复习算法 `review.js`

**Files:**
- Create: `src/services/review.js`
- Test: `src/services/review.test.js`

**Interfaces:**
- Consumes: `src/utils/dates.js`（`addDaysStr`）
- Produces:
  - `INTERVALS: number[]` = `[1, 2, 4, 7, 15, 30]`
  - `newReviewState(today: string): { level, dueDate, isWrong, lastReviewedAt }` —— `level=0, dueDate=today, isWrong=0, lastReviewedAt=null`
  - `applyReviewResult(word: {level:number}, correct: boolean, today: string): { level, dueDate, isWrong, lastReviewedAt }`
    - 对：`level' = min(level+1, 5)`，`dueDate = today + INTERVALS[level']`，`isWrong=0`
    - 错：`level' = 0`，`dueDate = today + 1`，`isWrong=1`
    - 两者都设 `lastReviewedAt = today`

- [ ] **Step 1: 写失败测试 `src/services/review.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { INTERVALS, newReviewState, applyReviewResult } from './review.js'

describe('review 算法', () => {
  it('档位天数固定', () => {
    expect(INTERVALS).toEqual([1, 2, 4, 7, 15, 30])
  })

  it('新词：level0、当天到期、不在错词本', () => {
    expect(newReviewState('2026-06-29')).toEqual({
      level: 0, dueDate: '2026-06-29', isWrong: 0, lastReviewedAt: null,
    })
  })

  it('答对：升一档，按新档位天数排期', () => {
    const r = applyReviewResult({ level: 0 }, true, '2026-06-29')
    expect(r.level).toBe(1)
    expect(r.dueDate).toBe('2026-07-01') // +2 天
    expect(r.isWrong).toBe(0)
    expect(r.lastReviewedAt).toBe('2026-06-29')
  })

  it('答对到顶封顶在 30 天档', () => {
    const r = applyReviewResult({ level: 5 }, true, '2026-06-29')
    expect(r.level).toBe(5)
    expect(r.dueDate).toBe('2026-07-29') // +30 天
  })

  it('答错：退回 level0，明天再练，进错词本', () => {
    const r = applyReviewResult({ level: 4 }, false, '2026-06-29')
    expect(r.level).toBe(0)
    expect(r.dueDate).toBe('2026-06-30') // +1 天
    expect(r.isWrong).toBe(1)
    expect(r.lastReviewedAt).toBe('2026-06-29')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/services/review.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/services/review.js`**

```js
import { addDaysStr } from '../utils/dates.js'

export const INTERVALS = [1, 2, 4, 7, 15, 30]
const MAX_LEVEL = INTERVALS.length - 1

export function newReviewState(today) {
  return { level: 0, dueDate: today, isWrong: 0, lastReviewedAt: null }
}

export function applyReviewResult(word, correct, today) {
  if (correct) {
    const level = Math.min(word.level + 1, MAX_LEVEL)
    return {
      level,
      dueDate: addDaysStr(today, INTERVALS[level]),
      isWrong: 0,
      lastReviewedAt: today,
    }
  }
  return {
    level: 0,
    dueDate: addDaysStr(today, 1),
    isWrong: 1,
    lastReviewedAt: today,
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/services/review.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/review.js src/services/review.test.js
git commit -m "feat: 简化遗忘曲线复习算法"
```

---

### Task 4: 导入解析 `importer.js`

**Files:**
- Create: `src/services/importer.js`
- Test: `src/services/importer.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `parseImport(text: string, type: 'en' | 'zh'): { entries: Array<{text, meaning, pinyin}>, skipped: number }`
    - 按行处理，去首尾空白；空行计入 `skipped`
    - `en`：先按 `\t` / `，` / `,` 显式分隔；否则在首个中文字符处切分（前=英文 `text`，后=中文 `meaning`）；都没有则整行为 `text`，`meaning=''`。`pinyin=''`
    - `zh`：按首个 `\t` / `，` / `,` / 连续空白切分，第一段=`text`（词语），其余=`pinyin`；`meaning=''`

- [ ] **Step 1: 写失败测试 `src/services/importer.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { parseImport } from './importer.js'

describe('parseImport 英文本', () => {
  it('支持 Tab / 逗号 / 中文逗号 / 中文起始切分，含带空格短语', () => {
    const text = [
      'apple\t苹果',
      'banana，香蕉',
      'cat,猫',
      'go to school 去上学',
      'hello',
      '',
      '   ',
    ].join('\n')
    const { entries, skipped } = parseImport(text, 'en')
    expect(entries).toEqual([
      { text: 'apple', meaning: '苹果', pinyin: '' },
      { text: 'banana', meaning: '香蕉', pinyin: '' },
      { text: 'cat', meaning: '猫', pinyin: '' },
      { text: 'go to school', meaning: '去上学', pinyin: '' },
      { text: 'hello', meaning: '', pinyin: '' },
    ])
    expect(skipped).toBe(2)
  })
})

describe('parseImport 中文本', () => {
  it('词语 + 可选拼音', () => {
    const text = ['葡萄', '美丽  měi lì', '朋友,péng you'].join('\n')
    const { entries } = parseImport(text, 'zh')
    expect(entries).toEqual([
      { text: '葡萄', meaning: '', pinyin: '' },
      { text: '美丽', meaning: '', pinyin: 'měi lì' },
      { text: '朋友', meaning: '', pinyin: 'péng you' },
    ])
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/services/importer.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/services/importer.js`**

```js
const CJK = /[一-鿿]/

function parseEnLine(line) {
  const sep = line.match(/\t|，|,/)
  if (sep) {
    const i = sep.index
    return { text: line.slice(0, i).trim(), meaning: line.slice(i + 1).trim(), pinyin: '' }
  }
  const cjk = line.search(CJK)
  if (cjk > 0) {
    return { text: line.slice(0, cjk).trim(), meaning: line.slice(cjk).trim(), pinyin: '' }
  }
  return { text: line.trim(), meaning: '', pinyin: '' }
}

function parseZhLine(line) {
  const parts = line.split(/\t|，|,|\s+/).filter(Boolean)
  return { text: parts[0] || '', meaning: '', pinyin: parts.slice(1).join(' ') }
}

export function parseImport(text, type) {
  const entries = []
  let skipped = 0
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) { skipped++; continue }
    const entry = type === 'en' ? parseEnLine(line) : parseZhLine(line)
    if (!entry.text) { skipped++; continue }
    entries.push(entry)
  }
  return { entries, skipped }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/services/importer.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/importer.js src/services/importer.test.js
git commit -m "feat: 批量导入文本解析（中英文）"
```

---

### Task 5: 音标获取 `phonetic.js`

**Files:**
- Create: `src/services/phonetic.js`
- Test: `src/services/phonetic.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `async fetchPhonetic(word: string, fetchFn = fetch): Promise<string>` —— 成功返回音标文本，失败/查无返回 `''`
  - `async fetchPhoneticsBatch(words: string[], opts?: { concurrency?: number, fetchFn?: Function }): Promise<Map<string,string>>`

- [ ] **Step 1: 写失败测试 `src/services/phonetic.test.js`**

```js
import { describe, it, expect, vi } from 'vitest'
import { fetchPhonetic, fetchPhoneticsBatch } from './phonetic.js'

function okResponse(body) {
  return { ok: true, json: async () => body }
}

describe('fetchPhonetic', () => {
  it('取顶层 phonetic', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse([{ phonetic: '/ˈæpəl/' }]))
    expect(await fetchPhonetic('apple', fetchFn)).toBe('/ˈæpəl/')
    expect(fetchFn).toHaveBeenCalledWith('https://api.dictionaryapi.dev/api/v2/entries/en/apple')
  })

  it('顶层缺失时从 phonetics[].text 取第一个非空', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      okResponse([{ phonetics: [{ text: '' }, { text: '/kæt/' }] }]),
    )
    expect(await fetchPhonetic('cat', fetchFn)).toBe('/kæt/')
  })

  it('404 / 非数组 返回空串', async () => {
    expect(await fetchPhonetic('zzz', vi.fn().mockResolvedValue({ ok: false }))).toBe('')
    expect(await fetchPhonetic('zzz', vi.fn().mockResolvedValue(okResponse({ title: 'No Definitions' })))).toBe('')
  })

  it('网络异常返回空串', async () => {
    expect(await fetchPhonetic('x', vi.fn().mockRejectedValue(new Error('offline')))).toBe('')
  })

  it('对单词做 URL 编码', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse([{ phonetic: '/p/' }]))
    await fetchPhonetic('a b', fetchFn)
    expect(fetchFn).toHaveBeenCalledWith('https://api.dictionaryapi.dev/api/v2/entries/en/a%20b')
  })
})

describe('fetchPhoneticsBatch', () => {
  it('返回每个词的音标 Map', async () => {
    const fetchFn = vi.fn().mockImplementation((url) =>
      Promise.resolve(okResponse([{ phonetic: '/' + url.split('/').pop() + '/' }])),
    )
    const map = await fetchPhoneticsBatch(['a', 'b', 'c'], { concurrency: 2, fetchFn })
    expect(map.get('a')).toBe('/a/')
    expect(map.get('b')).toBe('/b/')
    expect(map.get('c')).toBe('/c/')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/services/phonetic.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/services/phonetic.js`**

```js
const BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

export async function fetchPhonetic(word, fetchFn = fetch) {
  try {
    const res = await fetchFn(BASE + encodeURIComponent(word))
    if (!res.ok) return ''
    const data = await res.json()
    if (!Array.isArray(data)) return ''
    for (const entry of data) {
      if (entry.phonetic) return entry.phonetic
      for (const p of entry.phonetics || []) {
        if (p.text) return p.text
      }
    }
    return ''
  } catch {
    return ''
  }
}

export async function fetchPhoneticsBatch(words, { concurrency = 4, fetchFn = fetch } = {}) {
  const result = new Map()
  let i = 0
  async function worker() {
    while (i < words.length) {
      const word = words[i++]
      result.set(word, await fetchPhonetic(word, fetchFn))
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, words.length) }, worker))
  return result
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/services/phonetic.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/phonetic.js src/services/phonetic.test.js
git commit -m "feat: 英文音标在线获取（含批量节流与降级）"
```

---

### Task 6: 备份序列化 `backup.js`

**Files:**
- Create: `src/services/backup.js`
- Test: `src/services/backup.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `buildBackup(wordbooks, words, exportedAt: string): { version, exportedAt, wordbooks, words }`
  - `serializeBackup(wordbooks, words, exportedAt): string`
  - `parseBackup(jsonStr: string): { wordbooks, words }` —— 校验失败抛 `Error`

- [ ] **Step 1: 写失败测试 `src/services/backup.test.js`**

```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/services/backup.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/services/backup.js`**

```js
export function buildBackup(wordbooks, words, exportedAt) {
  return { version: 1, exportedAt, wordbooks, words }
}

export function serializeBackup(wordbooks, words, exportedAt) {
  return JSON.stringify(buildBackup(wordbooks, words, exportedAt), null, 2)
}

export function parseBackup(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (!data || !Array.isArray(data.wordbooks) || !Array.isArray(data.words)) {
    throw new Error('备份文件格式不正确')
  }
  return { wordbooks: data.wordbooks, words: data.words }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/services/backup.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/backup.js src/services/backup.test.js
git commit -m "feat: 备份数据序列化与校验"
```

---

### Task 7: 数据层 `database.js`（IndexedDB）

**Files:**
- Create: `src/db/database.js`
- Test: `src/db/database.test.js`

**Interfaces:**
- Consumes: 无（被各页面消费）
- Produces（全部返回 Promise）：
  - `openDB(): Promise<IDBDatabase>`
  - `createWordbook({ name, type }): Promise<wordbook>`（自动补 `id`/`createdAt`）
  - `getWordbooks(): Promise<wordbook[]>`
  - `deleteWordbook(id): Promise<void>`（级联删除其下 words）
  - `addWords(wordbookId, entries: Array<{text,meaning,pinyin}>, today: string): Promise<word[]>`（合并复习初始态）
  - `getWordsByBook(wordbookId): Promise<word[]>`
  - `updateWord(word): Promise<void>`
  - `deleteWord(id): Promise<void>`
  - `getDueWords(today): Promise<word[]>`（`dueDate <= today`）
  - `getWrongWords(): Promise<word[]>`（`isWrong === 1`）
  - `getAllData(): Promise<{wordbooks, words}>`
  - `replaceAllData({wordbooks, words}): Promise<void>`（覆盖式导入）
  - `__resetForTests(): void`（关闭并清空当前连接缓存）

**word 形状：** `{ id, wordbookId, text, meaning, pinyin, level, dueDate, isWrong, lastReviewedAt, createdAt }`

- [ ] **Step 1: 写失败测试 `src/db/database.test.js`**

```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/db/database.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/db/database.js`**

```js
import { newReviewState } from '../services/review.js'

const DB_NAME = 'word-dictation'
const DB_VERSION = 1
let dbPromise = null

export function __resetForTests() {
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
    req.onsuccess = () => resolve(req.result)
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/db/database.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/db/database.js src/db/database.test.js
git commit -m "feat: IndexedDB 数据层（单词本/词条/到期/错词/备份）"
```

---

### Task 8: 朗读服务 `tts.js`

**Files:**
- Create: `src/services/tts.js`
- Test: `src/services/tts.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null` —— 优先精确匹配 `lang`，否则匹配语言前缀（如 `zh`/`en`），否则 `null`
  - `speak(text: string, lang: string, synth = window.speechSynthesis, VoiceClass = window.SpeechSynthesisUtterance): void` —— 取消正在播放的，按 `lang` 选音色后朗读
  - `checkVoiceAvailability(voices): { en: boolean, zh: boolean }`

- [ ] **Step 1: 写失败测试 `src/services/tts.test.js`**

```js
import { describe, it, expect, vi } from 'vitest'
import { pickVoice, speak, checkVoiceAvailability } from './tts.js'

const voices = [
  { lang: 'en-US', name: 'US' },
  { lang: 'en-GB', name: 'GB' },
  { lang: 'zh-CN', name: 'CN' },
]

describe('pickVoice', () => {
  it('精确匹配优先', () => {
    expect(pickVoice(voices, 'en-US').name).toBe('US')
    expect(pickVoice(voices, 'zh-CN').name).toBe('CN')
  })
  it('退化为语言前缀匹配', () => {
    expect(pickVoice(voices, 'en-AU').name).toBe('US')
  })
  it('无匹配返回 null', () => {
    expect(pickVoice(voices, 'fr-FR')).toBe(null)
  })
})

describe('checkVoiceAvailability', () => {
  it('检测中英文可用性', () => {
    expect(checkVoiceAvailability(voices)).toEqual({ en: true, zh: true })
    expect(checkVoiceAvailability([{ lang: 'en-US' }])).toEqual({ en: true, zh: false })
  })
})

describe('speak', () => {
  it('先 cancel 再 speak，并设置语言/音色', () => {
    const synth = { cancel: vi.fn(), speak: vi.fn(), getVoices: () => voices }
    const utterances = []
    class FakeUtterance {
      constructor(text) { this.text = text; utterances.push(this) }
    }
    speak('apple', 'en-US', synth, FakeUtterance)
    expect(synth.cancel).toHaveBeenCalled()
    expect(synth.speak).toHaveBeenCalled()
    expect(utterances[0].text).toBe('apple')
    expect(utterances[0].lang).toBe('en-US')
    expect(utterances[0].voice.name).toBe('US')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/services/tts.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/services/tts.js`**

```js
export function pickVoice(voices, lang) {
  const exact = voices.find((v) => v.lang === lang)
  if (exact) return exact
  const prefix = lang.split('-')[0]
  const byPrefix = voices.find((v) => v.lang && v.lang.split('-')[0] === prefix)
  return byPrefix || null
}

export function checkVoiceAvailability(voices) {
  return {
    en: voices.some((v) => v.lang && v.lang.startsWith('en')),
    zh: voices.some((v) => v.lang && v.lang.startsWith('zh')),
  }
}

export function speak(text, lang, synth = window.speechSynthesis, VoiceClass = window.SpeechSynthesisUtterance) {
  if (!synth) return
  synth.cancel()
  const u = new VoiceClass(text)
  u.lang = lang
  const voice = pickVoice(synth.getVoices(), lang)
  if (voice) u.voice = voice
  synth.speak(u)
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/services/tts.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/tts.js src/services/tts.test.js
git commit -m "feat: TTS 朗读服务（音色选择与可用性检测）"
```

---

### Task 9: 应用外壳 + 路由 + 底部导航

**Files:**
- Create: `src/router.js`
- Create: `src/components/nav.js`
- Modify: `src/main.js`（整体重写）
- Test: `src/router.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `parseRoute(hash: string): { name: string, params: object }` —— 解析 `#/wordbook/:id` 等
  - `navigate(path: string): void` —— 设置 `location.hash`
  - `renderNav(activeName: string): HTMLElement` —— 返回底部导航元素（首页/单词本/错词本）
  - `main.js` 暴露 `mountRoute(routes, outlet)` 监听 `hashchange` 并渲染

- [ ] **Step 1: 写失败测试 `src/router.test.js`**

```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/router.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/router.js`**

```js
const ROUTES = [
  { name: 'home', pattern: /^#?\/?$/, keys: [] },
  { name: 'wordbooks', pattern: /^#\/wordbooks$/, keys: [] },
  { name: 'wordbook', pattern: /^#\/wordbook\/([^/]+)$/, keys: ['id'] },
  { name: 'dictation-setup', pattern: /^#\/dictation-setup\/([^/]+)$/, keys: ['id'] },
  { name: 'dictation', pattern: /^#\/dictation\/([^/]+)$/, keys: ['id'] },
  { name: 'wrongbook', pattern: /^#\/wrongbook$/, keys: [] },
]

export function parseRoute(hash) {
  for (const route of ROUTES) {
    const m = hash.match(route.pattern)
    if (m) {
      const params = {}
      route.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]) })
      return { name: route.name, params }
    }
  }
  return { name: 'home', params: {} }
}

export function navigate(path) {
  location.hash = path
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/router.test.js`
Expected: PASS。

- [ ] **Step 5: 实现 `src/components/nav.js`**

```js
import { navigate } from '../router.js'

const ITEMS = [
  { name: 'home', label: '首页', path: '#/' },
  { name: 'wordbooks', label: '单词本', path: '#/wordbooks' },
  { name: 'wrongbook', label: '错词本', path: '#/wrongbook' },
]

export function renderNav(activeName) {
  const nav = document.createElement('nav')
  nav.className = 'bottom-nav'
  for (const item of ITEMS) {
    const btn = document.createElement('button')
    btn.className = 'nav-item' + (item.name === activeName ? ' active' : '')
    btn.textContent = item.label
    btn.addEventListener('click', () => navigate(item.path))
    nav.appendChild(btn)
  }
  return nav
}
```

- [ ] **Step 6: 重写 `src/main.js`**

```js
import { parseRoute } from './router.js'
import { renderHome } from './pages/home.js'
import { renderWordbooks } from './pages/wordbooks.js'
import { renderWordbookDetail } from './pages/wordbook-detail.js'
import { renderDictationSetup } from './pages/dictation-setup.js'
import { renderDictation } from './pages/dictation.js'
import { renderWrongbook } from './pages/wrongbook.js'

const PAGES = {
  home: renderHome,
  wordbooks: renderWordbooks,
  wordbook: renderWordbookDetail,
  'dictation-setup': renderDictationSetup,
  dictation: renderDictation,
  wrongbook: renderWrongbook,
}

async function render() {
  const app = document.getElementById('app')
  const { name, params } = parseRoute(location.hash)
  app.innerHTML = ''
  app.appendChild(await PAGES[name](params))
}

window.addEventListener('hashchange', render)
window.addEventListener('load', render)
```

- [ ] **Step 7: 加底部导航样式到 `src/styles/main.css`（追加）**

```css
.bottom-nav {
  position: fixed; left: 0; right: 0; bottom: 0; display: flex;
  background: #fff; border-top: 1px solid #ddd;
}
.bottom-nav .nav-item {
  flex: 1; background: none; color: #666; border-radius: 0; font-size: 0.95rem;
}
.bottom-nav .nav-item.active { color: var(--accent); font-weight: 600; }
.page-title { font-size: 1.4rem; margin: 8px 0 16px; }
.card { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
.muted { color: #888; }
.row { display: flex; gap: 8px; align-items: center; }
.row > * { flex: 1; }
```

- [ ] **Step 8: 创建占位页面以便启动（6 个文件，后续任务替换）**

为让 `main.js` 能跑起来，先建占位（每个文件先返回标题元素，对应任务再补全）。

`src/pages/home.js`:
```js
export async function renderHome() {
  const el = document.createElement('div')
  el.innerHTML = '<h1 class="page-title">首页</h1>'
  return el
}
```

`src/pages/wordbooks.js`:
```js
export async function renderWordbooks() {
  const el = document.createElement('div')
  el.innerHTML = '<h1 class="page-title">单词本</h1>'
  return el
}
```

`src/pages/wordbook-detail.js`:
```js
export async function renderWordbookDetail() {
  const el = document.createElement('div')
  el.innerHTML = '<h1 class="page-title">单词本详情</h1>'
  return el
}
```

`src/pages/dictation-setup.js`:
```js
export async function renderDictationSetup() {
  const el = document.createElement('div')
  el.innerHTML = '<h1 class="page-title">听写设置</h1>'
  return el
}
```

`src/pages/dictation.js`:
```js
export async function renderDictation() {
  const el = document.createElement('div')
  el.innerHTML = '<h1 class="page-title">听写</h1>'
  return el
}
```

`src/pages/wrongbook.js`:
```js
export async function renderWrongbook() {
  const el = document.createElement('div')
  el.innerHTML = '<h1 class="page-title">错词本</h1>'
  return el
}
```

- [ ] **Step 9: 跑全部测试 + 启动确认导航**

Run: `npm test`
Expected: PASS（含 router 测试）。
Run: `npm run dev`，手动点击底部导航在各占位页切换正常后 Ctrl+C。

- [ ] **Step 10: 提交**

```bash
git add -A
git commit -m "feat: 应用外壳、hash 路由与底部导航"
```

---

### Task 10: 单词本列表与创建页

**Files:**
- Modify: `src/pages/wordbooks.js`（整体重写）
- Test: `src/pages/wordbooks.test.js`

**Interfaces:**
- Consumes: `database.js`（`getWordbooks`, `createWordbook`）；`router.js`（`navigate`）；`nav.js`
- Produces: `renderWordbooks(): Promise<HTMLElement>` —— 列出单词本，提供"新建单词本"（名称 + 类型 en/zh），点条目跳 `#/wordbook/:id`

- [ ] **Step 1: 写失败测试 `src/pages/wordbooks.test.js`**

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests } from '../db/database.js'
import { renderWordbooks } from './wordbooks.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('单词本页', () => {
  it('空状态显示引导', async () => {
    const el = await renderWordbooks()
    expect(el.textContent).toContain('还没有单词本')
  })

  it('能新建并显示单词本', async () => {
    const el = await renderWordbooks()
    el.querySelector('[name=wb-name]').value = '五年级上 U3'
    el.querySelector('[name=wb-type]').value = 'en'
    el.querySelector('[data-action=create]').click()
    await new Promise((r) => setTimeout(r, 10))
    expect(el.textContent).toContain('五年级上 U3')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/pages/wordbooks.test.js`
Expected: FAIL（占位页无表单）。

- [ ] **Step 3: 实现 `src/pages/wordbooks.js`**

```js
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
    navigate(`#/wordbook/${wb.id}`)
  })

  el.appendChild(renderNav('wordbooks'))
  return el
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/pages/wordbooks.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/pages/wordbooks.js src/pages/wordbooks.test.js
git commit -m "feat: 单词本列表与创建页"
```

---

### Task 11: 单词本详情页（导入 / 添加 / 列表）

**Files:**
- Modify: `src/pages/wordbook-detail.js`（整体重写）
- Test: `src/pages/wordbook-detail.test.js`

**Interfaces:**
- Consumes: `database.js`（`getWordbooks`, `getWordsByBook`, `addWords`, `deleteWord`, `updateWord`, `deleteWordbook`）；`importer.js`（`parseImport`）；`phonetic.js`（`fetchPhoneticsBatch`）；`dates.js`（`todayStr`）；`router.js`；`nav.js`
- Produces: `renderWordbookDetail({ id }): Promise<HTMLElement>` —— 显示词条列表（英文带音标）、批量导入（先预览后入库、英文异步补音标）、手动添加、删词、删本、跳听写设置

- [ ] **Step 1: 写失败测试 `src/pages/wordbook-detail.test.js`**

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests, createWordbook, getWordsByBook } from '../db/database.js'

vi.mock('../services/phonetic.js', () => ({
  fetchPhoneticsBatch: vi.fn().mockResolvedValue(new Map([['apple', '/ˈæpəl/']])),
}))

import { renderWordbookDetail } from './wordbook-detail.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('单词本详情', () => {
  it('批量导入预览后入库', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const el = await renderWordbookDetail({ id: wb.id })
    el.querySelector('[name=import-text]').value = 'apple 苹果\nbanana 香蕉'
    el.querySelector('[data-action=preview]').click()
    await new Promise((r) => setTimeout(r, 0))
    expect(el.textContent).toContain('将导入 2')
    el.querySelector('[data-action=confirm-import]').click()
    await new Promise((r) => setTimeout(r, 20))
    const words = await getWordsByBook(wb.id)
    expect(words).toHaveLength(2)
    expect(words.map((w) => w.text).sort()).toEqual(['apple', 'banana'])
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/pages/wordbook-detail.test.js`
Expected: FAIL（占位页无导入功能）。

- [ ] **Step 3: 实现 `src/pages/wordbook-detail.js`**

```js
import {
  getWordbooks, getWordsByBook, addWords, deleteWord, deleteWordbook,
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
    const { updateWord } = await import('../db/database.js')
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/pages/wordbook-detail.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/pages/wordbook-detail.js src/pages/wordbook-detail.test.js
git commit -m "feat: 单词本详情（导入预览/添加/删词/音标回填）"
```

---

### Task 12: 听写会话状态 `dictation-session.js`

**Files:**
- Create: `src/services/dictation-session.js`
- Test: `src/services/dictation-session.test.js`

**Interfaces:**
- Consumes: 无（内存态，跨页面传递听写队列与结果）
- Produces:
  - `setSession(session): void` / `getSession(): session | null` / `clearSession(): void`
  - `session` 形状：`{ words: word[], bookType: 'en'|'zh', mode: 'spell'|'meaning', autoPlay: boolean, interval: number, results: Array<{wordId, correct}> }`
  - `speakTextFor(word, bookType, mode): { text, lang }` —— 决定朗读内容与语言：
    - `zh` 本 → `{ text: word.text, lang: 'zh-CN' }`
    - `en` 本 `mode=spell` → `{ text: word.text, lang: 'en-US' }`
    - `en` 本 `mode=meaning` → `{ text: word.meaning, lang: 'zh-CN' }`

- [ ] **Step 1: 写失败测试 `src/services/dictation-session.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { setSession, getSession, clearSession, speakTextFor } from './dictation-session.js'

describe('dictation session', () => {
  it('存取与清空', () => {
    setSession({ words: [{ id: 'a' }], bookType: 'en', mode: 'spell' })
    expect(getSession().words).toHaveLength(1)
    clearSession()
    expect(getSession()).toBe(null)
  })
})

describe('speakTextFor', () => {
  const w = { text: 'apple', meaning: '苹果' }
  it('中文本读词语', () => {
    expect(speakTextFor({ text: '葡萄' }, 'zh', 'spell')).toEqual({ text: '葡萄', lang: 'zh-CN' })
  })
  it('英文 spell 读英文', () => {
    expect(speakTextFor(w, 'en', 'spell')).toEqual({ text: 'apple', lang: 'en-US' })
  })
  it('英文 meaning 读中文', () => {
    expect(speakTextFor(w, 'en', 'meaning')).toEqual({ text: '苹果', lang: 'zh-CN' })
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/services/dictation-session.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/services/dictation-session.js`**

```js
let current = null

export function setSession(session) {
  current = { results: [], ...session }
}

export function getSession() {
  return current
}

export function clearSession() {
  current = null
}

export function speakTextFor(word, bookType, mode) {
  if (bookType === 'zh') return { text: word.text, lang: 'zh-CN' }
  if (mode === 'meaning') return { text: word.meaning, lang: 'zh-CN' }
  return { text: word.text, lang: 'en-US' }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/services/dictation-session.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/dictation-session.js src/services/dictation-session.test.js
git commit -m "feat: 听写会话状态与朗读内容映射"
```

---

### Task 13: 听写设置页

**Files:**
- Modify: `src/pages/dictation-setup.js`（整体重写）
- Test: `src/pages/dictation-setup.test.js`

**Interfaces:**
- Consumes: `database.js`（`getWordbooks`, `getWordsByBook`）；`dictation-session.js`（`setSession`）；`router.js`；`nav.js`
- Produces: `renderDictationSetup({ id }): Promise<HTMLElement>` —— 选范围（整本/勾选）、英文本选模式（spell/meaning）、自动播放开关与间隔，点"开始"建会话并跳 `#/dictation/:id`

- [ ] **Step 1: 写失败测试 `src/pages/dictation-setup.test.js`**

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests, createWordbook, addWords } from '../db/database.js'
import { getSession } from '../services/dictation-session.js'
import { renderDictationSetup } from './dictation-setup.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('听写设置', () => {
  it('整本开始建立会话', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    await addWords(wb.id, [{ text: 'apple', meaning: '苹果' }, { text: 'cat', meaning: '猫' }], '2026-06-29')
    const el = await renderDictationSetup({ id: wb.id })
    el.querySelector('[data-action=start]').click()
    await new Promise((r) => setTimeout(r, 10))
    const s = getSession()
    expect(s.words).toHaveLength(2)
    expect(s.bookType).toBe('en')
    expect(s.mode).toBe('spell')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/pages/dictation-setup.test.js`
Expected: FAIL（占位页）。

- [ ] **Step 3: 实现 `src/pages/dictation-setup.js`**

```js
import { getWordbooks, getWordsByBook } from '../db/database.js'
import { setSession } from '../services/dictation-session.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'

export async function renderDictationSetup({ id }) {
  const el = document.createElement('div')
  const wb = (await getWordbooks()).find((b) => b.id === id)
  if (!wb) {
    el.innerHTML = '<p>单词本不存在</p>'
    el.appendChild(renderNav('wordbooks'))
    return el
  }
  const isEn = wb.type === 'en'
  const words = await getWordsByBook(id)

  el.innerHTML = `
    <h1 class="page-title">听写设置 · ${wb.name}</h1>
    <div class="card">
      <h3>范围</h3>
      <label><input type="radio" name="scope" value="all" checked /> 整本（${words.length} 个）</label><br/>
      <label><input type="radio" name="scope" value="pick" /> 勾选部分</label>
      <div id="pick-list" style="display:none; margin-top:8px">
        ${words.map((w) => `<label style="display:block"><input type="checkbox" class="pick" value="${w.id}" checked /> ${w.text}</label>`).join('')}
      </div>
    </div>
    ${isEn ? `<div class="card"><h3>模式</h3>
      <label><input type="radio" name="mode" value="spell" checked /> 读英文 → 写英文</label><br/>
      <label><input type="radio" name="mode" value="meaning" /> 读中文 → 写英文</label>
    </div>` : ''}
    <div class="card">
      <h3>朗读</h3>
      <label><input type="checkbox" name="autoplay" /> 自动播放</label>
      <div class="row" style="margin-top:8px">
        <span style="flex:0 0 auto">间隔(秒)</span>
        <input type="number" name="interval" value="8" min="5" max="20" />
      </div>
    </div>
    <button data-action="start">开始听写</button>
  `

  el.querySelectorAll('[name=scope]').forEach((r) => {
    r.addEventListener('change', () => {
      el.querySelector('#pick-list').style.display =
        el.querySelector('[name=scope]:checked').value === 'pick' ? 'block' : 'none'
    })
  })

  el.querySelector('[data-action=start]').addEventListener('click', () => {
    const scope = el.querySelector('[name=scope]:checked').value
    let chosen = words
    if (scope === 'pick') {
      const ids = [...el.querySelectorAll('.pick:checked')].map((c) => c.value)
      chosen = words.filter((w) => ids.includes(w.id))
    }
    if (!chosen.length) return
    setSession({
      words: chosen,
      bookType: wb.type,
      mode: isEn ? el.querySelector('[name=mode]:checked').value : 'spell',
      autoPlay: el.querySelector('[name=autoplay]').checked,
      interval: Number(el.querySelector('[name=interval]').value) || 8,
    })
    navigate(`#/dictation/${id}`)
  })

  el.appendChild(renderNav('wordbooks'))
  return el
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/pages/dictation-setup.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/pages/dictation-setup.js src/pages/dictation-setup.test.js
git commit -m "feat: 听写设置页（范围/模式/自动播放）"
```

---

### Task 14: 听写进行页 + 核对批改

**Files:**
- Modify: `src/pages/dictation.js`（整体重写，含进行与核对两段）
- Test: `src/pages/dictation.test.js`

**Interfaces:**
- Consumes: `dictation-session.js`（`getSession`, `speakTextFor`）；`tts.js`（`speak`）；`review.js`（`applyReviewResult`）；`database.js`（`updateWord`）；`dates.js`（`todayStr`）；`router.js`；`nav.js`
- Produces: `renderDictation({ id }): Promise<HTMLElement>` —— 两阶段：
  1. **进行**：显示进度（第 n/N），"再读一遍"/"下一个"，自动播放可暂停，全程不显示答案
  2. **核对**：逐条列答案（英文/汉字 + 音标 + 释义 + 重听），✓/✗ 标记；完成后对每个词调 `applyReviewResult` 并 `updateWord`；提供"重练错词"

- [ ] **Step 1: 写失败测试 `src/pages/dictation.test.js`**

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('../services/tts.js', () => ({ speak: vi.fn() }))

import { __resetForTests, createWordbook, addWords, getWordsByBook } from '../db/database.js'
import { setSession } from '../services/dictation-session.js'
import { renderDictation } from './dictation.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('听写进行与核对', () => {
  it('进行页不显示答案，核对后写回复习状态', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const words = await addWords(wb.id, [{ text: 'apple', meaning: '苹果' }], '2026-06-29')
    setSession({ words, bookType: 'en', mode: 'spell', autoPlay: false, interval: 8 })

    const el = await renderDictation({ id: wb.id })
    // 进行页不出现答案
    expect(el.textContent).not.toContain('apple')
    // 走到核对
    el.querySelector('[data-action=next]').click()
    await new Promise((r) => setTimeout(r, 0))
    expect(el.textContent).toContain('apple') // 核对页显示答案
    // 标错
    el.querySelector('[data-mark="wrong"]').click()
    el.querySelector('[data-action=finish]').click()
    await new Promise((r) => setTimeout(r, 20))

    const after = await getWordsByBook(wb.id)
    expect(after[0].isWrong).toBe(1)
    expect(after[0].dueDate).toBe('2026-06-30')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/pages/dictation.test.js`
Expected: FAIL（占位页）。

- [ ] **Step 3: 实现 `src/pages/dictation.js`**

```js
import { getSession, speakTextFor, clearSession } from '../services/dictation-session.js'
import { speak } from '../services/tts.js'
import { applyReviewResult } from '../services/review.js'
import { updateWord } from '../db/database.js'
import { todayStr } from '../utils/dates.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'

export async function renderDictation({ id }) {
  const el = document.createElement('div')
  const session = getSession()
  if (!session || !session.words.length) {
    el.innerHTML = '<p>没有进行中的听写。</p>'
    el.appendChild(renderNav('home'))
    return el
  }

  const { words, bookType, mode } = session
  let index = 0
  let timer = null
  const marks = new Map() // wordId -> 'right' | 'wrong'

  function sayCurrent() {
    const { text, lang } = speakTextFor(words[index], bookType, mode)
    speak(text, lang)
  }

  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null }
  }

  function renderRunning() {
    clearTimer()
    el.innerHTML = `
      <h1 class="page-title">听写中</h1>
      <div class="card" style="text-align:center">
        <p style="font-size:1.6rem">第 ${index + 1} / ${words.length}</p>
        <div class="row" style="margin-top:16px">
          <button data-action="repeat" class="secondary">再读一遍</button>
          <button data-action="next">${index + 1 < words.length ? '下一个' : '完成听写'}</button>
        </div>
        ${session.autoPlay ? '<p class="muted" style="margin-top:8px">自动播放中，可点"暂停"</p><button data-action="pause" class="secondary" style="margin-top:8px">暂停</button>' : ''}
      </div>
    `
    el.querySelector('[data-action=repeat]').addEventListener('click', sayCurrent)
    el.querySelector('[data-action=next]').addEventListener('click', goNext)
    const pause = el.querySelector('[data-action=pause]')
    if (pause) pause.addEventListener('click', clearTimer)
    el.appendChild(renderNav('home'))
    sayCurrent()
    if (session.autoPlay) {
      timer = setTimeout(goNext, session.interval * 1000)
    }
  }

  function goNext() {
    clearTimer()
    if (index + 1 < words.length) {
      index++
      renderRunning()
    } else {
      renderCheck()
    }
  }

  function answerOf(w) {
    if (bookType === 'zh') return `${w.text}${w.pinyin ? ' ' + w.pinyin : ''}`
    return `${w.text}${w.phonetic ? ' ' + w.phonetic : ''}${w.meaning ? ' ' + w.meaning : ''}`
  }

  function renderCheck() {
    clearTimer()
    el.innerHTML = `
      <h1 class="page-title">核对批改</h1>
      <p class="muted">逐条对照纸上答案，标记对错。</p>
      <div id="check-list">
        ${words.map((w, i) => `<div class="card">
          <div class="row"><span><strong>${answerOf(w)}</strong></span>
          <button class="secondary" data-say="${i}" style="flex:0 0 auto">🔊</button></div>
          <div class="row" style="margin-top:8px">
            <button data-mark="right" data-id="${w.id}">✓ 对</button>
            <button class="danger" data-mark="wrong" data-id="${w.id}">✗ 错</button>
          </div>
        </div>`).join('')}
      </div>
      <button data-action="finish">完成，更新复习计划</button>
    `

    el.querySelectorAll('[data-say]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const w = words[Number(btn.dataset.say)]
        // 核对时始终朗读“被默写的目标”：英文本读英文、中文本读词语
        speak(w.text, bookType === 'en' ? 'en-US' : 'zh-CN')
      })
    })

    el.querySelectorAll('[data-mark]').forEach((btn) => {
      btn.addEventListener('click', () => {
        marks.set(btn.dataset.id, btn.dataset.mark)
        const card = btn.closest('.card')
        card.style.outline = btn.dataset.mark === 'right' ? '2px solid var(--accent)' : '2px solid var(--danger)'
      })
    })

    el.querySelector('[data-action=finish]').addEventListener('click', finish)
    el.appendChild(renderNav('home'))
  }

  async function finish() {
    const today = todayStr()
    for (const w of words) {
      const mark = marks.get(w.id) || 'right' // 未标记默认按对处理
      const correct = mark === 'right'
      await updateWord({ ...w, ...applyReviewResult(w, correct, today) })
    }
    const wrongWords = words.filter((w) => marks.get(w.id) === 'wrong')
    clearSession()
    if (wrongWords.length && confirm(`本次 ${wrongWords.length} 个错词，立即重练吗？`)) {
      setTimeout(() => {
        location.reload && location.reload()
      }, 0)
    }
    navigate('#/')
  }

  renderRunning()
  return el
}
```

注：核对页 🔊 重听始终朗读"被默写的目标"（英文本读英文、中文本读词语），无论听写模式如何，方便复核。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/pages/dictation.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/pages/dictation.js src/pages/dictation.test.js
git commit -m "feat: 听写进行页与核对批改（写回复习状态）"
```

---

### Task 15: 首页（今日复习）与错词本页

**Files:**
- Modify: `src/pages/home.js`（整体重写）
- Modify: `src/pages/wrongbook.js`（整体重写）
- Test: `src/pages/home.test.js`
- Test: `src/pages/wrongbook.test.js`

**Interfaces:**
- Consumes: `database.js`（`getDueWords`, `getWrongWords`, `getWordbooks`）；`dictation-session.js`（`setSession`）；`dates.js`（`todayStr`）；`router.js`；`nav.js`
- Produces:
  - `renderHome(): Promise<HTMLElement>` —— 显示今日待复习数量；"开始复习"用到期词建会话跳听写；下方单词本入口
  - `renderWrongbook(): Promise<HTMLElement>` —— 列错词；"重练错词"建会话跳听写
  - 复习/错词会话的 `bookType`/`mode`：跨本混合时统一按 `spell`，每词朗读用其所属本类型（句法上 home 用每词 `text` 朗读，bookType 取 `'mixed'`）

  说明：为支持跨本混合，`speakTextFor` 对未知 bookType 回退为按词自身判断——见下方步骤同时小改 `dictation-session.js`。

- [ ] **Step 1: 小改 `src/services/dictation-session.js` 支持混合本（先加测试）**

在 `src/services/dictation-session.test.js` 追加：

```js
import { describe as d2, it as i2, expect as e2 } from 'vitest'
import { speakTextFor as stf } from './dictation-session.js'

d2('混合本按词自判语言', () => {
  i2('英文词读英文、中文词读中文', () => {
    e2(stf({ text: 'apple', meaning: '苹果' }, 'mixed', 'spell')).toEqual({ text: 'apple', lang: 'en-US' })
    e2(stf({ text: '葡萄', meaning: '' }, 'mixed', 'spell')).toEqual({ text: '葡萄', lang: 'zh-CN' })
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/services/dictation-session.test.js`
Expected: FAIL（mixed 未处理）。

- [ ] **Step 3: 更新 `speakTextFor`（在 `dictation-session.js` 内替换该函数）**

```js
const CJK_RE = /[一-鿿]/

export function speakTextFor(word, bookType, mode) {
  if (bookType === 'zh') return { text: word.text, lang: 'zh-CN' }
  if (bookType === 'en') {
    if (mode === 'meaning') return { text: word.meaning, lang: 'zh-CN' }
    return { text: word.text, lang: 'en-US' }
  }
  // mixed：按词自身判断
  const lang = CJK_RE.test(word.text) ? 'zh-CN' : 'en-US'
  return { text: word.text, lang }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/services/dictation-session.test.js`
Expected: PASS。

- [ ] **Step 5: 写首页失败测试 `src/pages/home.test.js`**

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests, createWordbook, addWords, updateWord, getWordsByBook } from '../db/database.js'
import { getSession } from '../services/dictation-session.js'
import { renderHome } from './home.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('首页今日复习', () => {
  it('统计到期词并能开始复习', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    await addWords(wb.id, [{ text: 'apple', meaning: '苹果' }], '2026-06-29')
    const el = await renderHome()
    expect(el.textContent).toMatch(/今日待复习/)
    el.querySelector('[data-action=review]')?.click()
    await new Promise((r) => setTimeout(r, 10))
    expect(getSession()?.words.length).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 6: 实现 `src/pages/home.js`**

```js
import { getDueWords, getWordbooks } from '../db/database.js'
import { setSession } from '../services/dictation-session.js'
import { todayStr } from '../utils/dates.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'

export async function renderHome() {
  const el = document.createElement('div')
  const due = await getDueWords(todayStr())
  const books = await getWordbooks()

  el.innerHTML = `
    <h1 class="page-title">单词听写助手</h1>
    <div class="card">
      <p style="font-size:1.2rem">今日待复习 <strong>${due.length}</strong> 个词</p>
      ${due.length ? '<button data-action="review">开始复习听写</button>' : '<p class="muted">今天没有需要复习的词。</p>'}
    </div>
    <div class="card">
      <h3>我的单词本</h3>
      ${books.length
        ? books.map((b) => `<div class="row" style="margin:6px 0"><a href="#/wordbook/${b.id}">${b.name}</a></div>`).join('')
        : '<p class="muted">还没有单词本，去“单词本”新建一个吧。</p>'}
    </div>
  `

  const reviewBtn = el.querySelector('[data-action=review]')
  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      setSession({ words: due, bookType: 'mixed', mode: 'spell', autoPlay: false, interval: 8 })
      navigate(`#/dictation/review`)
    })
  }

  el.appendChild(renderNav('home'))
  return el
}
```

- [ ] **Step 7: 实现 `src/pages/wrongbook.js`**

```js
import { getWrongWords } from '../db/database.js'
import { setSession } from '../services/dictation-session.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'

export async function renderWrongbook() {
  const el = document.createElement('div')
  const wrong = await getWrongWords()

  el.innerHTML = `
    <h1 class="page-title">错词本</h1>
    <div class="card">
      <p>共 <strong>${wrong.length}</strong> 个错词</p>
      ${wrong.length ? '<button data-action="retry">重练错词</button>' : '<p class="muted">暂无错词，继续加油！</p>'}
    </div>
    <div>
      ${wrong.map((w) => `<div class="card"><strong>${w.text}</strong> <span class="muted">${w.phonetic || ''} ${w.meaning || w.pinyin || ''}</span></div>`).join('')}
    </div>
  `

  const retry = el.querySelector('[data-action=retry]')
  if (retry) {
    retry.addEventListener('click', () => {
      setSession({ words: wrong, bookType: 'mixed', mode: 'spell', autoPlay: false, interval: 8 })
      navigate('#/dictation/wrong')
    })
  }

  el.appendChild(renderNav('wrongbook'))
  return el
}
```

- [ ] **Step 8: 在 `router.js` 放宽 dictation 路由匹配复习/错词入口**

`dictation` 的 `pattern` 已是 `#\/dictation\/([^/]+)$`，`#/dictation/review`、`#/dictation/wrong` 均能匹配（`id` 仅作占位，听写页只读 session）。无需改动；运行下方测试确认。

- [ ] **Step 9: 写错词本测试 `src/pages/wrongbook.test.js`**

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { __resetForTests, createWordbook, addWords, updateWord, getWordsByBook } from '../db/database.js'
import { renderWrongbook } from './wrongbook.js'

beforeEach(() => {
  __resetForTests()
  indexedDB.deleteDatabase('word-dictation')
})

describe('错词本页', () => {
  it('显示错词数量', async () => {
    const wb = await createWordbook({ name: '本', type: 'en' })
    const [w] = await addWords(wb.id, [{ text: 'apple', meaning: '苹果' }], '2026-06-29')
    await updateWord({ ...w, isWrong: 1 })
    const el = await renderWrongbook()
    expect(el.textContent).toContain('共 1 个错词')
    expect(el.textContent).toContain('apple')
  })
})
```

- [ ] **Step 10: 跑相关测试确认通过**

Run: `npx vitest run src/pages/home.test.js src/pages/wrongbook.test.js src/services/dictation-session.test.js`
Expected: PASS。

- [ ] **Step 11: 提交**

```bash
git add -A
git commit -m "feat: 首页今日复习与错词本（跨本混合听写）"
```

---

### Task 16: 数据备份 UI（导出 / 导入）

**Files:**
- Create: `src/pages/backup-section.js`（可复用区块）
- Modify: `src/pages/home.js`（在首页底部加入备份区块）
- Test: `src/pages/backup-section.test.js`

**Interfaces:**
- Consumes: `database.js`（`getAllData`, `replaceAllData`）；`backup.js`（`serializeBackup`, `parseBackup`）；`dates.js`（`todayStr`）
- Produces:
  - `renderBackupSection(): HTMLElement` —— "导出备份"下载 `.json`；"导入备份"读取文件、确认覆盖后 `replaceAllData`
  - `triggerDownload(filename, text): void`（内部，可被测试通过注入替身验证）

- [ ] **Step 1: 写失败测试 `src/pages/backup-section.test.js`**

```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/pages/backup-section.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/pages/backup-section.js`**

```js
import { getAllData, replaceAllData } from '../db/database.js'
import { serializeBackup, parseBackup } from '../services/backup.js'
import { todayStr } from '../utils/dates.js'

export function triggerDownload(filename, text, doc = document) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = doc.createElement('a')
  a.href = url
  a.download = filename
  doc.body.appendChild(a)
  a.click()
  doc.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function applyImportText(jsonStr) {
  const { wordbooks, words } = parseBackup(jsonStr)
  await replaceAllData({ wordbooks, words })
}

export function renderBackupSection() {
  const el = document.createElement('div')
  el.className = 'card'
  el.innerHTML = `
    <h3>数据备份</h3>
    <div class="row">
      <button data-action="export" class="secondary">导出备份</button>
      <label class="row" style="flex:1">
        <span class="secondary" style="display:inline-block;padding:12px;border-radius:10px;text-align:center;cursor:pointer">导入备份</span>
        <input type="file" accept="application/json" data-action="import-file" style="display:none" />
      </label>
    </div>
    <p class="muted" id="backup-msg"></p>
  `

  el.querySelector('[data-action=export]').addEventListener('click', async () => {
    const { wordbooks, words } = await getAllData()
    triggerDownload(`单词助手备份-${todayStr()}.json`, serializeBackup(wordbooks, words, todayStr()))
  })

  el.querySelector('[data-action=import-file]').addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!confirm('导入会覆盖现有全部数据，确定继续？')) return
    try {
      const text = await file.text()
      await applyImportText(text)
      el.querySelector('#backup-msg').textContent = '导入成功，刷新后生效。'
    } catch (err) {
      el.querySelector('#backup-msg').textContent = '导入失败：' + err.message
    }
  })

  return el
}
```

- [ ] **Step 4: 在 `src/pages/home.js` 底部插入备份区块**

在 `home.js` 顶部加 `import { renderBackupSection } from './backup-section.js'`，并在 `el.appendChild(renderNav('home'))` 之前加：

```js
  el.appendChild(renderBackupSection())
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run src/pages/backup-section.test.js`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: 数据导出/导入备份"
```

---

### Task 17: PWA 配置（离线 + 添加到主屏幕）

**Files:**
- Modify: `vite.config.js`
- Create: `public/icon-192.png`（占位图标，512 同理）
- Create: `public/icon-512.png`
- Test: 手动验证（构建 + 安装）

**Interfaces:**
- Consumes: 全部已完成页面
- Produces: 可安装 PWA，含 manifest 与离线缓存

- [ ] **Step 1: 安装并配置 `vite-plugin-pwa`（已在 Task 1 装好）更新 `vite.config.js`**

```js
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: { host: true },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '单词听写助手',
        short_name: '听写助手',
        description: '帮助儿童按遗忘曲线复习与听写单词',
        theme_color: '#2e7d32',
        background_color: '#f5f5f5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.dictionaryapi\.dev\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'dictionary-api', expiration: { maxEntries: 500 } },
          },
        ],
      },
    }),
  ],
})
```

- [ ] **Step 2: 放置图标**

准备两张纯色方形 PNG 占位图（192×192、512×512，可用任意绘图工具或在线生成），分别存为 `public/icon-192.png`、`public/icon-512.png`。

- [ ] **Step 3: 构建并本地预览**

Run: `npm run build && npm run preview`
Expected: 构建无错；浏览器打开预览地址，DevTools → Application 能看到 manifest 与 Service Worker 已注册。

- [ ] **Step 4: 验证离线**

在 DevTools → Network 勾选 Offline 后刷新，核心页面（首页/单词本/听写）仍可打开。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: PWA 离线缓存与添加到主屏幕"
```

---

### Task 18: 全量回归与收尾

**Files:**
- Modify: `README.md`（新建）

**Interfaces:**
- Consumes: 全部
- Produces: 使用说明 + 全绿测试

- [ ] **Step 1: 跑全量测试**

Run: `npm test`
Expected: 全部 PASS。

- [ ] **Step 2: 写 `README.md`**

```markdown
# 单词听写助手

帮助儿童按遗忘曲线复习并听写中/英文单词的本地 PWA。

## 开发
- `npm install`
- `npm run dev` 本地开发
- `npm test` 运行测试
- `npm run build` 打包，`npm run preview` 预览

## 功能
- 中/英文单词本：批量导入 + 手动添加，英文自动获取音标
- 听写：TTS 朗读、纸上手写、手动/自动播放、再读一遍
- 核对批改：标记对错、错词入错词本、重练
- 遗忘曲线复习：间隔 [1,2,4,7,15,30] 天，首页"今日待复习"
- 数据本地存储 + 导出/导入备份

## 部署
`npm run build` 后将 `dist/` 部署到任意静态服务器，手机浏览器打开可"添加到主屏幕"。
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "docs: 使用说明 README"
```

---

## Self-Review

**1. Spec 覆盖核对：**
- §3 页面（首页/单词本/详情/听写设置/听写进行/核对/错词本）→ Task 9–15 ✓
- §4 数据结构（含 phonetic、isWrong 数字、索引）→ Task 7 ✓
- §5 复习算法 → Task 3，写回 → Task 14 ✓
- §6 TTS 映射 → Task 8 + Task 12 ✓
- §7 音标获取（导入时、降级、批量）→ Task 5 + Task 11 回填 ✓
- §8 导入格式（多分隔符、预览）→ Task 4 + Task 11 ✓
- §9 备份导出/导入 → Task 6 + Task 16 ✓
- §10 交互（进行页不显答案、自动间隔默认 8、空状态）→ Task 11/13/14/10 ✓
- PWA 离线/加主屏 → Task 17 ✓

**2. 占位符扫描：** 无 TODO/TBD；每个代码步骤含完整代码。图标为二进制占位，已在步骤中说明生成方式。

**3. 类型一致性：** `word` 字段（`text/meaning/pinyin/phonetic/level/dueDate/isWrong/lastReviewedAt`）在 Task 7 定义，后续 Task 11/14/15 一致使用；`speakTextFor(word, bookType, mode)` 签名在 Task 12 定义、Task 14/15 沿用并在 Task 15 扩展 `mixed`；`setSession` 形状跨 Task 12/13/14/15 一致。
