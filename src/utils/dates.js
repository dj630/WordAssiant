function pad2(n) {
  return String(n).padStart(2, '0')
}

export function todayStr(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

export function addDaysStr(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return todayStr(dt)
}

export function isDueOnOrBefore(dueStr, todayStr) {
  return dueStr <= todayStr
}
