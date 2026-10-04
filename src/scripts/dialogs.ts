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
      if (!dialog.open) dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
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
