/*
 * Full-screen image lightbox via <dialog>. Images opt in with data-lightbox.
 */

export function initLightbox() {
  const dialog = document.getElementById("imageLightbox");
  const dialogImg = dialog?.querySelector(".lightbox__img");
  const closeBtn = dialog?.querySelector(".lightbox__close");

  if (!dialog || !dialogImg || !closeBtn) return;

  /** @type {HTMLElement | null} */
  let lastTrigger = null;

  const open = (trigger, src, alt) => {
    lastTrigger = trigger;
    dialogImg.src = src;
    dialogImg.alt = alt || "";
    dialog.showModal();
  };

  const close = () => {
    dialog.close();
  };

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("img[data-lightbox]");
    if (!trigger) return;
    e.preventDefault();
    const src = trigger.currentSrc || trigger.getAttribute("src") || "";
    open(trigger, src, trigger.getAttribute("alt") || "");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const trigger = e.target.closest("img[data-lightbox]");
    if (!trigger) return;
    e.preventDefault();
    const src = trigger.currentSrc || trigger.getAttribute("src") || "";
    open(trigger, src, trigger.getAttribute("alt") || "");
  });

  closeBtn.addEventListener("click", close);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  dialog.addEventListener("close", () => {
    dialogImg.removeAttribute("src");
    dialogImg.alt = "";
    lastTrigger?.focus({ preventScroll: true });
    lastTrigger = null;
  });
}
