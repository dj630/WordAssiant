export function buildBackup(wordbooks, words, exportedAt) {
  return { version: 1, exportedAt, wordbooks, words }
}

export function serializeBackup(wordbooks, words, exportedAt) {
  return JSON.stringify(buildBackup(wordbooks, words, exportedAt), null, 2)
}

export function parseBackup(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (!data || !Array.isArray(data.wordbooks) || !Array.isArray(data.words)) {
    throw new Error('备份文件格式不正确')
  }
  return { wordbooks: data.wordbooks, words: data.words }
}
