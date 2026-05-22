// Soft navigation: intercept same-origin link clicks and swap only <main>
// without a full page reload. Falls back to native navigation on any error.
(() => {
  if (typeof window === "undefined") return;

  const MAIN_SELECTOR = "main.layout";
  let navToken = 0;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const scrollPositions = new Map();
  const positionKey = () =>
    `${window.location.pathname}${window.location.search}`;

  const saveScroll = () => {
    scrollPositions.set(positionKey(), window.scrollY);
  };

  window.addEventListener("scroll", () => {
    scrollPositions.set(positionKey(), window.scrollY);
  }, { passive: true });

  const isInternal = (url) => {
    try {
      const u = new URL(url, window.location.href);
      if (u.origin !== window.location.origin) return false;
      if (u.pathname.startsWith("/pagefind/")) return false;
      if (u.pathname.endsWith(".xml") || u.pathname.endsWith(".json")) return false;
      return true;
    } catch {
      return false;
    }
  };

  const reExecuteScripts = (root) => {
    const scripts = root.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      for (const attr of oldScript.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
  };

  const focusMain = () => {
    const openModal = document.querySelector(
      '[role="dialog"][aria-modal="true"]',
    );
    if (openModal) return;
    const main = document.querySelector(MAIN_SELECTOR);
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  };

  const styleKey = (node) => {
    const href = node.getAttribute("href");
    if (href) return `link:${href}`;
    return `style:${(node.textContent || "").slice(0, 100)}|${(node.textContent || "").length}`;
  };

  const mergeHeadStyles = (newHead) => {
    const existing = new Set();
    document.head
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => existing.add(styleKey(node)));
    const pending = [];
    newHead
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => {
        const key = styleKey(node);
        if (existing.has(key)) return;
        const clone = node.cloneNode(true);
        if (clone.tagName === "LINK" && clone.rel === "stylesheet") {
          pending.push(
            new Promise((resolve) => {
              clone.addEventListener("load", resolve, { once: true });
              clone.addEventListener("error", resolve, { once: true });
            }),
          );
        }
        document.head.appendChild(clone);
        existing.add(key);
      });
    return Promise.all(pending);
  };

  const navigateTo = async (href, { push = true } = {}) => {
    const token = ++navToken;
    document.documentElement.dataset.navigating = "";
    if (push) saveScroll();
    try {
      const response = await fetch(href, {
        headers: { Accept: "text/html" },
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      if (token !== navToken) return; // Superseded by a newer nav

      const doc = new DOMParser().parseFromString(html, "text/html");

      document.title = doc.title;
      await mergeHeadStyles(doc.head);
      if (token !== navToken) return;

      const oldMain = document.querySelector(MAIN_SELECTOR);
      const newMain = doc.querySelector(MAIN_SELECTOR);
      if (!oldMain || !newMain) {
        window.location.assign(href);
        return;
      }

      const oldToc = document.querySelector("details.mobile-toc");
      const newToc = doc.querySelector("details.mobile-toc");
      if (oldToc && newToc) {
        oldToc.replaceWith(newToc);
        reExecuteScripts(newToc);
      } else if (oldToc && !newToc) {
        oldToc.remove();
      } else if (!oldToc && newToc) {
        oldMain.parentNode.insertBefore(newToc, oldMain);
        reExecuteScripts(newToc);
      }

      const sidebarScroll = oldMain.querySelector("#grid-left .nav-scroll");
      const sidebarScrollTop = sidebarScroll ? sidebarScroll.scrollTop : 0;

      oldMain.replaceWith(newMain);
      reExecuteScripts(newMain);

      const newSidebarScroll = newMain.querySelector("#grid-left .nav-scroll");
      if (newSidebarScroll && sidebarScrollTop > 0) {
        newSidebarScroll.scrollTop = sidebarScrollTop;
      }

      if (push) {
        history.pushState({ softNav: true }, "", href);
      }

      const hash = new URL(href, window.location.href).hash;
      const savedScroll = !push ? scrollPositions.get(positionKey()) : undefined;
      if (typeof savedScroll === "number") {
        window.scrollTo({ top: savedScroll, left: 0 });
      } else if (hash) {
        const target = document.querySelector(hash);
        if (target) {
          target.scrollIntoView();
        } else {
          window.scrollTo({ top: 0, left: 0 });
        }
      } else {
        window.scrollTo({ top: 0, left: 0 });
      }

      focusMain();
      window.dispatchEvent(new CustomEvent("softnav:done", { detail: { href } }));
    } catch {
      window.location.assign(href);
    } finally {
      if (token === navToken) {
        delete document.documentElement.dataset.navigating;
      }
    }
  };

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a");
    if (!link) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;
    if (link.dataset.noSoftNav !== undefined) return;
    if (link.getAttribute("rel")?.includes("external")) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (!isInternal(link.href)) return;

    const url = new URL(link.href);

    // Pure on-page hash navigation: let the browser handle it.
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.hash
    ) {
      return;
    }

    event.preventDefault();
    navigateTo(link.href);
  });

  window.addEventListener("popstate", () => {
    navigateTo(window.location.href, { push: false });
  });

  // Lightweight prefetch on hover/focus so the cached fetch above is instant.
  const prefetched = new Set();
  const prefetch = (href) => {
    if (prefetched.has(href)) return;
    prefetched.add(href);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = "document";
    document.head.appendChild(link);
  };

  const PREFETCH_DELAY_MS = 50;
  let prefetchTimer = null;
  let prefetchTarget = null;

  const cancelPendingPrefetch = () => {
    if (prefetchTimer !== null) {
      clearTimeout(prefetchTimer);
      prefetchTimer = null;
    }
    prefetchTarget = null;
  };

  const schedulePrefetch = (event) => {
    const link = event.target.closest?.("a");
    if (link === prefetchTarget) return;

    cancelPendingPrefetch();
    if (!link) return;
    if (link.target && link.target !== "_self") return;
    if (link.dataset.noSoftNav !== undefined) return;
    if (!isInternal(link.href)) return;
    const url = new URL(link.href);
    if (url.pathname === window.location.pathname) return;
    if (prefetched.has(link.href)) return;

    prefetchTarget = link;
    prefetchTimer = window.setTimeout(() => {
      prefetch(link.href);
      prefetchTimer = null;
      prefetchTarget = null;
    }, PREFETCH_DELAY_MS);
  };

  document.addEventListener("mouseover", schedulePrefetch, { passive: true });
  document.addEventListener("focusin", schedulePrefetch);

  window.__softNav = (href) => navigateTo(href);
  document.addEventListener("mouseout", (event) => {
    if (!prefetchTarget) return;
    const next = event.relatedTarget?.closest?.("a");
    if (next === prefetchTarget) return;
    cancelPendingPrefetch();
  }, { passive: true });
  document.addEventListener("focusout", cancelPendingPrefetch);

  const decorateExternalLinks = () => {
    document.querySelectorAll("a[href]").forEach((a) => {
      let url;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin === window.location.origin) return;
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      if (!a.hasAttribute("target")) a.setAttribute("target", "_blank");
      const rel = a.getAttribute("rel") || "";
      const tokens = new Set(rel.split(/\s+/).filter(Boolean));
      tokens.add("noopener");
      tokens.add("noreferrer");
      a.setAttribute("rel", Array.from(tokens).join(" "));
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", decorateExternalLinks, {
      once: true,
    });
  } else {
    decorateExternalLinks();
  }
  window.addEventListener("softnav:done", decorateExternalLinks);
})();
