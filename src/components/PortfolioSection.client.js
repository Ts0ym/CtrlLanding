"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import pageStyles from "../app/page.module.scss";
import styles from "./PortfolioSection.module.scss";
import PortfolioCard from "./PortfolioCard";
import PortfolioViewerOverlay from "./PortfolioViewerOverlay.client";

gsap.registerPlugin(ScrollSmoother);

export default function PortfolioSection({ cards }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const prevBodyOverflow = useRef("");

  const safeCards = useMemo(() => cards ?? [], [cards]);

  useEffect(() => {
    const closeOverlay = () => setActiveIndex(null);
    window.addEventListener("portfolio-viewer:close", closeOverlay);

    // Safety reset on mount/reload restore.
    document.body.removeAttribute("data-portfolio-viewer");
    document.body.style.overflow = "";

    return () => window.removeEventListener("portfolio-viewer:close", closeOverlay);
  }, []);

  useEffect(() => {
    const isOpen = activeIndex !== null;
    const smoother = ScrollSmoother.get();

    if (smoother) smoother.paused(isOpen);

    if (isOpen) {
      document.body.setAttribute("data-portfolio-viewer", "open");
      prevBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Force header into expanded state
      document.documentElement.style.setProperty("--header-shift", "2.4rem");
      document.body.setAttribute("data-header-state", "expanded");
    } else {
      document.body.removeAttribute("data-portfolio-viewer");
      document.body.style.overflow = prevBodyOverflow.current || "";
      // Don't restore --header-shift manually — GSAP ScrollTrigger
      // will set the correct value on the next scrub after smoother resumes.
    }

    return () => {
      if (smoother) smoother.paused(false);
      document.body.removeAttribute("data-portfolio-viewer");
      document.body.style.overflow = prevBodyOverflow.current || "";
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

