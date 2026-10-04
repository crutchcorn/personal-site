import { readFile } from 'node:fs/promises';
import type { APIRoute } from 'astro';
import { publicDir } from 'astro:config/server';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import type { CSSProperties, JSXNode } from 'satori/jsx';
import { social } from '../data/social';

export const prerender = true;

// Match the palette and type in global.css and the portfolio's hero.
const colors = {
  paper: '#f5f3ed',
  ink: '#242329',
  muted: '#615e68',
  accent: '#6839b5',
  line: '#d9d5df',
};

// Satori accepts plain element objects, so the static card needs no React runtime.
function h(
  type: 'div' | 'span' | 'img',
  props: {
    style?: CSSProperties;
    src?: string;
    width?: number;
    height?: number;
  },
  ...children: JSXNode[]
) {
  return {
    type,
    key: null,
    props: {
      ...props,
      children: children.length === 1 ? children[0] : children,
    },
  };
}

export const GET: APIRoute = async () => {
  const [portrait, mark, manrope400, manrope500, manrope600] =
    await Promise.all(
      [
        'assets/corbin-profile.jpg',
        'favicon.svg',
        'assets/fonts/og/manrope-400.ttf',
        'assets/fonts/og/manrope-500.ttf',
        'assets/fonts/og/manrope-600.ttf',
      ].map((path) => readFile(new URL(path, publicDir))),
    );
  const svg = await satori(
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '56px 64px',
          backgroundColor: colors.paper,
          color: colors.ink,
          fontFamily: 'Manrope',
          fontWeight: 400,
        },
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 40,
            flex: 1,
          },
        },
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', width: 652 } },
          h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                fontSize: 80,
                fontWeight: 600,
                letterSpacing: -3,
                lineHeight: 1.08,
              },
            },
            h('div', {}, 'Corbin'),
            h('div', {}, 'Crutchley'),
          ),
          h(
            'div',
            {
              style: {
                marginTop: 28,
                fontSize: 30,
                lineHeight: 1.4,
                color: colors.muted,
              },
            },
            'Engineering leader, consultant, author, and open-source maintainer.',
          ),
          h(
            'div',
            { style: { marginTop: 18, fontSize: 26, color: colors.muted } },
            'Sacramento, California',
          ),
        ),
        h('img', {
          // The existing .jpg asset contains PNG bytes.
          src: `data:image/png;base64,${portrait.toString('base64')}`,
          width: 336,
          height: 336,
          style: {
            borderRadius: 8,
            border: `1px solid ${colors.line}`,
            objectFit: 'cover',
            flexShrink: 0,
          },
        }),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${colors.line}`,
            paddingTop: 24,
            marginTop: 32,
            fontSize: 28,
          },
        },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 14 } },
          h('img', {
            src: `data:image/svg+xml;base64,${mark.toString('base64')}`,
            width: 36,
            height: 36,
          }),
          h('span', { style: { color: colors.accent } }, 'corbincrutchley.com'),
        ),
      ),
    ),
    {
      width: social.image.width,
      height: social.image.height,
      fonts: [
        { name: 'Manrope', data: manrope400, weight: 400, style: 'normal' },
        { name: 'Manrope', data: manrope500, weight: 500, style: 'normal' },
        { name: 'Manrope', data: manrope600, weight: 600, style: 'normal' },
      ],
    },
  );

  const png = new Resvg(svg, { font: { loadSystemFonts: false } })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
