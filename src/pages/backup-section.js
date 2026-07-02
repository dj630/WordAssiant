import { getAllData, replaceAllData } from '../db/database.js'
import { serializeBackup, parseBackup } from '../services/backup.js'
import { todayStr } from '../utils/dates.js'

export function triggerDownload(filename, text, doc = document) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = doc.createElement('a')
  a.href = url
  a.download = filename
  doc.body.appendChild(a)
  a.click()
  doc.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function applyImportText(jsonStr) {
  const { wordbooks, words } = parseBackup(jsonStr)
  await replaceAllData({ wordbooks, words })
}

export function renderBackupSection() {
  const el = document.createElement('div')
  el.className = 'card'
  el.innerHTML = `
    <h3>数据备份</h3>
    <div class="row">
      <button data-action="export" class="secondary">导出备份</button>
      <label class="row" style="flex:1">
        <span class="secondary" style="display:inline-block;padding:12px;border-radius:10px;text-align:center;cursor:pointer">导入备份</span>
        <input type="file" accept="application/json" data-action="import-file" style="display:none" />
      </label>
    </div>
    <p class="muted" id="backup-msg"></p>
  `

  el.querySelector('[data-action=export]').addEventListener('click', async () => {
    const { wordbooks, words } = await getAllData()
    triggerDownload(`单词助手备份-${todayStr()}.json`, serializeBackup(wordbooks, words, todayStr()))
  })

  el.querySelector('[data-action=import-file]').addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!confirm('导入会覆盖现有全部数据，确定继续？')) return
    try {
      const text = await file.text()
      await applyImportText(text)
      el.querySelector('#backup-msg').textContent = '导入成功，刷新后生效。'
    } catch (err) {
      el.querySelector('#backup-msg').textContent = '导入失败：' + err.message
    }
  })

  return el
}
