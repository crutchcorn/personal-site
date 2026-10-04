const header = document.querySelector<HTMLElement>('[data-site-header]');
const pageSections = [
  ...document.querySelectorAll<HTMLElement>('#main > section'),
];
let headerSection: HTMLElement | null = null;

function syncHeaderSurface(headerBottom: number): void {
  if (!header) return;
  // Read the CSS state so the mobile breakpoint stays in Sass.
  if (window.getComputedStyle(header).position !== 'sticky') {
    if (headerSection) {
      header.style.removeProperty('--header-background');
      header.style.removeProperty('--header-color');
      header.style.removeProperty('--header-accent');
      headerSection = null;
    }
    return;
  }

  const section =
    pageSections.find((section) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= headerBottom && bounds.bottom > headerBottom;
    }) ?? document.body;
  if (section === headerSection) return;

  // Transparent sections show the nearest ancestor's background.
  let surface: HTMLElement | null = section;
  let background = 'transparent';
  while (surface) {
    background = window.getComputedStyle(surface).backgroundColor;
    if (background !== 'transparent' && background !== 'rgba(0, 0, 0, 0)')
      break;
    surface = surface.parentElement;
  }
  const sectionStyle = window.getComputedStyle(section);
  header.style.setProperty('--header-background', background);
  header.style.setProperty('--header-color', sectionStyle.color);
  header.style.setProperty(
    '--header-accent',
    sectionStyle.getPropertyValue('--header-accent').trim() ||
      sectionStyle.getPropertyValue('--accent').trim(),
  );
  headerSection = section;
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
  const headerBounds = header?.getBoundingClientRect();
  const stickyHeader =
    header && window.getComputedStyle(header).position === 'sticky';
  document.documentElement.style.setProperty(
    '--header-offset',
    `${stickyHeader ? (headerBounds?.height ?? 0) : 0}px`,
  );
  const headerBottom = Math.max(0, headerBounds?.bottom ?? 0);
  syncHeaderSurface(headerBottom);
  const readingLine = headerBottom + window.innerHeight * 0.2;
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
if ('ResizeObserver' in window) {
  const layoutObserver = new ResizeObserver(queueSectionUpdate);
  if (header) layoutObserver.observe(header);
  const main = document.getElementById('main');
  if (main) layoutObserver.observe(main);
}
markCurrentSection();

export {};
