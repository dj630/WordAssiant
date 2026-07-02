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
