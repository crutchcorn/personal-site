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

`src/pages/index.astro` composes the page from the layout and section components. Static images and fonts live in `public/assets/`, and browser interactions live in `src/scripts/site.ts`.

Components import `src/styles/site.module.scss` as a CSS Module and access hyphenated classes with bracket notation, such as `styles['site-header']`. Global resets, font faces, and CSS custom properties belong in `src/styles/global.css`.

SCSS is limited to media query breakpoint variables. Declare plain length values in `src/styles/_breakpoints.scss`, import them with `@use './breakpoints'`, and refer to them as `breakpoints.$name` inside media queries. Colors, spacing, and other reusable values remain CSS custom properties. Stylelint enforces this restriction and disallows Sass nesting, mixins, functions, loops, conditionals, and interpolation.

Run `npm run check`, `npm run lint`, `npm run format:check`, and `npm run build` before committing changes.
