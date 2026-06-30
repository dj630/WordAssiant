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
