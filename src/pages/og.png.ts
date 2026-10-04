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
  paper: '#f6f7f9',
  ink: '#141923',
  muted: '#545d6d',
  accent: '#713dc5',
  line: '#d8dde7',
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
  const [portrait, mark, manrope400, manrope500, manrope600, newsreader500] =
    await Promise.all(
      [
        'assets/corbin-profile.jpg',
        'favicon.svg',
        'assets/fonts/og/manrope-400.ttf',
        'assets/fonts/og/manrope-500.ttf',
        'assets/fonts/og/manrope-600.ttf',
        'assets/fonts/og/newsreader-italic-500-72pt.ttf',
      ].map((path) => readFile(new URL(path, publicDir))),
    );

  const lineStyle = { display: 'flex', height: 86, alignItems: 'center' };
  const svg = await satori(
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '48px 64px',
          backgroundColor: colors.paper,
          color: colors.ink,
          fontFamily: 'Manrope',
          fontWeight: 400,
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
        h(
          'div',
          { style: { fontSize: 27, fontWeight: 600, letterSpacing: -0.8 } },
          'Corbin Crutchley',
        ),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 48,
            marginTop: 44,
            flex: 1,
          },
        },
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', width: 680 } },
          h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                fontSize: 82,
                fontWeight: 500,
                letterSpacing: -4.5,
                lineHeight: 1.04,
              },
            },
            h('div', { style: lineStyle }, 'Thinking of'),
            h(
              'div',
              { style: { ...lineStyle, gap: 16 } },
              h(
                'span',
                {
                  style: {
                    fontFamily: 'Newsreader',
                    fontStyle: 'italic',
                    color: colors.accent,
                    letterSpacing: -3.3,
                  },
                },
                'people',
              ),
              h('span', {}, 'behind'),
            ),
            h(
              'div',
              { style: lineStyle },
              h('span', {}, 'the screen'),
              h('span', { style: { color: colors.accent } }, '.'),
            ),
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
            marginTop: 38,
            fontSize: 32,
          },
        },
        h(
          'div',
          { style: { display: 'flex', gap: 18 } },
          h('span', {}, 'Engineering leader'),
          h('span', { style: { color: colors.muted } }, '/'),
          h('span', {}, 'Author'),
          h('span', { style: { color: colors.muted } }, '/'),
          h('span', {}, 'OSS maintainer'),
        ),
        h('div', { style: { color: colors.accent } }, 'corbincrutchley.com'),
      ),
    ),
    {
      width: social.image.width,
      height: social.image.height,
      fonts: [
        { name: 'Manrope', data: manrope400, weight: 400, style: 'normal' },
        { name: 'Manrope', data: manrope500, weight: 500, style: 'normal' },
        { name: 'Manrope', data: manrope600, weight: 600, style: 'normal' },
        {
          name: 'Newsreader',
          data: newsreader500,
          weight: 500,
          style: 'italic',
        },
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
