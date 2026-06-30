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
