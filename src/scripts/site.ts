const header = document.querySelector<HTMLElement>('[data-site-header]');
const menuButton =
  document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menuLabel = document.querySelector<HTMLElement>('[data-menu-label]');
const nav = document.querySelector<HTMLElement>('[data-main-nav]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (header && menuButton && menuLabel && nav) {
  const closeMenu = (restoreFocus = false): void => {
    header.removeAttribute('data-menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuLabel.textContent = 'Menu';
    if (restoreFocus) menuButton.focus();
  };

  menuButton.hidden = false;
  document.documentElement.setAttribute('data-nav-ready', '');
  let mobileMenuVisible =
    window.getComputedStyle(menuButton).display !== 'none';

  // Read the CSS state so the Sass breakpoint remains the single source of truth.
  const syncMenuForViewport = (): void => {
    const visible = window.getComputedStyle(menuButton).display !== 'none';
    if (visible !== mobileMenuVisible) closeMenu();
    mobileMenuVisible = visible;
  };

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    header.toggleAttribute('data-menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? 'Close' : 'Menu';
  });
  nav.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a'))
      closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.hasAttribute('data-menu-open')) {
      closeMenu(true);
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !header.contains(event.target))
      closeMenu();
  });
  window.addEventListener('resize', syncMenuForViewport, { passive: true });
  if ('ResizeObserver' in window) {
    const menuResizeObserver = new ResizeObserver(syncMenuForViewport);
    menuResizeObserver.observe(menuButton);
  }
}

// Keep a textual and underlined location indicator, independent of motion.
const sectionLinks = [
  ...document.querySelectorAll<HTMLAnchorElement>('[data-nav]'),
];
const sections = sectionLinks
  .map((link) => {
    const href = link.getAttribute('href');
    return href?.startsWith('#')
      ? document.getElementById(href.slice(1))
      : null;
  })
  .filter((section): section is HTMLElement => section !== null);
let scrollQueued = false;

function markCurrentSection(): void {
  scrollQueued = false;
  let current = '';
  const readingLine =
    (header?.getBoundingClientRect().height ?? 0) + window.innerHeight * 0.2;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= readingLine)
      current = `#${section.id}`;
  }
  for (const link of sectionLinks) {
    if (link.getAttribute('href') === current)
      link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function queueSectionUpdate(): void {
  if (!scrollQueued) {
    scrollQueued = true;
    window.requestAnimationFrame(markCurrentSection);
  }
}

window.addEventListener('scroll', queueSectionUpdate, { passive: true });
window.addEventListener('resize', queueSectionUpdate, { passive: true });
window.addEventListener('hashchange', queueSectionUpdate);
markCurrentSection();

// Content is visible by default. Motion is an enhancement, never a gate.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const activeAnimations = new Set<Animation>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (reducedMotion.matches || typeof entry.target.animate !== 'function')
          continue;
        const animation = entry.target.animate(
          [
            { opacity: 0, transform: 'translateY(16px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'none' },
        );
        activeAnimations.add(animation);
        const forgetAnimation = (): void => {
          activeAnimations.delete(animation);
        };
        animation.addEventListener('finish', forgetAnimation, { once: true });
        animation.addEventListener('cancel', forgetAnimation, { once: true });
      }
    },
    { threshold: 0.12 },
  );
  document
    .querySelectorAll('[data-reveal]')
    .forEach((element) => observer.observe(element));
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      observer.disconnect();
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations.clear();
    }
  });
}

const copyButton =
  document.querySelector<HTMLButtonElement>('[data-copy-email]');
const email = document.querySelector<HTMLAnchorElement>('[data-contact-email]');
const copyLabel = document.querySelector<HTMLElement>('[data-copy-label]');
const status = document.querySelector<HTMLElement>('[data-copy-status]');
const address = email
  ?.getAttribute('href')
  ?.replace(/^mailto:/, '')
  .split('?')[0];

if (copyButton && email && copyLabel && status && address) {
  copyButton.hidden = false;
  let resetTimer: number | undefined;
  copyButton.addEventListener('click', async () => {
    window.clearTimeout(resetTimer);
    copyButton.disabled = true;
    copyLabel.textContent = 'Copying…';
    status.textContent = '';
    let copied = false;
    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(address);
      copied = true;
    } catch {
      // Some browsers require a selection-based copy operation.
      try {
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(email);
          selection.removeAllRanges();
          selection.addRange(range);
          copied = document.execCommand('copy');
          if (copied) selection.removeAllRanges();
        }
      } catch {
        copied = false;
      }
    }
    copyButton.disabled = false;
    copyLabel.textContent = copied ? 'Copied' : 'Copy email';
    status.textContent = copied
      ? 'Email address copied. I look forward to hearing from you.'
      : 'Copy isn’t available here. Select the email address and copy it manually.';
    if (copied) {
      resetTimer = window.setTimeout(() => {
        copyLabel.textContent = 'Copy email';
      }, 2400);
    }
  });
}

export {};
