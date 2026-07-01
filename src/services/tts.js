export function pickVoice(voices, lang) {
  const exact = voices.find((v) => v.lang === lang)
  if (exact) return exact
  const prefix = lang.split('-')[0]
  const byPrefix = voices.find((v) => v.lang && v.lang.split('-')[0] === prefix)
  return byPrefix || null
}

export function checkVoiceAvailability(voices) {
  return {
    en: voices.some((v) => v.lang && v.lang.startsWith('en')),
    zh: voices.some((v) => v.lang && v.lang.startsWith('zh')),
  }
}

export function speak(text, lang, synth = window.speechSynthesis, VoiceClass = window.SpeechSynthesisUtterance) {
  if (!synth) return
  synth.cancel()
  const u = new VoiceClass(text)
  u.lang = lang
  const voice = pickVoice(synth.getVoices(), lang)
  if (voice) u.voice = voice
  synth.speak(u)
}
