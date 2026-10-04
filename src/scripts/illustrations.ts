const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const drawings = document.querySelectorAll<SVGSVGElement>(
  '[data-illustration]',
);
const active = new Map<SVGSVGElement, Set<Animation>>();
const lastPlayed = new WeakMap<SVGSVGElement, number>();
const replayCooldown = 3000;
const entranceInset = 300;
const easing = 'cubic-bezier(.2,.7,.2,1)';

function visibleInset(): number {
  // Keep a trigger region in short windows, including after a device rotates.
  return Math.min(
    entranceInset,
    Math.max(0, Math.floor((innerHeight - 1) / 2)),
  );
}

function pathLength(path: SVGGeometryElement): number | null {
  try {
    const length = path.getTotalLength();
    return Number.isFinite(length) && length > 0 ? length : null;
  } catch {
    return null;
  }
}

function prepare(drawing: SVGSVGElement): void {
  if (reducedMotion.matches || typeof drawing.animate !== 'function') return;
  drawing
    .querySelectorAll<SVGGeometryElement>('[data-draw]')
    .forEach((path) => {
      const length = pathLength(path);
      if (length !== null)
        path.style.setProperty('--illustration-path-length', `${length}px`);
    });
  drawing.setAttribute('data-illustration-waiting', '');
}

function play(drawing: SVGSVGElement): void {
  if (reducedMotion.matches || active.has(drawing)) return;
  const now = performance.now();
  const previousStart = lastPlayed.get(drawing);
  if (previousStart !== undefined && now - previousStart < replayCooldown)
    return;
  const bounds = drawing.getBoundingClientRect();
  const inset =
    previousStart === undefined &&
    !drawing.hasAttribute('data-illustration-on-visible')
      ? visibleInset()
      : 0;
  if (
    !bounds.width ||
    !bounds.height ||
    bounds.bottom < inset ||
    bounds.top > innerHeight - inset
  )
    return;

  const animations = new Set<Animation>();
  const replay = previousStart !== undefined;
  function animate(
    element: SVGElement,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ): Animation | undefined {
    if (typeof element.animate !== 'function') return;
    // Backwards fill covers staggered starts; completion restores the original SVG.
    const animation = element.animate(frames, {
      easing,
      fill: 'backwards',
      ...options,
    });
    animations.add(animation);
    const forget = (): void => {
      animations.delete(animation);
      if (!animations.size && active.get(drawing) === animations)
        active.delete(drawing);
    };
    animation.addEventListener('finish', forget, { once: true });
    animation.addEventListener('cancel', forget, { once: true });
    return animation;
  }

  if (replay) {
    let live = drawing.querySelector<SVGGElement>('[data-illustration-live]');
    if (!live) {
      live = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      live.setAttribute('data-illustration-live', '');
      live.append(...drawing.childNodes);
      drawing.append(live);
    }

    // Keep the finished drawing visible while the next drawing starts underneath.
    // Both layers share the SVG coordinates, so the crossfade cannot shift the art.
    const frame = live.cloneNode(true) as SVGGElement;
    frame.removeAttribute('data-illustration-live');
    frame.setAttribute('data-illustration-frame', '');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.pointerEvents = 'none';
    frame
      .querySelectorAll('[data-draw], [data-illustration-node]')
      .forEach((part) => {
        part.removeAttribute('data-draw');
        part.removeAttribute('data-illustration-node');
      });
    drawing.append(frame);

    animate(live, [{ opacity: 0 }, { opacity: 1 }], {
      duration: 220,
      easing: 'linear',
    });
    const fade = animate(frame, [{ opacity: 1 }, { opacity: 0 }], {
      duration: 220,
      easing: 'linear',
      fill: 'forwards',
    });
    if (fade) {
      const removeFrame = (): void => frame.remove();
      fade.addEventListener('finish', removeFrame, { once: true });
      fade.addEventListener('cancel', removeFrame, { once: true });
    } else {
      frame.remove();
    }
  }

  drawing
    .querySelectorAll<SVGGeometryElement>('[data-draw]')
    .forEach((path, index) => {
      const length = pathLength(path);
      if (length === null) return;
      animate(
        path,
        [
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 },
        ],
        {
          duration: 700,
          delay: replay ? 0 : Math.min(index * 45, 180),
        },
      );
    });

  drawing
    .querySelectorAll<SVGElement>('[data-illustration-node]')
    .forEach((node, index) => {
      animate(
        node,
        [
          { transform: 'scale(.85)', opacity: 0.5 },
          { transform: 'scale(1.15)', opacity: 1, offset: 0.6 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        {
          duration: 520,
          delay: replay ? 0 : 140 + Math.min(index * 45, 180),
        },
      );
    });

  // The attached animations now own the initial pose, including staggered starts.
  drawing.removeAttribute('data-illustration-waiting');
  if (animations.size) {
    active.set(drawing, animations);
    lastPlayed.set(drawing, now);
  }
}

let observer: IntersectionObserver | undefined;
let visibleObserver: IntersectionObserver | undefined;

// Prepare only when the entrance observer can run; static fallbacks stay complete.
function observeEntrances(): void {
  if (!('IntersectionObserver' in window)) return;
  observer?.disconnect();
  visibleObserver?.disconnect();
  const onEnter: IntersectionObserverCallback = (entries, currentObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const drawing = entry.target as SVGSVGElement;
      play(drawing);
      if (lastPlayed.has(drawing) || reducedMotion.matches)
        currentObserver.unobserve(drawing);
    }
  };
  observer = new IntersectionObserver(onEnter, {
    rootMargin: `-${visibleInset()}px 0px`,
    threshold: 0,
  });
  visibleObserver = new IntersectionObserver(onEnter, { threshold: 0 });
  for (const drawing of drawings) {
    if (lastPlayed.has(drawing)) continue;
    prepare(drawing);
    const entranceObserver = drawing.hasAttribute(
      'data-illustration-on-visible',
    )
      ? visibleObserver
      : observer;
    entranceObserver.observe(drawing);
  }
}

observeEntrances();
window.addEventListener('resize', observeEntrances, { passive: true });

for (const drawing of drawings) {
  // Use the surrounding card so decorative SVGs never need their own tab stop.
  const trigger = drawing.closest<HTMLElement>('[data-illustration-trigger]');
  if (!trigger) continue;
  trigger.addEventListener('pointerenter', (event) => {
    if (finePointer.matches && event.pointerType === 'mouse') play(drawing);
  });
  trigger.addEventListener('focusin', (event) => {
    if (
      event.relatedTarget instanceof Node &&
      trigger.contains(event.relatedTarget)
    )
      return;
    play(drawing);
  });
}

reducedMotion.addEventListener('change', (event) => {
  if (!event.matches) {
    observeEntrances();
    return;
  }
  for (const animations of active.values()) {
    for (const animation of animations) animation.cancel();
  }
  active.clear();
  drawings.forEach((drawing) =>
    drawing.removeAttribute('data-illustration-waiting'),
  );
});

export {};
