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
