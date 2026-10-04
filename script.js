(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const mobile = window.matchMedia('(max-width: 767px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (header && menuButton && nav) {
    const closeMenu = (restoreFocus = false) => {
      header.classList.remove('menu-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.querySelector('.menu-label').textContent = 'Menu';
      if (restoreFocus) menuButton.focus();
    };

    menuButton.hidden = false;
    document.documentElement.classList.add('nav-ready');
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      header.classList.toggle('menu-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && header.classList.contains('menu-open')) {
        closeMenu(true);
      }
    });
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) closeMenu();
    });
    mobile.addEventListener('change', () => closeMenu());
  }

  // Keep a textual and underlined location indicator, independent of motion.
  const sectionLinks = [...document.querySelectorAll('[data-nav]')];
  const sections = sectionLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  let scrollQueued = false;
  function markCurrentSection() {
    scrollQueued = false;
    let current = '';
    const readingLine = (header ? header.getBoundingClientRect().height : 0) + window.innerHeight * 0.2;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= readingLine) current = '#' + section.id;
    }
    for (const link of sectionLinks) {
      if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  function queueSectionUpdate() {
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
    const activeAnimations = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (reducedMotion.matches || typeof entry.target.animate !== 'function') return;
        const animation = entry.target.animate(
          [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'none' }
        );
        activeAnimations.add(animation);
        animation.addEventListener('finish', () => activeAnimations.delete(animation), { once: true });
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    reducedMotion.addEventListener('change', event => {
      if (event.matches) {
        observer.disconnect();
        activeAnimations.forEach(animation => animation.cancel());
        activeAnimations.clear();
      }
    });
  }

  const copyButton = document.querySelector('[data-copy-email]');
  const email = document.querySelector('.contact-email');
  const status = document.querySelector('.copy-status');
  if (copyButton && email && status) {
    copyButton.hidden = false;
    let resetTimer;
    copyButton.addEventListener('click', async () => {
      const address = email.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
      const label = copyButton.querySelector('.copy-label');
      clearTimeout(resetTimer);
      copyButton.disabled = true;
      label.textContent = 'Copying…';
      status.textContent = '';
      let copied = false;
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(address);
        copied = true;
      } catch {
        // Local-file browsers may require a selection-based copy operation.
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(email);
          selection.removeAllRanges();
          selection.addRange(range);
          copied = document.execCommand('copy');
          if (copied) selection.removeAllRanges();
        } catch { copied = false; }
      }
      copyButton.disabled = false;
      label.textContent = copied ? 'Copied' : 'Copy email';
      status.textContent = copied
        ? 'Email address copied. I look forward to hearing from you.'
        : 'Copy isn’t available here. Select the email address and copy it manually.';
      if (copied) resetTimer = setTimeout(() => { label.textContent = 'Copy email'; }, 2400);
    });
  }
})();
