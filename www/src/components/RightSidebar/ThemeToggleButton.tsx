/** @jsxImportSource preact */
import type { FunctionalComponent } from "preact";
import "./ThemeToggleButton.css";

const SunIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const ThemeToggle: FunctionalComponent = () => {
  const handleClick = () => {
    const root = document.documentElement;
    let isDark: boolean;
    if (root.classList.contains("theme-dark")) {
      isDark = true;
    } else if (root.classList.contains("theme-light")) {
      isDark = false;
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    const next = isDark ? "light" : "dark";
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${next}`);
    localStorage.setItem("theme", next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", next === "dark" ? "#09090b" : "#ffffff");
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={handleClick}
    >
      <span className="theme-toggle-icon theme-toggle-icon-light">
        {MoonIcon}
      </span>
      <span className="theme-toggle-icon theme-toggle-icon-dark">
        {SunIcon}
      </span>
    </button>
  );
};

export default ThemeToggle;
