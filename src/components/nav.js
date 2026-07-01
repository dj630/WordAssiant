import { navigate } from '../router.js'

const ITEMS = [
  { name: 'home', label: '首页', path: '#/' },
  { name: 'wordbooks', label: '单词本', path: '#/wordbooks' },
  { name: 'wrongbook', label: '错词本', path: '#/wrongbook' },
]

export function renderNav(activeName) {
  const nav = document.createElement('nav')
  nav.className = 'bottom-nav'
  for (const item of ITEMS) {
    const btn = document.createElement('button')
    btn.className = 'nav-item' + (item.name === activeName ? ' active' : '')
    btn.textContent = item.label
    btn.addEventListener('click', () => navigate(item.path))
    nav.appendChild(btn)
  }
  return nav
}
