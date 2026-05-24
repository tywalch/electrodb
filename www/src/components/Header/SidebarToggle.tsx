/** @jsxImportSource preact */
import type { FunctionalComponent } from "preact";
import { useState, useEffect } from "preact/hooks";

const MenuToggle: FunctionalComponent = () => {
  const [sidebarShown, setSidebarShown] = useState(false);

  useEffect(() => {
    const close = () => setSidebarShown(false);
    window.addEventListener("softnav:done", close);
    return () => window.removeEventListener("softnav:done", close);
  }, []);

  useEffect(() => {
    const body = document.querySelector("body")!;
    if (sidebarShown) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      const previousOverflow = body.style.overflow;
      const previousPaddingRight = body.style.paddingRight;
      body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
        body.style.paddingRight = `${current + scrollbarWidth}px`;
      }
      body.classList.add("mobile-sidebar-toggle");
      return () => {
        body.style.overflow = previousOverflow;
        body.style.paddingRight = previousPaddingRight;
        body.classList.remove("mobile-sidebar-toggle");
      };
    }
  }, [sidebarShown]);

  return (
    <button
      type="button"
      aria-pressed={sidebarShown ? "true" : "false"}
      id="menu-toggle"
      onClick={() => setSidebarShown(!sidebarShown)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
      <span className="sr-only">Toggle sidebar</span>
    </button>
  );
};

export default MenuToggle;
