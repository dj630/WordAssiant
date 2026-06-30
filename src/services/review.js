import { addDaysStr } from '../utils/dates.js'

export const INTERVALS = [1, 2, 4, 7, 15, 30]
const MAX_LEVEL = INTERVALS.length - 1

export function newReviewState(today) {
  return { level: 0, dueDate: today, isWrong: 0, lastReviewedAt: null }
}

export function applyReviewResult(word, correct, today) {
  if (correct) {
    const level = Math.min(word.level + 1, MAX_LEVEL)
    return {
      level,
      dueDate: addDaysStr(today, INTERVALS[level]),
      isWrong: 0,
      lastReviewedAt: today,
    }
  }
  return {
    level: 0,
    dueDate: addDaysStr(today, 1),
    isWrong: 1,
    lastReviewedAt: today,
  }
}
