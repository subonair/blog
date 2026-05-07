import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const SITE = 'https://dimino.me';

const TODAY = new Date().toISOString().split('T')[0];

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly', lastmod: TODAY },
  { url: '/about/', priority: '0.8', changefreq: 'monthly', lastmod: TODAY },
  { url: '/it/', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { url: '/ai/', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { url: '/triatlon/', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { url: '/events/', priority: '0.8', changefreq: 'weekly', lastmod: TODAY },
  { url: '/triatlon/calc/', priority: '0.7', changefreq: 'monthly', lastmod: TODAY },
];

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog');

  const postEntries = posts
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((post) => ({
      url: `/${post.id.replace(/\.md$/, '')}/`,
      lastmod: post.data.date.toISOString().split('T')[0],
      priority: '0.6',
      changefreq: 'monthly',
    }));

  const allPages = [...staticPages, ...postEntries];

  const urlElements = allPages
    .map(
      (page) =>
        `  <url>\n    <loc>${SITE}${page.url}</loc>\n    <lastmod>${page.lastmod}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
