import { describe, it, expect } from 'vitest'
import { todayStr, addDaysStr, isDueOnOrBefore } from './dates.js'

describe('dates', () => {
  it('todayStr 用本地时间格式化为 YYYY-MM-DD', () => {
    expect(todayStr(new Date(2026, 5, 29))).toBe('2026-06-29')
    expect(todayStr(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('addDaysStr 跨月加天', () => {
    expect(addDaysStr('2026-06-29', 2)).toBe('2026-07-01')
    expect(addDaysStr('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysStr('2026-06-29', 0)).toBe('2026-06-29')
  })

  it('isDueOnOrBefore 按天比较', () => {
    expect(isDueOnOrBefore('2026-06-28', '2026-06-29')).toBe(true)
    expect(isDueOnOrBefore('2026-06-29', '2026-06-29')).toBe(true)
    expect(isDueOnOrBefore('2026-06-30', '2026-06-29')).toBe(false)
  })
})
