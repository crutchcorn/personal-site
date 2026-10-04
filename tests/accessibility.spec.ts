import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { platform } from 'node:process';
import { podcasts, talks } from '../src/data/appearances';

const dialogCases = [
  { opener: /^View roles.*earlier roles$/, title: 'Earlier roles' },
  { opener: /^View all talks/, title: 'All conference talks' },
  { opener: /^View all episodes/, title: 'All podcasts' },
];

function tabKey(browserName: string, reverse = false): string {
  // macOS WebKit uses Option+Tab for all controls when full keyboard access is off.
  const modifier =
    browserName === 'webkit' && platform === 'darwin' ? 'Alt+' : '';
  return `${modifier}${reverse ? 'Shift+' : ''}Tab`;
}

async function tabToBoundary(
  page: Page,
  control: Locator,
  browserName: string,
  reverse = false,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.keyboard.press(tabKey(browserName, reverse));
    if (await control.evaluate((element) => element === document.activeElement))
      break;
    // Native dialogs can visit browser chrome (body) or the dialog itself at a
    // boundary. Neither makes the inert background page controls reachable.
    expect(await page.evaluate(() => document.activeElement?.tagName)).toMatch(
      /^(BODY|DIALOG)$/,
    );
  }
  await expect(control).toBeFocused();
}

async function expectAccessible(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22aa',
      'best-practice',
    ])
    .analyze();
  expect(violations).toEqual([]);
}

async function expandCareer(page: Page): Promise<void> {
  for (const detail of await page
    .locator('#work details:not([data-dialog-fallback])')
    .all()) {
    if ((await detail.getAttribute('open')) === null)
      await detail.locator('summary').click();
  }
}

async function expectNoHorizontalClipping(page: Page): Promise<void> {
  const problems = await page.evaluate(() => {
    const root = document.documentElement;
    const clipped: string[] = [];
    if (root.scrollWidth > root.clientWidth + 1)
      clipped.push('Document overflows');
    const scope = document.querySelector('dialog[open]') ?? document;
    for (const element of scope.querySelectorAll<HTMLElement>(
      'a, button, summary, h1, h2, h3, h4, p, strong',
    )) {
      if (!element.getClientRects().length) continue;
      const rect = element.getBoundingClientRect();
      if (
        rect.left < -1 ||
        rect.right > root.clientWidth + 1 ||
        (element.clientWidth > 0 &&
          element.scrollWidth > element.clientWidth + 1)
      )
        clipped.push(
          element.textContent?.trim() ||
            element.getAttribute('aria-label') ||
            element.tagName,
        );
    }
    return clipped;
  });
  expect(problems).toEqual([]);
}

async function expectDialogFocusVisible(control: Locator): Promise<void> {
  await expect
    .poll(() =>
      control.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const dialog = element.closest('dialog');
        const content = element.closest('[data-dialog-content]');
        const boundary = (content ?? dialog)?.getBoundingClientRect();
        return Boolean(
          boundary &&
          rect.top >= boundary.top - 1 &&
          rect.bottom <= boundary.bottom + 1,
        );
      }),
    )
    .toBe(true);
}

async function expectCompleteFallbacks(page: Page): Promise<void> {
  await expect(page.locator('[data-dialog-open]')).toHaveCount(3);
  for (const opener of await page.locator('[data-dialog-open]').all())
    await expect(opener).toBeHidden();
  const career = page.locator('[data-dialog-fallback="earlier-career-dialog"]');
  await expect(career.locator('summary')).toBeVisible();
  await career.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(
    career.getByRole('heading', { name: 'CoderPad', exact: true }),
  ).toBeVisible();
  await expect(
    career.getByRole('heading', { name: 'Trilogy Education', exact: true }),
  ).toBeVisible();
  await expect(career.getByRole('listitem')).toHaveCount(7);
  for (const [id, entries] of [
    ['talks', talks],
    ['podcasts', podcasts],
  ] as const) {
    const fallback = page.locator(`[data-dialog-fallback="${id}-dialog"]`);
    await expect(fallback.locator('summary')).toBeVisible();
    await fallback.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(fallback.getByRole('link')).toHaveCount(entries.length);
    await expect(fallback.getByRole('link').last()).toContainText(
      entries[entries.length - 1]!.title,
    );
    await expect(fallback.getByRole('link').last()).toBeVisible();
  }
  await expectNoHorizontalClipping(page);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('the page and expanded career disclosures pass axe', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: dialogCases[0]!.opener }),
  ).toBeVisible();
  await expectAccessible(page);
  await expandCareer(page);
  await expect(
    page.getByRole('group', { name: 'Selected work at Descript' }),
  ).toBeVisible();
  await expectAccessible(page);
});

for (const { opener: openerName, title } of dialogCases) {
  test(`${title}: native modal semantics, focus, keyboard containment and dismissal`, async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    const opener = page.getByRole('button', { name: openerName });
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    const heading = dialog.getByRole('heading', { name: title, exact: true });
    const close = dialog.getByRole('button', { name: /^Close / });
    await expect(heading).toBeFocused();
    await expectAccessible(page);
    await tabToBoundary(page, close, browserName);
    const content = dialog.getByRole('region', { name: `${title} content` });
    await page.keyboard.press(tabKey(browserName));
    await expect(content).toBeFocused();
    const isScrollable = await content.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    );
    if (isScrollable) {
      await page.keyboard.press('PageDown');
      await expect
        .poll(() => content.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
    }
    const links = dialog.getByRole('link');
    for (const link of await links.all()) {
      await page.keyboard.press(tabKey(browserName));
      await expect(link).toBeFocused();
      await expectDialogFocusVisible(link);
    }
    const lastControl = (await links.count()) > 0 ? links.last() : content;
    await expectDialogFocusVisible(lastControl);
    await tabToBoundary(page, close, browserName);
    await tabToBoundary(page, lastControl, browserName, true);
    await expectDialogFocusVisible(lastControl);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(heading).toBeFocused();
    await close.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
}

test('skip and section navigation move keyboard focus to visible destinations', async ({
  page,
  browserName,
}) => {
  await page.goto('/');
  await page.keyboard.press(tabKey(browserName));
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  for (const [name, id] of [
    ['Work', 'work'],
    ['Consulting', 'consulting'],
    ['Writing', 'writing'],
    ['Open source', 'open-source'],
    ['Speaking', 'speaking'],
  ]) {
    const link = page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    await link.focus();
    await page.keyboard.press('Enter');
    const section = page.locator(`#${id}`);
    await expect(section).toBeFocused();
    await expect
      .poll(() =>
        section.evaluate((element) => {
          const header =
            document.querySelector<HTMLElement>('[data-site-header]');
          const bottom =
            header && getComputedStyle(header).position === 'sticky'
              ? header.getBoundingClientRect().bottom
              : 0;
          return element.getBoundingClientRect().top >= bottom - 1;
        }),
      )
      .toBe(true);
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all career roles, talks and podcast episodes remain available', async ({
    page,
  }) => {
    await page.goto('/');
    await expectCompleteFallbacks(page);
  });
});

test('unavailable showModal keeps native content fallbacks usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      value: undefined,
    });
  });
  await page.goto('/');
  await expectCompleteFallbacks(page);
});

test('200 percent text sizing retains content and controls without horizontal clipping', async ({
  page,
}) => {
  await page.goto('/');
  await expandCareer(page);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await expectNoHorizontalClipping(page);
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await navigation.getByRole('link', { name: 'Work', exact: true }).click();
  await expect
    .poll(() =>
      page.locator('#work').evaluate((element) => {
        const offset =
          Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              '--header-offset',
            ),
          ) || 0;
        return element.getBoundingClientRect().top >= offset - 1;
      }),
    )
    .toBe(true);
  for (const { opener: name, title } of dialogCases) {
    await page.getByRole('button', { name }).click();
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    await expectNoHorizontalClipping(page);
    await dialog.getByRole('button', { name: /^Close / }).click();
  }
});

test('WCAG text-spacing overrides retain content and controls', async ({
  page,
}) => {
  await page.goto('/');
  await expandCareer(page);
  await page.addStyleTag({
    content: `
    * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
    p { margin-bottom: 2em !important; }
  `,
  });
  await expectNoHorizontalClipping(page);
  for (const { opener: name, title } of dialogCases) {
    await page.getByRole('button', { name }).click();
    await expectNoHorizontalClipping(page);
    await page
      .getByRole('dialog', { name: title, exact: true })
      .getByRole('button', { name: /^Close / })
      .click();
  }
});

test('short viewports with enlarged text keep dialog lists readable and scrollable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 400 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  for (const { opener: name, title } of dialogCases) {
    await page.getByRole('button', { name }).click();
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    const content = dialog.getByRole('region', { name: `${title} content` });
    await content.focus();
    expect(
      await content.evaluate((element) => element.clientHeight),
    ).toBeGreaterThanOrEqual(190);
    await page.keyboard.press('PageDown');
    await expect
      .poll(() => content.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await expectNoHorizontalClipping(page);
    const links = dialog.getByRole('link');
    if (await links.count()) {
      await links.last().focus();
      await expect
        .poll(() =>
          links.last().evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return rect.top < innerHeight && rect.bottom > 0;
          }),
        )
        .toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('reduced motion prevents reveals and animated scrolling', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Work history', exact: true }).click();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe('auto');
});

test('illustration motion settles, respects replay cooldowns, and stops when reduced motion is enabled', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const study = page
    .locator('#open-source article [data-illustration]')
    .first();
  const trigger = page
    .locator('#open-source article[data-illustration-trigger]')
    .first();
  const liveDrawing = study.locator('[data-illustration-live]');
  const finishedFrame = study.locator('[data-illustration-frame]');
  const link = page.getByRole('link', { name: 'TanStack Form', exact: true });
  const activeAnimationCount = () =>
    study.evaluate(
      (element) =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState !== 'finished').length,
    );
  const illustrationState = () =>
    study.evaluate((element) =>
      Array.from(
        element.querySelectorAll('[data-draw], [data-illustration-node]'),
        (part) => {
          const style = getComputedStyle(part);
          return {
            dashArray: style.strokeDasharray,
            dashOffset: style.strokeDashoffset,
            opacity: style.opacity,
            transform: style.transform,
          };
        },
      ),
    );

  await study.scrollIntoViewIfNeeded();
  await expect.poll(activeAnimationCount).toBeGreaterThan(0);
  await expect.poll(activeAnimationCount).toBe(0);
  const restingState = await illustrationState();
  expect(restingState.length).toBeGreaterThan(0);

  await trigger.hover();
  expect(await activeAnimationCount()).toBe(0);
  await link.focus();
  await expect(link).toBeFocused();
  expect(await activeAnimationCount()).toBe(0);
  expect(await illustrationState()).toEqual(restingState);

  // Exercise the real cooldown rather than advancing only animation timers.
  await page.waitForTimeout(3000);
  expect(await activeAnimationCount()).toBe(0);
  await page.locator('#open-source').focus();
  await link.focus();
  await expect(link).toBeFocused();
  await expect(finishedFrame).toHaveCount(1);
  await expect
    .poll(
      () =>
        study.evaluate((element) => {
          const live = element.querySelector('[data-illustration-live]');
          const frame = element.querySelector('[data-illustration-frame]');
          if (!live || !frame) return false;
          const liveOpacity = Number(getComputedStyle(live).opacity);
          const frameOpacity = Number(getComputedStyle(frame).opacity);
          return (
            liveOpacity > 0 &&
            liveOpacity < 1 &&
            frameOpacity > 0 &&
            frameOpacity < 1
          );
        }),
      { intervals: [10, 20, 40] },
    )
    .toBe(true);
  await expect.poll(activeAnimationCount).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(activeAnimationCount).toBe(0);
  await expect(finishedFrame).toHaveCount(0);
  await expect(liveDrawing).toHaveCSS('opacity', '1');
  await expect.poll(illustrationState).toEqual(restingState);

  // The reduced-motion guard must still apply after the new cooldown expires.
  await page.waitForTimeout(3000);
  await page.locator('#open-source').focus();
  await page.mouse.move(0, 0);
  await trigger.hover();
  await link.focus();
  await expect(link).toBeFocused();
  expect(await activeAnimationCount()).toBe(0);
  await expect(finishedFrame).toHaveCount(0);
  await expect(liveDrawing).toHaveCSS('opacity', '1');
  expect(await illustrationState()).toEqual(restingState);
});

test('forced colors retain visible keyboard focus and disclosure indicators', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Forced-colors emulation is supported by Chromium.',
  );
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  expect(
    await skip.evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        style.outlineStyle !== 'none' &&
        Number.parseFloat(style.outlineWidth) >= 2
      );
    }),
  ).toBe(true);
  const summary = page.locator('#work details').first().locator('summary');
  await summary.focus();
  await expect(summary).toBeFocused();
  expect(
    await summary.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).outlineWidth),
    ),
  ).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('group', { name: 'Selected outcomes at Immersive Homes' }),
  ).toBeHidden();
});

test('assistive text conveys symbols and link destinations clearly', async ({
  page,
}) => {
  await page.goto('/');
  await expandCareer(page);
  const snapshot = await page.getByRole('main').ariaSnapshot();
  expect(snapshot).toContain('Reduced from 20 minutes to 5 minutes');
  expect(snapshot).toContain('More than 680');
  expect(snapshot).toContain('From React 16 to React 18');
  expect(snapshot).toContain('1.2 million lines');
  expect(snapshot).toContain('350 percent increase');
  expect(snapshot).not.toMatch(/[→↗↓]/);
  expect(snapshot).not.toMatch(/\[ 0[123] \]|\/ 0[123]/);
  for (const title of [
    'The Framework Field Guide',
    'The Big Bot Builders',
    'The Art of Accessibility',
  ]) {
    await expect(
      page.getByRole('link', { name: `Read ${title}`, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: new RegExp(`^Read the book\\s*:\\s*${title}$`),
      }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole('link', { name: 'TanStack Form', exact: true }),
  ).toBeVisible();
});
