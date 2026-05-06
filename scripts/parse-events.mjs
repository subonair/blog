#!/usr/bin/env node
/**
 * Парсер событий iron-star.com/event/ → .md файлы в src/content/events/
 * Использует Playwright, так как сайт — Nuxt SPA.
 *
 * Usage: node scripts/parse-events.mjs
 */

import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(__dirname, '..');
const EVENTS_DIR = join(PROJECT_DIR, 'src', 'content', 'events');

/**
 * Определяет sportType по названию и дистанциям.
 */
function detectSportType(title, dists) {
  const nameUp = title.toUpperCase();

  if (dists.length === 1) {
    if (/SWIM|ПЛАВ/.test(nameUp)) return { type: 'swim', dists: { swim: dists[0] } };
    if (/RUN|БЕГ|IRONLADY|MANSTAR|STARKIDS|5K/.test(nameUp)) return { type: 'run', dists: { run: dists[0] } };
    return { type: 'run', dists: { run: dists[0] } };
  }

  if (dists.length === 2) {
    if (/SWIMRUN|СВИМРАН/.test(nameUp)) return { type: 'swimrun', dists: { swim: dists[0], run: dists[1] } };
    if (/AQUATHLON|АКВАТЛОН/.test(nameUp)) return { type: 'aquathlon', dists: { swim: dists[0], run: dists[1] } };
    // Детские старты, relay — swim/run
    if (/RELAY/.test(nameUp)) return { type: 'swim', dists: { swim: dists[0] } };
    return { type: 'aquathlon', dists: { swim: dists[0], run: dists[1] } };
  }

  if (dists.length === 3) {
    return { type: 'triathlon', dists: { swim: dists[0], bike: dists[1], run: dists[2] } };
  }

  return null;
}

/**
 * Определяет статус слотов.
 */
function detectStatus(statusText) {
  const s = (statusText || '').toLowerCase();
  if (s.includes('мало')) return 'low';
  if (s.includes('продано')) return 'sold_out';
  if (s.includes('ожидани')) return 'waitlist';
  return 'open';
}

/**
 * Парсит дистанцию из строки вида "1,93 км" или "1.93 км"
 */
function parseDistance(text) {
  const cleaned = text.replace(/\s*км\s*/i, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/**
 * Slug для имени файла
 */
function slugify(title, dateStr) {
  const nameSlug = title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${dateStr}-${nameSlug}`;
}

/**
 * Генерирует .md контент
 */
function generateMd(event) {
  const { title, dateStr, city, sportType, status, distances } = event;
  const distKeys = Object.entries(distances);

  const frontmatterDists = distKeys.map(([k, v]) => `    ${k}: ${v}`).join('\n');

  const bodyLines = distKeys.map(([k, v]) => {
    const labels = { swim: '🏊 Плавание', bike: '🚴 Вело', run: '🏃 Бег' };
    return `- ${labels[k] || k}: ${v} км`;
  }).join('\n');

  return `---
title: "${title}"
date: ${dateStr}
city: "${city}"
sportType: ${sportType}
status: ${status}
distances:
${frontmatterDists}
---

**Дата:** ${dateStr.replace(/-/g, '.')}
**Город:** ${city}
**Тип:** ${sportType}
**Статус слотов:** ${status}

## Дистанции

${bodyLines}

[Регистрация на iron-star.com](https://iron-star.com/event/)
`;
}

async function main() {
  await mkdir(EVENTS_DIR, { recursive: true });

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to iron-star.com/event/ ...');
    await page.goto('https://iron-star.com/event/', { waitUntil: 'networkidle', timeout: 30000 });

    // Ждём загрузки карточек
    await page.waitForSelector('.event-item-wrap', { timeout: 10000 });

    // Скроллим до конца для загрузки всех событий (виртуальный скроллинг)
    let prevCount = 0;
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const count = await page.$$eval('.event-item-wrap', els => els.length);
      if (count === prevCount && count > 0) break;
      prevCount = count;
    }

    // Извлекаем данные
    const events = await page.$$eval('.event-item-wrap', (els) =>
      els.map((el) => {
        const link = el.querySelector('a.event-item');
        const title = el.querySelector('.title')?.textContent?.trim() || '';
        const date = el.querySelector('.date')?.textContent?.trim() || '';
        const place = el.querySelector('.place')?.textContent?.trim() || '';
        // Статус в div внутри .event-image
        const imageDiv = el.querySelector('.event-image');
        const statusDiv = imageDiv?.querySelector('div');
        const statusText = statusDiv?.textContent?.trim() || '';
        const distances = Array.from(el.querySelectorAll('.distance')).map((d) =>
          d.textContent.trim(),
        );
        return { title, date, place, statusText, distances, href: link?.href || '' };
      }),
    );

    console.log(`Found ${events.length} event cards\n`);

    let saved = 0;
    let skipped = 0;

    for (const raw of events) {
      const { title, date: dateRaw, place: city, statusText, distances: distStrs, href } = raw;

      // Парсим дату ДД.ММ.ГГГГ → YYYY-MM-DD
      const dateMatch = dateRaw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (!dateMatch) {
        console.log(`  SKIP (bad date): ${title} ${dateRaw}`);
        skipped++;
        continue;
      }
      const dateStr = `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`;

      // Парсим дистанции
      const dists = distStrs.map(parseDistance).filter((d) => d > 0);
      if (dists.length === 0) {
        console.log(`  SKIP (no distances): ${title}`);
        skipped++;
        continue;
      }

      const sport = detectSportType(title, dists);
      if (!sport) {
        console.log(`  SKIP (unknown sport): ${title} ${dists.length} dists`);
        skipped++;
        continue;
      }

      const status = detectStatus(statusText);
      const slug = slugify(title, dateStr);
      const md = generateMd({ title, dateStr, city, sportType: sport.type, status, distances: sport.dists });

      const filepath = join(EVENTS_DIR, `${slug}.md`);
      await writeFile(filepath, md, 'utf-8');
      console.log(`  ✓ ${slug}.md (${sport.type}, ${status})`);
      saved++;
    }

    console.log(`\nDone: ${saved} saved, ${skipped} skipped → ${EVENTS_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
