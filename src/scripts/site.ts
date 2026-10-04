const header = document.querySelector<HTMLElement>('[data-site-header]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    Math.max(0, header?.getBoundingClientRect().bottom ?? 0) +
    window.innerHeight * 0.2;
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

export {};
