(() => {
  if (typeof window === "undefined") return;

  const SELECTOR = ".content h2[id], .content h3[id], .content h4[id]";
  const ICON =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

  const decorate = (heading) => {
    if (heading.querySelector(".heading-anchor")) return;
    const link = document.createElement("a");
    link.className = "heading-anchor";
    link.href = `#${heading.id}`;
    link.setAttribute("aria-label", `Link to "${heading.textContent.trim()}"`);
    link.innerHTML = ICON;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const url = new URL(window.location.href);
      url.hash = heading.id;
      history.replaceState(null, "", url.toString());
      heading.scrollIntoView({ block: "start" });
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url.toString()).catch(() => {});
      }
    });
    heading.appendChild(link);
  };

  const run = () => {
    document.querySelectorAll(SELECTOR).forEach(decorate);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }

  window.addEventListener("softnav:done", run);

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.(".mobile-toc a");
    if (!link) return;
    const details = link.closest("details.mobile-toc");
    if (details) details.open = false;
  });
})();
