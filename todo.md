## В работе
— нет —

## Выполнено
- [x] #006 Obsidian-синхронизация — done
- [x] #005 Финал для блоггера — done
- [x] #004 Контент для блоггера — done
- [x] #003 SEO для блоггера — done

## Архив задач

### #006 Obsidian-синхронизация
- [x] sync-obsidian.sh — идемпотентный скрипт синхронизации vault → src/content/blog/
- [x] --vault DIR, --force флаги, --help
- [x] Конвертация frontmatter (title, description, date, category, image)
- [x] Логирование всех действий в sync.log
- [x] docs/obsidian-template.md — шаблон поста для Obsidian
- [x] package.json — добавлен скрипт "sync"
- [x] README.md — документация по синхронизации

### #005 Финал для блоггера
- [x] satori + @resvg/resvg-js установлены
- [x] src/pages/api/og/[...slug].png.ts — генерация OG-картинок 1200x630px
- [x] Base.astro — добавлен slug prop, og:image = /api/og/${slug}.png
- [x] PostLayout.astro — добавлен slug prop, передаётся в Base
- [x] @astrojs/rss установлен
- [x] src/pages/rss.xml.ts — RSS 2.0, все посты из blog collection
- [x] npm run build — ОК, 0 ошибок
- [x] dist/: 4 OG PNG, rss.xml, sitemap-index.xml — всё есть


### #004 Контент для блоггера
- [x] src/content.config.ts — defineCollection с loader (Astro v6 API)
- [x] src/content/blog/iai/test-post.md
- [x] src/content/blog/triatlon/test-post.md
- [x] src/content/blog/rabota/test-post.md
- [x] src/content/blog/services/test-post.md
- [x] iai.astro → getCollection('blog', category === 'iai')
- [x] triatlon.astro → getCollection('blog', category === 'triatlon')
- [x] rabota.astro → getCollection('blog', category === 'rabota')
- [x] services.astro → getCollection('blog', category === 'services')
- [x] index.astro → последние 5 постов из всех категорий
- [x] npm run build — ОК, 8 страниц

### #003 SEO для блоггера
- [x] Meta tags: title, description, canonical, robots — в Base.astro
- [x] Open Graph: og:title, og:description, og:image, og:url, og:type (prop), og:site_name, og:locale
- [x] ogType prop в Base.astro (article для постов, website по умолчанию)
- [x] Schema.org/Article — PostLayout.astro (готов для будущих постов)
- [x] Schema.org/Person — about.astro (уже был)
- [x] public/robots.txt создан
- [x] @astrojs/sitemap установлен
- [x] astro.config.mjs обновлён: site + sitemap integration
- [x] npm run build — ОК, 8 страниц, sitemap-index.xml создан
