# Blog — Astro + Tailwind

Персональный блог на Astro 6, SSG, без бэкенда.

## Стек

- **Astro 6** + **Tailwind CSS 4**
- **Satori** + **@resvg/resvg-js** — OG-картинки 1200×630px
- **@astrojs/rss** — RSS 2.0
- **@astrojs/sitemap** — sitemap

## Команды

| Команда          | Действие                                  |
| :--------------- | :---------------------------------------- |
| `npm run dev`    | Dev-сервер на `localhost:4321`            |
| `npm run build`  | Сборка в `./dist/`                        |
| `npm run preview`| Превью сборки локально                    |
| `npm run sync`   | Синхронизация из Obsidian vault           |

## Категории

- `iai` — ИИ и технологии
- `triatlon` — Триатлон и спорт
- `rabota` — Работа и карьера
- `services` — Сервисы и инструменты

---

## Obsidian-синхронизация

Посты пишутся в Obsidian и синхронизируются в `src/content/blog/`.

### Где хранить vault

Рекомендуемая структура Obsidian vault:

```
~/obsidian-vault/
├── iai/
│   ├── пост-1.md
│   └── пост-2.md
├── triatlon/
│   └── тренировка.md
├── rabota/
│   └── опыт.md
└── services/
    └── инструменты.md
```

Файлы в корне vault распределяются по категории из frontmatter поля `category`.
Файлы в подпапках — категория берётся из имени папки.

### Шаблон поста

Используй шаблон из `docs/obsidian-template.md`:

```markdown
---
title: Заголовок поста
description: Краткое описание для SEO и превью
date: 2026-04-01
category: iai
image: /images/placeholder.jpg
---

Контент поста...
```

**Поддерживаемые категории:** `iai`, `triatlon`, `rabota`, `services`

### Запуск синхронизации

```bash
# Базовый запуск
npm run sync -- --vault ~/obsidian-vault

# Или напрямую
./sync-obsidian.sh --vault ~/obsidian-vault

# С перезаписью существующих файлов
./sync-obsidian.sh --vault ~/obsidian-vault --force

# Помощь
./sync-obsidian.sh --help
```

### Как работает синхронизация

1. Скрипт находит все `.md` файлы в vault (пропускает `.obsidian/`, `.trash/`)
2. Определяет категорию: из имени папки или из frontmatter поля `category`
3. Добавляет дефолтные поля если они отсутствуют (`date`, `category`, `image`)
4. Копирует файл в `src/content/blog/{category}/`
5. Без `--force` — не перезаписывает существующие файлы
6. Все действия логируются в `sync.log`

### Лог синхронизации

Каждый запуск пишет в `sync.log`:

```
[2026-04-01 12:00:00] === Старт синхронизации ===
[2026-04-01 12:00:00] СКОПИРОВАНО: iai/новый-пост.md
[2026-04-01 12:00:00] ПРОПУСК (уже есть): iai/test-post.md
[2026-04-01 12:00:00] === Итог: скопировано=1, пропущено=1, ошибок=0 ===
```
