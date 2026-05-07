// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://dimino.me',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => {
        // Skip API endpoints, 404/500 pages
        if (page.includes('/api/')) return false;
        if (page.endsWith('/404/') || page.endsWith('/500/')) return false;
        return true;
      },
      serialize(item) {
        // Homepage — highest priority
        if (item.url === 'https://dimino.me/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        }
        // Category pages
        else if (
          item.url === 'https://dimino.me/about/' ||
          item.url === 'https://dimino.me/ai/' ||
          item.url === 'https://dimino.me/it/' ||
          item.url === 'https://dimino.me/triatlon/' ||
          item.url === 'https://dimino.me/events/'
        ) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        // Events filter pages
        else if (item.url.includes('/events/')) {
          item.priority = 0.7;
          item.changefreq = 'weekly';
        }
        // Calculator
        else if (item.url === 'https://dimino.me/triatlon/calc/') {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        // Legal
        else if (item.url === 'https://dimino.me/privacy/') {
          item.priority = 0.3;
          item.changefreq = 'yearly';
        }
        // Blog posts
        else if (
          item.url.includes('/ai/') ||
          item.url.includes('/it/') ||
          item.url.includes('/triatlon/')
        ) {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],
  redirects: {
    '/ai/ai-v-biznese-s-chego-nachat': '/ai/',
    '/ai/ai-v-biznese-s-chego-nachat/': '/ai/',
    // 2026-05-07: статьи из /services/ перенесены в /it/
    '/services/kak-rabotaet-nasha-web-studiya': '/it/kak-rabotaet-nasha-web-studiya/',
    '/services/kak-rabotaet-nasha-web-studiya/': '/it/kak-rabotaet-nasha-web-studiya/',
    '/services': '/it/',
    '/services/': '/it/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
