import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const ROBOTO_REGULAR = 'https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu5mxKKTU1Kvnz.woff2';
const ROBOTO_BOLD = 'https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmWUlfCxc4AMP6lbBP.woff2';

let fontCache400: ArrayBuffer | null = null;
let fontCache700: ArrayBuffer | null = null;

async function getFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (!fontCache400 || !fontCache700) {
    const [regular, bold] = await Promise.all([
      fetch(ROBOTO_REGULAR).then((r) => r.arrayBuffer()),
      fetch(ROBOTO_BOLD).then((r) => r.arrayBuffer()),
    ]);
    fontCache400 = regular;
    fontCache700 = bold;
  }
  return { regular: fontCache400!, bold: fontCache700! };
}

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as Awaited<ReturnType<typeof getStaticPaths>>[number]['props'];
  const { regular, bold } = await getFonts();

  const svg = await satori(
    {
      type: 'div', key: null,
      props: {
        style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 1200, height: 630, padding: 64, backgroundColor: '#0f172a', fontFamily: 'Roboto' },
        children: [
          { type: 'div', key: null, props: { style: { fontSize: 52, fontWeight: 700, color: '#f8fafc', lineHeight: 1.15, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }, children: post.data.title } },
          { type: 'div', key: null, props: { style: { display: 'flex', flexDirection: 'column', gap: 12 }, children: [
            { type: 'div', key: null, props: { style: { fontSize: 26, color: '#94a3b8', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }, children: post.data.description } },
            { type: 'div', key: null, props: { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, color: '#64748b', fontWeight: 400 }, children: ['dimino.me'] } },
          ] } },
        ],
      },
    },
    { width: 1200, height: 630, fonts: [{ name: 'Roboto', data: regular, weight: 400 }, { name: 'Roboto', data: bold, weight: 700 }] },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const buf = resvg.render().asPng();

  return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' } });
};
