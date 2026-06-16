# Manhwa Translator

Браузерное расширение для Opera GX. Переводит текст манхвы с китайского, корейского и японского языков.

## Установка

1. Открой `opera://extensions`
2. Включи «Режим разработчика»
3. Нажми «Загрузить распакованное расширение»
4. Выбери папку `manhwa-translator`

## Возможности

- Перевод текста при наведении
- OCR (распознавание текста на картинках) через Tesseract.js
- Выделение области для OCR (Ctrl+Shift+R)
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

## Технологии

- Tesseract.js — OCR в браузере
- Google Translate API (бесплатный эндпоинт)
- MyMemory API (fallback)
- Chrome Extension Manifest V3

## Структура

```
manhwa-translator/
├── manifest.json
├── background.js
├── content.js
├── popup.html / popup.js / popup.css
├── styles.css
├── lib/
│   └── tesseract.min.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── LICENSE
```

## Лицензия

MIT

---

# Manhwa Translator

Browser extension for Opera GX. Translates manhwa text from Chinese, Korean, and Japanese.

## Installation

1. Open `opera://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `manhwa-translator` folder

## Features

- Text translation on hover
- OCR (text recognition from images) via Tesseract.js
- Region selection for OCR (Ctrl+Shift+R)
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

## Tech stack

- Tesseract.js — in-browser OCR
- Google Translate API (free endpoint)
- MyMemory API (fallback)
- Chrome Extension Manifest V3

## Structure

```
manhwa-translator/
├── manifest.json
├── background.js
├── content.js
├── popup.html / popup.js / popup.css
├── styles.css
├── lib/
│   └── tesseract.min.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── LICENSE
```

## License

MIT
