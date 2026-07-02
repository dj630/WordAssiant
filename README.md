# 单词听写助手

帮助儿童按遗忘曲线复习并听写中/英文单词的本地优先 PWA（渐进式 Web 应用）。
纯前端、免账号、可离线、可"添加到主屏幕"。

## 功能

- **中/英文单词本**：批量粘贴导入（自动识别制表符/逗号/空格分隔）+ 手动添加；英文词导入时自动联网获取并缓存音标。
- **听写**：浏览器 TTS 朗读（中文 `zh-CN`、英文 `en-US`），孩子在纸上手写；支持手动 / 自动播放（间隔 5–20 秒，默认 8）与"再读一遍"。英文本可选「读英文写英文」或「读中文写英文」。
- **核对批改**：逐条对照答案（含音标/释义/🔊 重听），标记对错；错词进入错词本，可立即重练。
- **遗忘曲线复习**：简化间隔档位 `[1, 2, 4, 7, 15, 30]` 天，首页汇总"今日待复习"（跨单词本混合听写）。
- **数据备份**：全部数据本地存储（IndexedDB），一键导出 / 导入 `.json` 兜底备份。

## 开发

- `npm install` 安装依赖
- `npm run dev` 本地开发（Vite）
- `npm test` 运行测试（Vitest，含 fake-indexeddb / jsdom）
- `npm run build` 打包，`npm run preview` 预览生产构建（可在 DevTools → Application 查看 manifest / Service Worker）

## 技术栈

原生 JavaScript（无前端框架）+ Vite + `vite-plugin-pwa`；数据层 IndexedDB；朗读用 Web Speech API；音标取自 [Free Dictionary API](https://api.dictionaryapi.dev)（仅录入英文词时调用一次并缓存，日常使用无需联网）。

设计文档见 `docs/superpowers/specs/2026-06-29-word-dictation-tool-design.md`。

## 部署

`npm run build` 后，将 `dist/` 部署到任意静态服务器，手机浏览器打开即可"添加到主屏幕"，离线使用。

## 仓库

```
git remote add origin https://gitlab.haochang.tv/jing/childwordassiant.git
git push -u origin <branch>
```
