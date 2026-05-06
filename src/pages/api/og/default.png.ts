import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

let fontCache: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (!fontCache) {
    fontCache = await fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf',
    ).then((r) => r.arrayBuffer());
  }
  return fontCache;
}

export const GET: APIRoute = async () => {
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
          justifyContent: 'center',
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
                fontSize: '72px',
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.2,
              },
              children: 'Дмитрий Иноземцев',
            },
          },
          {
            type: 'div',
            key: null,
            props: {
              style: {
                fontSize: '28px',
                color: '#6b7280',
                marginTop: '20px',
                lineHeight: 1.5,
              },
              children: 'Блог об ИИ, триатлоне и работе',
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
                marginTop: '40px',
              },
              children: 'dimino.me',
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
    },
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