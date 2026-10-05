# Corbin's personal site

A static Astro project migrated from the original HTML page, with TypeScript, CSS Modules, ESLint, Prettier, and Stylelint.

## Local development

Use Node.js 22.22.3+, 24.16.0+, or 26.3.0+ in a supported Node release line.

```sh
npm install
npm run dev
```

### Commands

| Command                | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Start the development server.                                   |
| `npm run build`        | Check Astro/TypeScript and generate the static site in `dist/`. |
| `npm run deploy`       | Build and publish the static site to Cloudflare Workers.        |
| `npm run preview`      | Preview the production build locally.                           |
| `npm run check`        | Check Astro components and TypeScript.                          |
| `npm run test:a11y`    | Test accessibility against the production build.                |
| `npm run lint`         | Run ESLint and Stylelint.                                       |
| `npm run lint:fix`     | Apply available ESLint and Stylelint fixes.                     |
| `npm run format`       | Format source and configuration with Prettier.                  |
| `npm run format:check` | Check formatting without changing files.                        |

## Page structure and content

`src/pages/index.astro` composes the page from the layout and section components. The hero and book cover sources live in `src/assets/`; Astro's `Picture` component generates responsive AVIF and WebP versions during the build, with PNG or JPEG fallbacks. SVGs, fonts, and the Open Graph portrait remain in `public/assets/`. Browser navigation and reveal animations live in `src/scripts/site.ts`; native appearance dialogs use `src/scripts/dialogs.ts`.

Edit `src/data/appearances.ts` to maintain talks and podcasts. The first two entries of each list appear on the page, and the complete lists appear in native HTML dialogs. Source and artwork references live in `public/assets/SOURCES.md`.

## Styles and layout

Components import `src/styles/site.module.scss` as a CSS Module and access hyphenated classes with bracket notation, such as `styles['site-header']`. Books and talks have dedicated `writing.module.scss` and `speaking.module.scss` files. Global resets, font faces, and CSS custom properties belong in `src/styles/global.css`.

SCSS is limited to media query breakpoint variables. Declare plain length values in `src/styles/_breakpoints.scss`, import them with `@use './breakpoints'`, and refer to them as `breakpoints.$name` inside media queries. Colors, spacing, and other reusable values remain CSS custom properties. Stylelint enforces this restriction and disallows Sass nesting, mixins, functions, loops, conditionals, and interpolation.

### Spacing and shape

Use the shared spacing roles in `global.css` for common layout decisions. Their responsive values are defined together in `site.module.scss`; the underlying `--s1` through `--s8` scale remains available for compact details and intentional exceptions.

| Spacing role         | Desktop | Tablet | Mobile |
| -------------------- | ------- | ------ | ------ |
| `--space-section`    | 96px    | 96px   | 64px   |
| `--space-subsection` | 64px    | 64px   | 48px   |
| `--space-heading`    | 48px    | 48px   | 32px   |
| `--space-layout`     | 48px    | 32px   | 24px   |
| `--space-inset`      | 32px    | 24px   | 24px   |
| `--space-content`    | 24px    | 24px   | 16px   |

Surface insets reduce to 16px below 375px. Use `--radius-control` (4px) for buttons, `--radius-surface` (8px) for contained panels and media, and `--radius-round` (50%) for circular controls. Open ruled content stays square. Give each transition one spacing owner instead of adding a trailing margin, trailing padding, and the next section's leading padding together. Focus styles should preserve the component's radius.

## Social images and metadata

The portfolio's Open Graph image is generated at `/og.png` by `src/pages/og.png.ts` using Satori and resvg. It reuses the hero portrait, favicon, palette, and fonts, and builds into a static 1200 × 630 PNG with no image service required in production. The hero and social image share their illustrated connection paths through `src/data/portrait.ts`. Preview it at `http://localhost:4321/og.png` while running `npm run dev`. Social metadata lives in `src/data/social.ts`; the production URL is set with `site` in `astro.config.mjs`. The static font instances used by Satori are documented in `public/assets/fonts/og/README.md`.

## Cloudflare Workers deployment

Cloudflare Workers deployment uses `wrangler.jsonc` to publish `dist/` as static assets to the `personal-site` Worker. In Workers Builds, use `npm run build` as the build command and `npx wrangler deploy` for production deployments. Branch Previews use `npx wrangler preview`; the empty `previews` block in `wrangler.jsonc` enables that command. Static assets and compatibility settings stay at the top level, as described in [Cloudflare's Preview configuration guide](https://developers.cloudflare.com/workers/previews/configuration/#wrangler-configuration-file). The pinned local Wrangler dependency is used automatically. For a local production deployment, run `npm run deploy`. To validate packaging without publishing, run `npm run build` followed by `npx wrangler deploy --dry-run`.

The explicit Wrangler configuration prevents automatic framework setup during deployment. This project is entirely pre-rendered and follows [Cloudflare's static Astro deployment guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/#if-you-have-a-static-site). It needs no Astro Cloudflare adapter: Satori and the native resvg renderer run in Node.js during the build, and the generated PNG is deployed as a static file.

## Accessibility testing

The accessibility suite uses Playwright and axe in Chromium at desktop and 320px widths, plus desktop WebKit. Install its browsers once with `npx playwright install chromium webkit`, then run `npm run test:a11y`. This builds the current source before testing. Playwright starts a production preview on port 4330 or reuses one already running there.

The tests check WCAG A/AA and axe best practices, expanded career content and all dialogs, keyboard focus and dismissal, skip and section navigation, no-JavaScript and unavailable-dialog fallbacks, 200% text sizing, short viewports, WCAG text spacing, reduced motion, Chromium forced colors, and accessible labels. See [the accessibility audit](docs/accessibility-audit.md) for findings and verification. Automated checks complement manual screen-reader, browser zoom, focus visibility, and visual contrast checks; they do not establish complete WCAG conformance. Failed runs retain traces in `test-results/` for `npx playwright show-trace`.

## Verification before committing

Run `npm run check`, `npm run lint`, `npm run format:check`, and `npm run build` before committing changes.
