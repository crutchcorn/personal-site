const dialogs = document.querySelectorAll<HTMLDialogElement>('[data-dialog]');

for (const dialog of dialogs) {
  if (typeof dialog.showModal !== 'function') continue;

  const openers = document.querySelectorAll<HTMLButtonElement>(
    `[data-dialog-open="${dialog.id}"]`,
  );
  let activeOpener: HTMLButtonElement | undefined;

  for (const opener of openers) {
    opener.hidden = false;
    opener.addEventListener('click', () => {
      activeOpener = opener;
      if (!dialog.open) {
        dialog.showModal();
        dialog.scrollTop = 0;
        const content = dialog.querySelector<HTMLElement>(
          '[data-dialog-content]',
        );
        if (content) content.scrollTop = 0;
      }
    });
  }

  if (openers.length > 0) {
    for (const fallback of document.querySelectorAll<HTMLElement>(
      `[data-dialog-fallback="${dialog.id}"]`,
    )) {
      fallback.hidden = true;
    }
  }

  dialog.addEventListener('close', () => {
    if (activeOpener?.isConnected) activeOpener.focus();
  });

  const content = dialog.querySelector<HTMLElement>('[data-dialog-content]');
  content?.addEventListener('focusin', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target === content) return;
    // Native focus scrolling can leave a link clipped after keyboard scrolling.
    // Correct only the body after the browser finishes moving focus.
    window.requestAnimationFrame(() => {
      if (document.activeElement !== target) return;
      const bounds = content.getBoundingClientRect();
      const targetBounds = target.getBoundingClientRect();
      const style = window.getComputedStyle(content);
      const top = bounds.top + Number.parseFloat(style.scrollPaddingTop);
      const bottom =
        bounds.bottom - Number.parseFloat(style.scrollPaddingBottom);
      const distance =
        targetBounds.height > bottom - top || targetBounds.top < top
          ? targetBounds.top - top
          : targetBounds.bottom > bottom
            ? targetBounds.bottom - bottom
            : 0;
      if (distance) content.scrollBy({ top: distance, behavior: 'instant' });
    });
  });

  // A click outside the dialog's box is a click on its native backdrop.
  // Padding and whitespace inside the dialog keep it open.
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      dialog.close();
    }
  });
}

export {};
