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
