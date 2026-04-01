import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

let fontCache: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (!fontCache) {
    fontCache = await fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf'
    ).then((r) => r.arrayBuffer());
  }
  return fontCache;
}

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as Awaited<ReturnType<typeof getStaticPaths>>[number]['props'];
  const fontData = await getFont();

  const svg = await satori(
    {
      type: 'div',
      key: null,
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          padding: '60px',
          fontFamily: 'Inter',
          boxSizing: 'border-box',
        },
        children: [
          {
            type: 'div',
            key: null,
            props: {
              style: {
                fontSize: '56px',
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.2,
                maxWidth: '1000px',
              },
              children: post.data.title,
            },
          },
          {
            type: 'div',
            key: null,
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              },
              children: [
                {
                  type: 'div',
                  key: null,
                  props: {
                    style: {
                      fontSize: '28px',
                      color: '#6b7280',
                      lineHeight: 1.4,
                      maxWidth: '900px',
                    },
                    children: post.data.description,
                  },
                },
                {
                  type: 'div',
                  key: null,
                  props: {
                    style: {
                      fontSize: '22px',
                      color: '#9ca3af',
                      fontWeight: 400,
                    },
                    children: 'itrokit.ru',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
