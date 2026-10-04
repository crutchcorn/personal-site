# Corbin's personal site

A static Astro project migrated from the original HTML page, with TypeScript, CSS Modules, ESLint, Prettier, and Stylelint.

Use Node.js 22.22.3+, 24.16.0+, or 26.3.0+ in a supported Node release line.

```sh
npm install
npm run dev
```

| Command                | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Start the development server.                                   |
| `npm run build`        | Check Astro/TypeScript and generate the static site in `dist/`. |
| `npm run preview`      | Preview the production build locally.                           |
| `npm run check`        | Check Astro components and TypeScript.                          |
| `npm run lint`         | Run ESLint and Stylelint.                                       |
| `npm run lint:fix`     | Apply available ESLint and Stylelint fixes.                     |
| `npm run format`       | Format source and configuration with Prettier.                  |
| `npm run format:check` | Check formatting without changing files.                        |

`src/pages/index.astro` composes the page from the layout and section components. Static images and fonts live in `public/assets/`. Browser navigation and reveal animations live in `src/scripts/site.ts`; native appearance dialogs use `src/scripts/dialogs.ts`.

Components import `src/styles/site.module.scss` as a CSS Module and access hyphenated classes with bracket notation, such as `styles['site-header']`. Books and talks have dedicated `writing.module.scss` and `speaking.module.scss` files. Global resets, font faces, and CSS custom properties belong in `src/styles/global.css`.

Edit `src/data/appearances.ts` to maintain talks and podcasts. The first two entries of each list appear on the page, and the complete lists appear in native HTML dialogs. Source and artwork references live in `public/assets/SOURCES.md`.

SCSS is limited to media query breakpoint variables. Declare plain length values in `src/styles/_breakpoints.scss`, import them with `@use './breakpoints'`, and refer to them as `breakpoints.$name` inside media queries. Colors, spacing, and other reusable values remain CSS custom properties. Stylelint enforces this restriction and disallows Sass nesting, mixins, functions, loops, conditionals, and interpolation.

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

Run `npm run check`, `npm run lint`, `npm run format:check`, and `npm run build` before committing changes.
