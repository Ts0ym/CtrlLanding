"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import pageStyles from "../app/page.module.scss";
import styles from "./PortfolioSection.module.scss";
import PortfolioCard from "./PortfolioCard";
import PortfolioViewerOverlay from "./PortfolioViewerOverlay.client";

gsap.registerPlugin(ScrollSmoother);

const PORTFOLIO_VIEWER_HISTORY_KEY = "__portfolioViewer";

export default function PortfolioSection({ cards }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const prevBodyOverflow = useRef("");
  const documentLockedRef = useRef(false);
  const prevBodyPosition = useRef("");
  const prevBodyTop = useRef("");
  const prevBodyLeft = useRef("");
  const prevBodyRight = useRef("");
  const prevBodyWidth = useRef("");
  const prevHtmlOverflow = useRef("");
  const scrollLockY = useRef(0);
  const activeIndexRef = useRef(null);

  const safeCards = useMemo(() => cards ?? [], [cards]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const lockDocumentScroll = () => {
    if (typeof window === "undefined" || documentLockedRef.current) return;

    const isTelegramWebview =
      document.documentElement.getAttribute("data-webview") === "telegram" ||
      document.body.getAttribute("data-webview") === "telegram";
    const shouldLockDocumentScroll =
      isTelegramWebview &&
      (window.matchMedia("(max-width: 1200px)").matches ||
        document.body.getAttribute("data-scroll-mode") === "native");

    if (!shouldLockDocumentScroll) return;

    documentLockedRef.current = true;
    scrollLockY.current = window.scrollY;
    prevBodyPosition.current = document.body.style.position;
    prevBodyTop.current = document.body.style.top;
    prevBodyLeft.current = document.body.style.left;
    prevBodyRight.current = document.body.style.right;
    prevBodyWidth.current = document.body.style.width;
    prevHtmlOverflow.current = document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollLockY.current}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  };

  const unlockDocumentScroll = () => {
    if (typeof window === "undefined" || !documentLockedRef.current) return;

    documentLockedRef.current = false;
    document.documentElement.style.overflow = prevHtmlOverflow.current || "";
    document.body.style.position = prevBodyPosition.current || "";
    document.body.style.top = prevBodyTop.current || "";
    document.body.style.left = prevBodyLeft.current || "";
    document.body.style.right = prevBodyRight.current || "";
    document.body.style.width = prevBodyWidth.current || "";
    window.scrollTo(0, scrollLockY.current);
  };

  useEffect(() => {
    const closeOverlay = () => setActiveIndex(null);
    const onLockScroll = () => lockDocumentScroll();
    const onUnlockScroll = () => unlockDocumentScroll();
    const onPopState = (event) => {
      const viewerState = event.state?.[PORTFOLIO_VIEWER_HISTORY_KEY];

      if (viewerState?.open) {
        const nextIndex = Number.isInteger(viewerState.index)
          ? Math.max(0, Math.min(safeCards.length - 1, viewerState.index))
          : 0;
        setActiveIndex(nextIndex);
        return;
      }

      if (activeIndexRef.current !== null) {
        window.dispatchEvent(
          new CustomEvent("portfolio-viewer:request-close", {
            detail: { fromHistory: true },
          }),
        );
      }
    };

    window.addEventListener("portfolio-viewer:close", closeOverlay);
    window.addEventListener("portfolio-viewer:lock-scroll", onLockScroll);
    window.addEventListener("portfolio-viewer:unlock-scroll", onUnlockScroll);
    window.addEventListener("popstate", onPopState);

    // Safety reset on mount/reload restore.
    document.body.removeAttribute("data-portfolio-viewer");
    document.documentElement.removeAttribute("data-portfolio-viewer");
    document.body.removeAttribute("data-portfolio-viewer-stage");
    document.documentElement.removeAttribute("data-portfolio-viewer-stage");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    return () => {
      window.removeEventListener("portfolio-viewer:close", closeOverlay);
      window.removeEventListener("portfolio-viewer:lock-scroll", onLockScroll);
      window.removeEventListener("portfolio-viewer:unlock-scroll", onUnlockScroll);
      window.removeEventListener("popstate", onPopState);
    };
  }, [safeCards.length]);

  useEffect(() => {
    const isOpen = activeIndex !== null;
    const smoother = ScrollSmoother.get();

    if (smoother) smoother.paused(isOpen);

    if (isOpen) {
      document.body.setAttribute("data-portfolio-viewer", "open");
      document.documentElement.setAttribute("data-portfolio-viewer", "open");
      document.body.setAttribute("data-portfolio-viewer-stage", "opening");
      document.documentElement.setAttribute(
        "data-portfolio-viewer-stage",
        "opening",
      );
      prevBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const historyState = window.history.state ?? {};
      const viewerState = historyState[PORTFOLIO_VIEWER_HISTORY_KEY];
      if (!viewerState?.open) {
        window.history.pushState(
          {
            ...historyState,
            [PORTFOLIO_VIEWER_HISTORY_KEY]: {
              open: true,
              index: activeIndex,
            },
          },
          "",
          window.location.href,
        );
      }

      // Force header into expanded state
      document.documentElement.style.setProperty("--header-shift", "2.4rem");
      document.body.setAttribute("data-header-state", "expanded");
    } else {
      document.body.removeAttribute("data-portfolio-viewer");
      document.documentElement.removeAttribute("data-portfolio-viewer");
      document.body.removeAttribute("data-portfolio-viewer-stage");
      document.documentElement.removeAttribute("data-portfolio-viewer-stage");
      document.body.style.overflow = prevBodyOverflow.current || "";
      unlockDocumentScroll();
      // Don't restore --header-shift manually — GSAP ScrollTrigger
      // will set the correct value on the next scrub after smoother resumes.
    }

    return () => {
      if (smoother) smoother.paused(false);
      document.body.removeAttribute("data-portfolio-viewer");
      document.documentElement.removeAttribute("data-portfolio-viewer");
      document.body.removeAttribute("data-portfolio-viewer-stage");
      document.documentElement.removeAttribute("data-portfolio-viewer-stage");
      document.body.style.overflow = prevBodyOverflow.current || "";
      unlockDocumentScroll();
    };
  }, [activeIndex]);

  return (
    <>
      <section id="work" className={styles.portfolio}>
        <div
          className={`${styles.portfolioHeadline} ${pageStyles.sectionHeadline}`}
          data-anim="portfolio-headline"
        >
          <p>Портфолио</p>
          <p>Our Works</p>
          <p className={pageStyles.sectionHeadlineCn}>作品集</p>
        </div>

        <div className={styles.portfolioGrid} aria-label="Portfolio cards">
          {safeCards.map((c, idx) => (
            <PortfolioCard
              key={c.id ?? idx}
              card={c}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </div>
      </section>

      {activeIndex !== null && (
        <PortfolioViewerOverlay
          cards={safeCards}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  );
}
