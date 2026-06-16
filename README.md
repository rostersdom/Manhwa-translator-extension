# Manhwa Translator

Расширение для браузеров. Переводит текст манхвы с китайского, корейского и японского. Работает на OCR в браузере — никаких серверов.

## Совместимость

| Браузер | Поддержка |
|---|---|
| Google Chrome | ✅ |
| Opera GX / Opera | ✅ |
| Microsoft Edge | ✅ |
| Brave | ✅ |
| Vivaldi | ✅ |
| Yandex Browser | ✅ |
| Firefox | ⚠️ частичная (Manifest V3) |

Расширение использует Manifest V3. Все Chromium-браузеры работают без изменений.

## Установка

### Chrome / Edge / Brave / Vivaldi / Yandex

1. Открой `chrome://extensions` (или `edge://extensions` и т.д.)
2. Включи **«Режим разработчика»** (Developer mode) в правом верхнем углу
3. Нажми **«Загрузить распакованное расширение»** (Load unpacked)
4. Выбери папку `manhwa-translator`

### Opera GX / Opera

1. Открой `opera://extensions`
2. Включи **«Режим разработчика»** в правом верхнем углу
3. Нажми **«Загрузить распакованное расширение»**
4. Выбери папку `manhwa-translator`

### Firefox

1. Открой `about:debugging#/runtime/this-firefox`
2. Нажми **«Загрузить временный дополнитель»** (Load Temporary Add-on)
3. Выбери файл `manifest.json` внутри папки `manhwa-translator`

> Firefox: расширение будет удалено после закрытия браузера. Для постоянной установки нужно публиковать в Firefox Add-ons.

## Возможности

- Перевод текста при наведении
- OCR на картинках (Tesseract.js, работает офлайн)
- Выделение области для OCR
- Пиньинь для китайского
- Романизация для корейского
- Кэширование переводов
- История переводов
- Экспорт в текстовый файл

## Горячие клавиши

| Комбинация | Действие |
|---|---|
| `Ctrl+Shift+T` | Вкл/выкл перевод |
| `Ctrl+Shift+H` | Вкл/выкл наведение |
| `Ctrl+Shift+R` | Выделить область для OCR |
| `Ctrl+Shift+E` | Экспорт текущего перевода |
| `Esc` | Закрыть перевод |

## Как пользоваться

**Текст:** наведи на элемент с CJK-текстом — появится тултип с переводом.

**Картинка:** наведи на `<img>` или `<canvas>` — OCR распознает текст и переведёт.

**Область:** нажми `Ctrl+Shift+R`, выдели область на экране.

**Закрепление:** клик по тултипу — он останется на экране.

## Структура

```
manhwa-translator/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── popup.css
├── lib/
│   └── tesseract.min.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── LICENSE
└── README.md
```

## Лицензия

MIT

---

# Manhwa Translator

Browser extension. Translates manhwa text from Chinese, Korean, and Japanese. Uses in-browser OCR — no servers involved.

## Compatibility

| Browser | Support |
|---|---|
| Google Chrome | ✅ |
| Opera GX / Opera | ✅ |
| Microsoft Edge | ✅ |
| Brave | ✅ |
| Vivaldi | ✅ |
| Yandex Browser | ✅ |
| Firefox | ⚠️ partial (Manifest V3) |

Uses Manifest V3. Works on all Chromium-based browsers without changes.

## Installation

### Chrome / Edge / Brave / Vivaldi / Yandex

1. Open `chrome://extensions` (or `edge://extensions`, etc.)
2. Enable **Developer mode** in the top right
3. Click **Load unpacked**
4. Select the `manhwa-translator` folder

### Opera GX / Opera

1. Open `opera://extensions`
2. Enable **Developer mode** in the top right
3. Click **Load unpacked**
4. Select the `manhwa-translator` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select the `manifest.json` file inside the `manhwa-translator` folder

> Firefox: the extension is removed after closing the browser. For permanent install it needs to be published to Firefox Add-ons.

## Features

- Text translation on hover
- OCR on images (Tesseract.js, works offline)
- Region selection for OCR
- Pinyin for Chinese
- Romanization for Korean
- Translation caching
- Translation history
- Export to text file

## Hotkeys

| Combination | Action |
|---|---|
| `Ctrl+Shift+T` | Toggle translation |
| `Ctrl+Shift+H` | Toggle hover |
| `Ctrl+Shift+R` | Select region for OCR |
| `Ctrl+Shift+E` | Export current translation |
| `Esc` | Close translation |

## How to use

**Text:** hover over an element with CJK text — a tooltip with translation will appear.

**Image:** hover over `<img>` or `<canvas>` — OCR will recognize and translate the text.

**Region:** press `Ctrl+Shift+R`, select an area on the screen.

**Pin:** click the tooltip — it will stay on screen.

## Structure

```
manhwa-translator/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── popup.css
├── lib/
│   └── tesseract.min.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── LICENSE
└── README.md
```

## License

MIT
