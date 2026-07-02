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
