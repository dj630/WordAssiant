import { getSession, speakTextFor, clearSession } from '../services/dictation-session.js'
import { speak } from '../services/tts.js'
import { applyReviewResult } from '../services/review.js'
import { updateWord } from '../db/database.js'
import { todayStr } from '../utils/dates.js'
import { navigate } from '../router.js'
import { renderNav } from '../components/nav.js'

export async function renderDictation({ id }) {
  const el = document.createElement('div')
  const session = getSession()
  if (!session || !session.words.length) {
    el.innerHTML = '<p>没有进行中的听写。</p>'
    el.appendChild(renderNav('home'))
    return el
  }

  const { bookType, mode } = session
  let words = session.words
  let index = 0
  let timer = null
  const marks = new Map() // wordId -> 'right' | 'wrong'

  function sayCurrent() {
    const { text, lang } = speakTextFor(words[index], bookType, mode)
    speak(text, lang)
  }

  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null }
  }

  function renderRunning() {
    clearTimer()
    el.innerHTML = `
      <h1 class="page-title">听写中</h1>
      <div class="card" style="text-align:center">
        <p style="font-size:1.6rem">第 ${index + 1} / ${words.length}</p>
        <div class="row" style="margin-top:16px">
          <button data-action="repeat" class="secondary">再读一遍</button>
          <button data-action="next">${index + 1 < words.length ? '下一个' : '完成听写'}</button>
        </div>
        ${session.autoPlay ? '<p class="muted" style="margin-top:8px">自动播放中，可点"暂停"</p><button data-action="pause" class="secondary" style="margin-top:8px">暂停</button>' : ''}
      </div>
    `
    el.querySelector('[data-action=repeat]').addEventListener('click', sayCurrent)
    el.querySelector('[data-action=next]').addEventListener('click', goNext)
    const pause = el.querySelector('[data-action=pause]')
    if (pause) pause.addEventListener('click', clearTimer)
    el.appendChild(renderNav('home'))
    sayCurrent()
    if (session.autoPlay) {
      timer = setTimeout(goNext, session.interval * 1000)
    }
  }

  function goNext() {
    clearTimer()
    if (index + 1 < words.length) {
      index++
      renderRunning()
    } else {
      renderCheck()
    }
  }

  function answerOf(w) {
    if (bookType === 'zh') return `${w.text}${w.pinyin ? ' ' + w.pinyin : ''}`
    return `${w.text}${w.phonetic ? ' ' + w.phonetic : ''}${w.meaning ? ' ' + w.meaning : ''}`
  }

  function renderCheck() {
    clearTimer()
    el.innerHTML = `
      <h1 class="page-title">核对批改</h1>
      <p class="muted">逐条对照纸上答案，标记对错。</p>
      <div id="check-list">
        ${words.map((w, i) => `<div class="card">
          <div class="row"><span><strong>${answerOf(w)}</strong></span>
          <button class="secondary" data-say="${i}" style="flex:0 0 auto">🔊</button></div>
          <div class="row" style="margin-top:8px">
            <button data-mark="right" data-id="${w.id}">✓ 对</button>
            <button class="danger" data-mark="wrong" data-id="${w.id}">✗ 错</button>
          </div>
        </div>`).join('')}
      </div>
      <button data-action="finish">完成，更新复习计划</button>
    `

    el.querySelectorAll('[data-say]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const w = words[Number(btn.dataset.say)]
        // 核对时始终朗读“被默写的目标”：英文本读英文、中文本读词语
        speak(w.text, bookType === 'en' ? 'en-US' : 'zh-CN')
      })
    })

    el.querySelectorAll('[data-mark]').forEach((btn) => {
      btn.addEventListener('click', () => {
        marks.set(btn.dataset.id, btn.dataset.mark)
        const card = btn.closest('.card')
        card.style.outline = btn.dataset.mark === 'right' ? '2px solid var(--accent)' : '2px solid var(--danger)'
      })
    })

    el.querySelector('[data-action=finish]').addEventListener('click', finish)
    el.appendChild(renderNav('home'))
  }

  async function finish() {
    const today = todayStr()
    for (const w of words) {
      const mark = marks.get(w.id) || 'right' // 未标记默认按对处理
      const correct = mark === 'right'
      await updateWord({ ...w, ...applyReviewResult(w, correct, today) })
    }
    const wrongWords = words.filter((w) => marks.get(w.id) === 'wrong')
    if (wrongWords.length && confirm(`本次 ${wrongWords.length} 个错词，立即重练吗？`)) {
      // 就地开启一轮只含错词的重练，无需重载页面或丢失会话
      words = wrongWords
      index = 0
      marks.clear()
      renderRunning()
      return
    }
    clearSession()
    navigate('#/')
  }

  renderRunning()
  return el
}
