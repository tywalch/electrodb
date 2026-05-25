/** @jsxImportSource preact */
import type { FunctionalComponent } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import "./PackageInstall.css";

type Manager = "npm" | "yarn" | "pnpm" | "bun";

const MANAGERS: { id: Manager; label: string }[] = [
  { id: "npm", label: "npm" },
  { id: "pnpm", label: "pnpm" },
  { id: "bun", label: "bun" },
  { id: "yarn", label: "yarn" },
];

const STORAGE_KEY = "preferred-pkg-manager";
const EVENT_NAME = "pkg-manager-change";

const commandFor = (manager: Manager, packages: string, dev: boolean) => {
  const list = packages.trim();
  switch (manager) {
    case "npm":
      return `npm install ${dev ? "--save-dev " : ""}${list}`;
    case "pnpm":
      return `pnpm add ${dev ? "-D " : ""}${list}`;
    case "yarn":
      return `yarn add ${dev ? "--dev " : ""}${list}`;
    case "bun":
      return `bun add ${dev ? "-d " : ""}${list}`;
  }
};

const readStored = (): Manager => {
  if (typeof window === "undefined") return "npm";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Manager | null;
  if (stored && MANAGERS.some((m) => m.id === stored)) return stored;
  return "npm";
};

type Props = {
  packages: string;
  dev?: boolean;
};

const PackageInstall: FunctionalComponent<Props> = ({
  packages,
  dev = false,
}) => {
  const [manager, setManager] = useState<Manager>("npm");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setManager(readStored());
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<Manager>).detail;
      if (detail) setManager(detail);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setManager(event.newValue as Manager);
      }
    };
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const select = (id: Manager) => {
    setManager(id);
    window.localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: id }));
  };

  const command = useMemo(
    () => commandFor(manager, packages, dev),
    [manager, packages, dev],
  );

  const flashCopied = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const legacyCopy = (text: string): boolean => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  };

  const onCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(command).then(flashCopied, () => {
        if (legacyCopy(command)) flashCopied();
      });
      return;
    }
    if (legacyCopy(command)) flashCopied();
  };

  return (
    <div class="pkg-install" data-manager={manager}>
      <div class="pkg-install-tabs" role="tablist">
        {MANAGERS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={m.id === manager}
            class={`pkg-install-tab${m.id === manager ? " is-active" : ""}`}
            onClick={() => select(m.id)}
          >
            {m.label}
          </button>
        ))}
        <button
          type="button"
          class="pkg-install-copy"
          aria-label="Copy command"
          onClick={onCopy}
        >
          {copied ? (
            <>
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>Copied</span>
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre class="pkg-install-code">
        <code class="pkg-install-line">{command}</code>
      </pre>
    </div>
  );
};

export default PackageInstall;
