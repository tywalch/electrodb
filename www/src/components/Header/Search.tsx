/** @jsxImportSource react */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
} from "react";
import { createPortal } from "react-dom";
import "./Search.css";

type PagefindSubResult = {
  url: string;
  title: string;
  excerpt: string;
};

type PagefindData = {
  url: string;
  raw_url?: string;
  meta: { title?: string };
  excerpt: string;
  sub_results?: PagefindSubResult[];
};

type PagefindResult = {
  id: string;
  data: () => Promise<PagefindData>;
};

type PagefindApi = {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
};

type LoadState = "idle" | "loading" | "ready" | "unavailable";

type Hit = {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  sub: PagefindSubResult[];
};

const Search: FunctionComponent = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pagefindRef = useRef<PagefindApi | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  const navigate = useCallback((url: string) => {
    const softNav = (window as unknown as { __softNav?: (h: string) => void })
      .__softNav;
    if (typeof softNav === "function") {
      softNav(url);
    } else {
      window.location.assign(url);
    }
  }, []);

  const loadPagefind = useCallback(async () => {
    if (pagefindRef.current || loadState === "loading") {
      return;
    }
    setLoadState("loading");
    try {
      // Pagefind is generated at build time and lives at /pagefind/pagefind.js.
      // We bypass static analysis with new Function so Vite/Rollup don't try to resolve it at build time.
      const dynamicImport = new Function(
        "return import('/pagefind/pagefind.js')",
      ) as () => Promise<PagefindApi>;
      const mod = await dynamicImport();
      pagefindRef.current = mod;
      setLoadState("ready");
    } catch {
      setLoadState("unavailable");
    }
  }, [loadState]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHits([]);
    setActive(0);
  }, []);

  const openModal = useCallback(() => {
    setOpen(true);
    loadPagefind();
  }, [loadPagefind]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isInputField =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement | null)?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          closeModal();
        } else {
          openModal();
        }
        return;
      }

      if (!open && event.key === "/" && !isInputField) {
        event.preventDefault();
        openModal();
        return;
      }

      if (open && event.key === "Escape") {
        event.preventDefault();
        closeModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openModal, closeModal]);

  useEffect(() => {
    const onOpen = () => openModal();
    window.addEventListener("search:open", onOpen);
    return () => window.removeEventListener("search:open", onOpen);
  }, [openModal]);

  useEffect(() => {
    if (open) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const modal = modalRef.current;
    if (!modal) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'input, button, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };
    modal.addEventListener("keydown", onKey);
    return () => modal.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    if (!query.trim()) {
      setHits([]);
      setActive(0);
      return;
    }
    if (loadState !== "ready" || !pagefindRef.current) {
      return;
    }

    const api = pagefindRef.current;
    debounceRef.current = window.setTimeout(async () => {
      const response = await api.search(query);
      const top = response.results.slice(0, 8);
      const resolved = await Promise.all(
        top.map(async (result) => {
          const data = await result.data();
          return {
            id: result.id,
            url: data.url,
            title: data.meta?.title ?? data.url,
            excerpt: data.excerpt,
            sub: data.sub_results?.slice(0, 3) ?? [],
          } as Hit;
        }),
      );
      setHits(resolved);
      setActive(0);
    }, 120);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query, open, loadState]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const body = document.body;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + scrollbarWidth}px`;
    }
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  const flatHits = useMemo(() => {
    const flat: Array<{
      key: string;
      url: string;
      title: string;
      excerpt: string;
      parentTitle?: string;
    }> = [];
    let counter = 0;
    for (const hit of hits) {
      if (hit.sub.length > 0) {
        for (const sub of hit.sub) {
          flat.push({
            key: `${counter++}-${hit.id}-${sub.url}`,
            url: sub.url,
            title: sub.title,
            excerpt: sub.excerpt,
            parentTitle: hit.title,
          });
        }
      } else {
        flat.push({
          key: `${counter++}-${hit.id}`,
          url: hit.url,
          title: hit.title,
          excerpt: hit.excerpt,
        });
      }
    }
    return flat;
  }, [hits]);

  const onInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) =>
        Math.min(index + 1, Math.max(flatHits.length - 1, 0)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const target = flatHits[active];
      if (target) {
        event.preventDefault();
        closeModal();
        navigate(target.url);
      }
    }
  };

  const onResultClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    url: string,
  ) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    closeModal();
    navigate(url);
  };

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        aria-label="Search docs"
        onClick={openModal}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span>Search docs</span>
        <kbd className="kbd-mac" aria-label="Command K">⌘K</kbd>
        <kbd className="kbd-pc" aria-label="Control K">Ctrl K</kbd>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Search documentation"
          onClick={closeModal}
        >
          <div
            ref={modalRef}
            className="search-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="search-input-wrap">
              <svg
                className="search-input-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                placeholder="Search docs..."
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={onInputKey}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="search-close"
                onClick={closeModal}
                aria-label="Close search"
              >
                Esc
              </button>
            </div>

            <div className="search-body">
              {loadState === "unavailable" && (
                <div className="search-empty">
                  <p className="search-empty-title">
                    Search index not built yet
                  </p>
                  <p className="search-empty-hint">
                    Run <code>npm run build</code> to generate the static search
                    index, then reload.
                  </p>
                </div>
              )}

              {loadState === "loading" && (
                <div className="search-empty">
                  <p className="search-empty-hint">Loading search index…</p>
                </div>
              )}

              {loadState === "ready" && query.trim() === "" && (
                <div className="search-empty">
                  <p className="search-empty-hint">
                    Start typing to search every page of the docs.
                  </p>
                </div>
              )}

              {loadState === "ready" &&
                query.trim() !== "" &&
                flatHits.length === 0 && (
                  <div className="search-empty">
                    <p className="search-empty-hint">
                      No results for <strong>"{query}"</strong>.
                    </p>
                  </div>
                )}

              {flatHits.length > 0 && (
                <ul className="search-results">
                  {flatHits.map((hit, index) => (
                    <li key={hit.key}>
                      <a
                        href={hit.url}
                        className={`search-result${index === active ? " is-active" : ""}`}
                        onMouseEnter={() => setActive(index)}
                        onClick={(event) => onResultClick(event, hit.url)}
                      >
                        <div className="search-result-title">
                          {hit.parentTitle && (
                            <span className="search-result-parent">
                              {hit.parentTitle}
                              <span aria-hidden="true"> › </span>
                            </span>
                          )}
                          {hit.title}
                        </div>
                        <div
                          className="search-result-excerpt"
                          dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="search-footer">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd>
                navigate
              </span>
              <span>
                <kbd>↵</kbd>
                open
              </span>
              <span>
                <kbd>esc</kbd>
                close
              </span>
              <span className="search-footer-spacer" />
              <span className="search-footer-brand">
                Search by
                <a
                  href="https://pagefind.app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pagefind
                </a>
              </span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default Search;
