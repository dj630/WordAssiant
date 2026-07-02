import { getDueWords, getWordbooks } from '../db/database.js'
import { setSession } from '../services/dictation-session.js'
import { todayStr } from '../utils/dates.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'
import { renderBackupSection } from './backup-section.js'

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

  el.appendChild(renderBackupSection())
  el.appendChild(renderNav('home'))
  return el
}
