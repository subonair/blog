# Публикация постов на dimino.me

**Для:** Внешние боты, агенты **Обновлено:** 2026-05-05

---

## Документация

| Расположение | Ссылка                                                               |
| ------------ | -------------------------------------------------------------------- |
| Nextcloud    | `Common/flex-agents/global/proj/blogger/dimino_me/PUBLISHING.md`     |
| GitHub       | <https://github.com/subonair/dimino_me/blob/main/docs/PUBLISHING.md> |
| Локально     | `/root/projects/dimino-blog/docs/PUBLISHING.md`                      |

---

## URL сайта

```
https://dimino.me
```

---

## Структура контента

### Репозиторий

- **GitHub:** <https://github.com/subonair/dimino_me>
- **Локально:** `/root/projects/dimino-blog/`

### Коллекция

```
src/content/blog/{category}/{slug}.md
```

**Название коллекции:** `blog`

**Категории:**

- `ai` — ИИ и технологии
- `it` — IT и карьера
- `triatlon` — Триатлон и спорт
- `services` — Сервисы и инструменты

---

## Поля коллекции (frontmatter)

```yaml
---
title: Заголовок поста
description: Краткое описание для SEO (до 160 символов)
date: 2026-05-05
category: ai
image: /images/post-cover.webp
---
```

| Поле          | Тип    | Обязательное | Описание                                         |
| ------------- | ------ | ------------ | ------------------------------------------------ |
| `title`       | string | ✅           | Заголовок поста                                  |
| `description` | string | ✅           | SEO description (160 символов)                   |
| `date`        | date   | ✅           | Дата публикации (YYYY-MM-DD)                     |
| `category`    | enum   | ✅           | `ai`, `it`, `triatlon`, `services`               |
| `image`       | string | ❌           | Обложка поста. Дефолт: `/images/placeholder.jpg` |

---

## Процесс публикации

### Вариант 1: Через Git (рекомендуется)

1. Клонировать репозиторий
2. Создать файл `src/content/blog/{category}/{slug}.md`
3. Заполнить frontmatter и контент
4. Push в main
5. На сервере: `bash deploy.sh`

### Вариант 2: Напрямую на сервер

1. Создать файл в `/root/projects/dimino-blog/src/content/blog/{category}/{slug}.md`
2. Выполнить деплой:

```bash
cd /root/projects/dimino-blog
npm run build
bash deploy.sh
```

### Автодеплой

Git push в main → автоматический деплой не настроен. Нужен ручной запуск `deploy.sh` на сервере.

---

## Формат поста

```markdown
---
title: Как ИИ меняет веб-разработку
description: Обзор инструментов и подходов к использованию ИИ в современной веб-разработке
date: 2026-05-05
category: ai
image: /images/ai-webdev.webp
---

## Введение

Текст поста в Markdown...

## Основная часть

- Пункт 1
- Пункт 2

## Заключение

Текст заключения...
```

---

## Изображения

### Расположение

- Статические: `public/images/`
- В постах: относительные пути `/images/filename.webp`

### Форматы

WebP (предпочтительно), PNG, JPG

### Внешние источники

Unsplash разрешён в CSP:

```markdown
![Alt](https://images.unsplash.com/photo-ID?auto=format&fit=crop&w=1200)
```

---

## SEO-требования

- **Title:** 50-60 символов
- **Description:** 150-160 символов
- **Slug:** латиница, строчные, дефисы (автоматически из filename)
- **H1:** только один, совпадает с title

---

## Проверка

После публикации проверить:

1. `/blog/{category}/{slug}/` — страница поста
2. `/api/og/{category}/{slug}.png` — OG-картинка
3. `/sitemap.xml` — наличие в карте

---

## Контакты

Вопросы по публикации: Кузя (@subonairassistantbot)
