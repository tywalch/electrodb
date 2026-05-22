import type { FunctionalComponent } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import type { MarkdownHeading } from "astro";

const ACTIVATION_OFFSET = 100;

const TableOfContents: FunctionalComponent<{ headings: MarkdownHeading[] }> = ({
  headings = [],
}) => {
  const [activeId, setActiveId] = useState<string>("overview");
  const pinnedRef = useRef(false);
  const pinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const tocSlugs = new Set(
      headings.filter(({ depth }) => depth > 1 && depth < 4).map((h) => h.slug),
    );
    const titles = Array.from(
      document.querySelectorAll<HTMLElement>("article :is(h2, h3)"),
    ).filter((el) => el.id && tocSlugs.has(el.id));

    if (titles.length === 0) {
      return;
    }

    let positions: { id: string; top: number }[] = [];
    const recompute = () => {
      positions = titles.map((t) => ({
        id: t.id,
        top: t.getBoundingClientRect().top + window.scrollY,
      }));
    };

    let raf: number | null = null;
    const update = () => {
      raf = null;
      if (pinnedRef.current) return;
      if (positions.length === 0) return;

      const y = window.scrollY + ACTIVATION_OFFSET;

      if (y < positions[0].top) {
        setActiveId("overview");
        return;
      }

      let active = positions[0].id;
      for (const p of positions) {
        if (p.top <= y) active = p.id;
        else break;
      }
      setActiveId(active);
    };

    const schedule = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(update);
    };

    const onResize = () => {
      recompute();
      schedule();
    };

    recompute();
    update();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    if (document.fonts?.ready) {
      document.fonts.ready.then(onResize);
    }

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  const releasePin = () => {
    pinnedRef.current = false;
    if (pinTimeoutRef.current !== null) {
      clearTimeout(pinTimeoutRef.current);
      pinTimeoutRef.current = null;
    }
  };

  const handleClick =
    (slug: string) =>
    (event: {
      metaKey: boolean;
      ctrlKey: boolean;
      shiftKey: boolean;
      altKey: boolean;
      preventDefault: () => void;
    }) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target =
        slug === "overview"
          ? document.scrollingElement || document.documentElement
          : document.getElementById(slug);
      if (!target) return;

      event.preventDefault();
      releasePin();
      pinnedRef.current = true;
      setActiveId(slug);

      if (slug === "overview") {
        window.scrollTo({ top: 0, left: 0 });
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } else {
        (target as HTMLElement).scrollIntoView();
        history.replaceState(null, "", `#${slug}`);
      }

      pinTimeoutRef.current = window.setTimeout(() => {
        releasePin();
      }, 150);
    };

  return (
    <>
      <h2 className="heading">On this page</h2>
      <ul className="toc-list">
        <li
          className={`heading-link depth-2 ${
            activeId === "overview" ? "active" : ""
          }`.trim()}
        >
          <a href="#overview" onClick={handleClick("overview")}>
            Overview
          </a>
        </li>
        {headings
          .filter(
            ({ depth, text }) =>
              depth > 1 &&
              depth < 4 &&
              text.trim().toLowerCase() !== "overview",
          )
          .map((heading) => (
            <li
              key={heading.slug}
              className={`heading-link depth-${heading.depth} ${
                activeId === heading.slug ? "active" : ""
              }`.trim()}
            >
              <a href={`#${heading.slug}`} onClick={handleClick(heading.slug)}>
                {heading.text}
              </a>
            </li>
          ))}
      </ul>
    </>
  );
};

export default TableOfContents;
