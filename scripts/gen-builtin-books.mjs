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
