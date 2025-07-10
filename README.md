# 🚀 QuickLauncher

<p align="center">
  <a href="https://github.com/WaveHex/quicklauncher/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/yourusername/quicklauncher/ci.yml?branch=main&label=build&logo=github" alt="build status" />
  </a>
  <a href="https://github.com/WaveHex/quicklauncher/releases/latest">
    <img src="https://img.shields.io/github/downloads/yourusername/quicklauncher/total?label=downloads&logo=github" alt="downloads" />
  </a>
  <a href="https://github.com/WaveHex/quicklauncher/stargazers">
    <img src="https://img.shields.io/github/stars/yourusername/quicklauncher?style=social" alt="GitHub stars" />
  </a>
  <a href="https://github.com/WaveHex/quicklauncher/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/yourusername/quicklauncher?color=blue" alt="license" />
  </a>
  <img src="https://img.shields.io/badge/platform-windows-blue?logo=windows" alt="platform" />
  <img src="https://img.shields.io/badge/built%20with-React%20%7C%20Vite%20%7C%20Tauri-2ea44f?logo=react" alt="tech stack" />
</p>


**QuickLauncher** — это современное приложение для мгновенного запуска программ, файлов и команд на Windows. Минимализм, кастомизация, удобство и скорость — всё, что нужно для продуктивной работы!

[🌐 Открыть лендинг](https://WaveHex.github.io/quicklauncher/landing.html)

---

## ✨ Возможности

- ⚡ **Мгновенный запуск** приложений, файлов и команд
- 🎨 **Кастомизация**: фон, шрифты, цвета, темы
- 🔔 **Уведомления**: toast и системные (Tauri)
- 🛡️ **Безопасность**: работает локально, не требует интернета
- 🖱️ **Системный трей**: быстрый доступ к функциям
- 💾 **Импорт/экспорт** профилей
- 🖼️ **Галерея**: предпросмотр профиля и настроек

---

## 🖼️ Скриншоты

| Главный экран | Настройки | О нас |
|:---:|:---:|:---:|
| ![](src/landing/screenshots/main.png) | ![](src/landing/screenshots/settings.png) | ![](src/landing/screenshots/Bloop.png) |

---

## 🚩 Как начать

1. **Скачать** последнюю версию: [GitHub Releases](https://github.com/WaveHex/quicklauncher/releases/latest)
2. **Установить** и запустить приложение
3. **Создать профиль** и добавить свои приложения/файлы
4. **Пользоваться быстрым поиском и запуском!**

---

## 🛠️ Разработка

```bash
# Установить зависимости
npm install

# Запустить dev-режим (основное приложение)
npm run dev

# Запустить лендинг (открой http://localhost:5173/landing.html)
npm run dev

# Production-сборка (app + landing)
npm run build
```

---

## 🚀 Деплой лендинга на GitHub Pages

1. В `vite.config.ts` укажи:
   ```js
   base: '/quicklauncher/',
   ```
2. Собери проект:
   ```bash
   npm run build
   ```
3. Задеплой содержимое `dist/` в ветку `gh-pages` (или используй `npm run deploy` с [gh-pages](https://www.npmjs.com/package/gh-pages))
4. В настройках репозитория выбери ветку `gh-pages` для GitHub Pages

---

## 📦 Технологии
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tauri](https://tauri.app/)
- [Lucide React](https://lucide.dev/)

---

## 📄 Лицензия

Иконка и приложение — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

---

## 🤝 Обратная связь и вклад

- [Открыть issue](https://github.com/WaveHex/quicklauncher/issues)
- [Создать pull request](https://github.com/WaveHex/quicklauncher/pulls)

---

**QuickLauncher** — твой быстрый старт каждый день!
