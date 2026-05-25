/*
 * Signature fragrances — show N slides at once, prev/next + arrow keys.
 */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function visibleSlides() {
  const w = window.innerWidth;
  if (w < 520) return 1;
  if (w < 920) return 2;
  return 3;
}

function flexGapPx(track) {
  const g = getComputedStyle(track).gap;
  if (g.endsWith("px")) return parseFloat(g) || 0;
  const m = g.match(/^([\d.]+)px/);
  return m ? parseFloat(m[1]) : 0;
}

/**
 * @param {HTMLElement} root
 */
export function initSignatureCarousel(root) {
  const viewport = root.querySelector(".signature-carousel__viewport");
  const track = root.querySelector(".signature-carousel__track");
  const prev = root.querySelector(".signature-carousel__arrow--prev");
  const next = root.querySelector(".signature-carousel__arrow--next");
  if (!viewport || !track || !prev || !next) return;

  const slides = [...track.querySelectorAll(".signature-carousel__slide")];
  if (!slides.length) return;

  /** @type {number} */
  let index = 0;

  function maxIndex() {
    return Math.max(0, slides.length - visibleSlides());
  }

  function layout() {
    const n = visibleSlides();
    const vpW = viewport.getBoundingClientRect().width;
    const g = flexGapPx(track);
    const slideW = n > 0 ? (vpW - g * (n - 1)) / n : vpW;

    slides.forEach((slide) => {
      slide.style.flex = `0 0 ${Math.max(0, slideW)}px`;
    });

    index = Math.min(index, maxIndex());
    const step = slideW + g;
    const offset = index * step;

    if (prefersReducedMotion()) {
      track.style.transition = "none";
    } else {
      track.style.transition = `transform 0.5s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1))`;
    }

    track.style.transform = `translate3d(-${offset}px, 0, 0)`;

    const atStart = index <= 0;
    const atEnd = index >= maxIndex();
    prev.disabled = atStart;
    next.disabled = atEnd;
    prev.setAttribute("aria-disabled", String(atStart));
    next.setAttribute("aria-disabled", String(atEnd));
  }

  prev.addEventListener("click", () => {
    index = Math.max(0, index - 1);
    layout();
  });

  next.addEventListener("click", () => {
    index = Math.min(maxIndex(), index + 1);
    layout();
  });

  root.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    const ae = document.activeElement;
    if (!ae || !root.contains(ae)) return;

    const tag = ae.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "A") return;

    e.preventDefault();
    if (e.key === "ArrowLeft") {
      index = Math.max(0, index - 1);
      layout();
    } else {
      index = Math.min(maxIndex(), index + 1);
      layout();
    }
  });

  const ro = new ResizeObserver(() => layout());
  ro.observe(viewport);

  requestAnimationFrame(() => layout());
}

export function initSignatureCarousels() {
  document
    .querySelectorAll("[data-signature-carousel]")
    .forEach((el) => initSignatureCarousel(/** @type {HTMLElement} */ (el)));
}
