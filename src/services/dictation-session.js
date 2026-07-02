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
