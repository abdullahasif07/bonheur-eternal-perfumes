/*
 * Contact form handler.
 *
 * Approach: progressive `mailto:` handoff. No backend needed — on
 * submit, we validate client-side, then open the visitor's mail app
 * with the inquiry pre-filled. To upgrade to a real endpoint (Formspree,
 * Resend, a Lambda, etc.), swap the `window.location.href = mailto`
 * line with a fetch() to that endpoint.
 */

const RECIPIENT = "hello.bonheureternal@gmail.com";
const EMAIL_RE  = /^\S+@\S+\.\S+$/;

export function initContactForm() {
  const form   = document.getElementById("contactForm");
  const status = document.getElementById("contactStatus");
  if (!form || !status) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.classList.remove("is-error", "is-success");

    const data    = new FormData(form);
    const name    = (data.get("name") || "").toString().trim();
    const email   = (data.get("email") || "").toString().trim();
    const message = (data.get("message") || "").toString().trim();

    if (!name || !email || !message) {
      status.textContent = "Please fill in every field.";
      status.classList.add("is-error");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      status.textContent = "Please enter a valid email address.";
      status.classList.add("is-error");
      return;
    }

    const subject = `Inquiry from ${name} — BONHEURETERNAL`;
    const body =
      `Name: ${name}\n` +
      `Email: ${email}\n\n` +
      `Message:\n${message}\n`;

    const mailto =
      `mailto:${RECIPIENT}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;

    status.textContent =
      `Opening your email app… if nothing happens, write to us at ${RECIPIENT}.`;
    status.classList.add("is-success");
    form.reset();
  });
}
