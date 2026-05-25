/*
 * BONHEURETERNAL — entry point.
 * Loads each feature module, kicks them off, and marks body.is-loaded
 * so CSS entrance animations begin.
 */

import { initNav }        from "./nav.js";
import { initSmoothScroll } from "./scroll.js";
import { initContactForm } from "./form.js";
import { initAnimations }  from "./animations.js";
import { initLightbox }    from "./lightbox.js";
import { initSignatureCarousels } from "./signature-carousel.js";

const boot = () => {
  initNav();
  initSmoothScroll();
  initContactForm();
  initAnimations();
  initLightbox();
  initSignatureCarousels();

  // Trigger hero entrance sequence on next frame, so the initial
  // state has rendered and the transition is actually visible.
  requestAnimationFrame(() => {
    document.body.classList.add("is-loaded");
  });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
