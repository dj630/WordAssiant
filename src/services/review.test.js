import { describe, it, expect } from 'vitest'
import { INTERVALS, newReviewState, applyReviewResult } from './review.js'

describe('review 算法', () => {
  it('档位天数固定', () => {
    expect(INTERVALS).toEqual([1, 2, 4, 7, 15, 30])
  })

  it('新词：level0、当天到期、不在错词本', () => {
    expect(newReviewState('2026-06-29')).toEqual({
      level: 0, dueDate: '2026-06-29', isWrong: 0, lastReviewedAt: null,
    })
  })

  it('答对：升一档，按新档位天数排期', () => {
    const r = applyReviewResult({ level: 0 }, true, '2026-06-29')
    expect(r.level).toBe(1)
    expect(r.dueDate).toBe('2026-07-01') // +2 天
    expect(r.isWrong).toBe(0)
    expect(r.lastReviewedAt).toBe('2026-06-29')
  })

  it('答对到顶封顶在 30 天档', () => {
    const r = applyReviewResult({ level: 5 }, true, '2026-06-29')
    expect(r.level).toBe(5)
    expect(r.dueDate).toBe('2026-07-29') // +30 天
  })

  it('答错：退回 level0，明天再练，进错词本', () => {
    const r = applyReviewResult({ level: 4 }, false, '2026-06-29')
    expect(r.level).toBe(0)
    expect(r.dueDate).toBe('2026-06-30') // +1 天
    expect(r.isWrong).toBe(1)
    expect(r.lastReviewedAt).toBe('2026-06-29')
  })
})
