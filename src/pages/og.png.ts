import { readFile } from 'node:fs/promises';
import type { APIRoute } from 'astro';
import { publicDir, srcDir } from 'astro:config/server';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import type { CSSProperties, JSXNode } from 'satori/jsx';
import portraitImage from '../assets/corbin_present.png';
import { social } from '../data/social';
import { portraitRegistration } from '../data/portrait';

export const prerender = true;

// Match the palette and type in global.css and the portfolio's hero.
const colors = {
  paper: '#f5f3ed',
  ink: '#242329',
  muted: '#615e68',
  accent: '#6839b5',
  lilac: '#e7b2ef',
  line: '#d9d5df',
};

const guides = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="460" viewBox="0 0 460 460" fill="none">
  <circle cx="230" cy="230" r="200" stroke="${colors.lilac}" stroke-width="2" stroke-dasharray="0.1 7" stroke-linecap="round" />
  <path d="${portraitRegistration}" stroke="${colors.line}" stroke-width="1.5" />
</svg>`;

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
  const [portrait, mark, manrope400, manrope500] = await Promise.all([
    readFile(new URL('assets/corbin_present.png', srcDir)),
    ...[
      'favicon.svg',
      'assets/fonts/og/manrope-400.ttf',
      'assets/fonts/og/manrope-500.ttf',
    ].map((path) => readFile(new URL(path, publicDir))),
  ]);
  // Enlarge the transparent photo, with its lower torso cropped by the footer.
  const portraitHeight = 560;
  const portraitWidth =
    (portraitHeight * portraitImage.width) / portraitImage.height;
  const svg = await satori(
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '40px 64px 32px',
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
            gap: 24,
            flex: 1,
          },
        },
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              width: 588,
              flexShrink: 0,
              marginBottom: 24,
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                fontSize: 100,
                fontWeight: 500,
                letterSpacing: -7.5,
                lineHeight: 1.03,
              },
            },
            h('div', {}, 'Corbin'),
            h(
              'div',
              { style: { display: 'flex' } },
              'Crutchley',
              h(
                'span',
                { style: { color: colors.accent, marginLeft: -7.5 } },
                '.',
              ),
            ),
          ),
          h(
            'div',
            {
              style: {
                marginTop: 28,
                fontSize: 28,
                maxWidth: 550,
                lineHeight: 1.4,
                color: colors.muted,
              },
            },
            'Engineering leader, consultant, author, and open-source maintainer.',
          ),
        ),
        h(
          'div',
          {
            style: {
              display: 'flex',
              position: 'relative',
              width: 460,
              alignSelf: 'stretch',
              flexShrink: 0,
              // Both the photo and guides end exactly at the footer divider.
              overflow: 'hidden',
            },
          },
          h('img', {
            src: `data:image/svg+xml;base64,${Buffer.from(guides).toString('base64')}`,
            width: 520,
            height: 520,
            style: {
              position: 'absolute',
              top: 56,
              left: -30,
            },
          }),
          h('img', {
            src: `data:image/png;base64,${portrait.toString('base64')}`,
            width: portraitWidth,
            height: portraitHeight,
            style: {
              position: 'absolute',
              bottom: -70,
              left: (460 - portraitWidth) / 2,
            },
          }),
        ),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${colors.line}`,
            paddingTop: 20,
            fontSize: 24,
            flexShrink: 0,
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
        h('span', { style: { color: colors.muted } }, 'Sacramento, California'),
      ),
    ),
    {
      width: social.image.width,
      height: social.image.height,
      fonts: [
        { name: 'Manrope', data: manrope400, weight: 400, style: 'normal' },
        { name: 'Manrope', data: manrope500, weight: 500, style: 'normal' },
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
