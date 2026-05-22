import type { FunctionalComponent } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import type { MarkdownHeading } from "astro";

const TableOfContents: FunctionalComponent<{ headings: MarkdownHeading[] }> = ({
  headings = [],
}) => {
  const [activeId, setActiveId] = useState<string>("overview");
  const pinnedRef = useRef(false);
  const pinFrameRef = useRef<number | null>(null);
  const pinFallbackRef = useRef<number | null>(null);

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

    const headingMap = new Map<string, HTMLElement>();
    for (const t of titles) {
      headingMap.set(t.id, t);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (pinnedRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

        if (visible.length > 0) {
          setActiveId(visible[0].id);
          return;
        }

        const scrollY = window.scrollY;
        let candidate: HTMLElement | undefined;
        for (const heading of titles) {
          const top = heading.getBoundingClientRect().top + window.scrollY;
          if (top - 120 <= scrollY) {
            candidate = heading;
          } else {
            break;
          }
        }
        if (candidate) {
          setActiveId(candidate.id);
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: [0, 1],
      },
    );

    for (const t of titles) {
      observer.observe(t);
    }

    return () => observer.disconnect();
  }, []);

  const releasePin = () => {
    pinnedRef.current = false;
    if (pinFrameRef.current !== null) {
      cancelAnimationFrame(pinFrameRef.current);
      pinFrameRef.current = null;
    }
    if (pinFallbackRef.current !== null) {
      clearTimeout(pinFallbackRef.current);
      pinFallbackRef.current = null;
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
      const target = document.getElementById(slug);
      if (!target) return;

      event.preventDefault();
      releasePin();
      pinnedRef.current = true;
      setActiveId(slug);

      target.scrollIntoView();
      history.replaceState(null, "", `#${slug}`);

      pinFallbackRef.current = window.setTimeout(() => {
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
