export async function renderHome() {
  const el = document.createElement('div')
  el.innerHTML = '<h1 class="page-title">首页</h1>'
  return el
}
