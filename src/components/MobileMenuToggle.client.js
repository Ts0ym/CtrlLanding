"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "../app/layout.module.scss";

export default function MobileMenuToggle() {
  const [open, setOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const closeTimeoutRef = useRef(null);

  /*
   * useLayoutEffect (not useEffect) so the state is committed
   * BEFORE the browser paints – no flash between states.
   */
  useLayoutEffect(() => {
    const body = document.body;

    if (open) {
      /* ---- OPENING ---- */
      body.setAttribute("data-header-state", "menu-open");
      body.classList.remove("menu-closing");
      return;
    }

    /* ---- CLOSING / INITIAL ---- */
    body.classList.remove("menu-closing");

    /*
     * Restore the correct scroll-based state.
     * `force: true` bypasses the "menu-open" guard inside syncHeaderState,
     * because the attribute is still "menu-open" at this point.
     */
    if (typeof window.__syncHeaderState === "function") {
      window.__syncHeaderState({ forceHeroIfNearTop: true, force: true });
    } else {
      body.setAttribute("data-header-state", "hero");
    }
  }, [open]);

  const handleClick = () => {
    if (isTransitioning) return;

    if (open) {
      /* Start close animation */
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      setIsTransitioning(true);
      document.body.classList.add("menu-closing");

      closeTimeoutRef.current = setTimeout(() => {
        closeTimeoutRef.current = null;
        /* Both state updates are batched; useLayoutEffect will fire
           synchronously after commit (before paint) to set the correct state. */
        setOpen(false);
        setIsTransitioning(false);
      }, 300);
    } else {
      /* Open */
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setOpen(true);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={handleClick}
      aria-busy={isTransitioning}
      style={{ pointerEvents: isTransitioning ? "none" : undefined }}
    >
      <span className={styles.burgerLine} />
      <span className={styles.burgerLine} />
      <span className={styles.burgerLine} />
      <span className={styles.burgerLine} />
    </button>
  );
}
