/*
 * Full-screen image lightbox via <dialog>. Images opt in with data-lightbox.
 * Dialog is created here so markup stays out of the static template/footer region.
 */

function ensureLightboxDialog() {
  let dialog = document.getElementById("imageLightbox");
  if (dialog) return dialog;

  dialog = document.createElement("dialog");
  dialog.id = "imageLightbox";
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Enlarged image");

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lightbox__close";
  closeBtn.setAttribute("aria-label", "Close enlarged image");
  closeBtn.innerHTML = "\u00D7";

  const dialogImg = document.createElement("img");
  dialogImg.className = "lightbox__img";
  dialogImg.alt = "";
  dialogImg.decoding = "async";

  dialog.append(closeBtn, dialogImg);
  document.body.append(dialog);
  return dialog;
}

export function initLightbox() {
  const dialog = ensureLightboxDialog();
  const dialogImg = dialog.querySelector(".lightbox__img");
  const closeBtn = dialog.querySelector(".lightbox__close");

  if (!dialogImg || !closeBtn) return;

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
