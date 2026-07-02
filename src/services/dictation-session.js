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
