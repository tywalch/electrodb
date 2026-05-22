(() => {
  if (typeof window === "undefined") return;

  const fmtAbbrev = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
    return String(Math.round(n));
  };
  const fmtFull = (n) => Math.round(n).toLocaleString("en-US");

  const formatters = { full: fmtFull, abbrev: fmtAbbrev };

  const START_RATIO = 0.995;
  const DURATION_MS = 80000;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animate = (el, target, format) => {
    const startValue = Math.floor(target * START_RATIO);
    const delta = target - startValue;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const value = startValue + delta * progress;
      el.textContent = format(value);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = format(target);
    };
    requestAnimationFrame(tick);
  };

  const createObserver = () =>
    new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          if (el.dataset.counted) {
            observer.unobserve(el);
            continue;
          }
          const target = Number(el.dataset.counter);
          const format = formatters[el.dataset.format || ""] || fmtAbbrev;
          if (!Number.isFinite(target) || target <= 0) continue;
          el.dataset.counted = "true";
          const animated = el.dataset.animated === "true";
          if (reduce || !animated) {
            el.textContent = format(target);
          } else {
            el.textContent = format(Math.floor(target * START_RATIO));
            animate(el, target, format);
          }
          observer.unobserve(el);
        }
      },
      { threshold: 0.4 },
    );

  let observer = createObserver();

  const fetchJson = async (url) => {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  };

  const cache = new Map();

  const fetchers = {
    "npm-downloads": async () => {
      const data = await fetchJson(
        "https://api.npmjs.org/downloads/point/last-month/electrodb",
      );
      return typeof data?.downloads === "number" ? data.downloads : null;
    },
    "github-stars": async () => {
      const data = await fetchJson(
        "https://api.github.com/repos/tywalch/electrodb",
      );
      return typeof data?.stargazers_count === "number"
        ? data.stargazers_count
        : null;
    },
  };

  const getValue = async (endpoint) => {
    if (cache.has(endpoint)) return cache.get(endpoint);
    const promise = fetchers[endpoint]();
    cache.set(endpoint, promise);
    return promise;
  };

  const MIN_SKELETON_MS = 500;
  const FADE_MS = 200;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const reveal = async (el, text, observeForCounter) => {
    const skeleton = el.querySelector(".stats-skeleton");
    if (skeleton && !reduce) {
      skeleton.style.transition = `opacity ${FADE_MS}ms ease`;
      skeleton.style.opacity = "0";
      await wait(FADE_MS);
    }
    el.textContent = text;
    if (!reduce && typeof el.animate === "function") {
      el.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: FADE_MS, easing: "ease-out" },
      );
    }
    if (observeForCounter) {
      observer.observe(el);
    }
  };

  const init = async () => {
    const elements = Array.from(
      document.querySelectorAll("[data-endpoint]:not([data-counter])"),
    );
    if (elements.length === 0) return;
    observer = createObserver();
    const start = performance.now();
    await Promise.all(
      elements.map(async (el) => {
        const endpoint = el.dataset.endpoint;
        const format = formatters[el.dataset.format || ""] || fmtAbbrev;
        if (!endpoint || !fetchers[endpoint]) return;
        const value = await getValue(endpoint);

        const elapsed = performance.now() - start;
        const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);
        if (remaining > 0 && !reduce) await wait(remaining);

        if (typeof value !== "number" || value <= 0) {
          await reveal(el, "—", false);
          el.dataset.counted = "true";
          return;
        }
        el.dataset.counter = String(value);
        const animated = el.dataset.animated === "true";
        const text = format(animated ? Math.floor(value * START_RATIO) : value);
        await reveal(el, text, true);
      }),
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
  window.addEventListener("softnav:done", init);
})();
