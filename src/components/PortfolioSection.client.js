"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import styles from "../app/page.module.scss";
import PortfolioCard from "./PortfolioCard";
import PortfolioViewerOverlay from "./PortfolioViewerOverlay.client";

gsap.registerPlugin(ScrollSmoother);

export default function PortfolioSection({ cards }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const prevBodyOverflow = useRef("");

  const safeCards = useMemo(() => cards ?? [], [cards]);

  useEffect(() => {
    const isOpen = activeIndex !== null;
    const smoother = ScrollSmoother.get();

    if (smoother) smoother.paused(isOpen);

    if (isOpen) {
      document.body.setAttribute("data-portfolio-viewer", "open");
      prevBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.removeAttribute("data-portfolio-viewer");
      document.body.style.overflow = prevBodyOverflow.current || "";
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
          className={`${styles.portfolioHeadline} ${styles.sectionHeadline}`}
          data-anim="portfolio-headline"
        >
          <p>Портфолио</p>
          <p>Our Works</p>
          <p className={styles.sectionHeadlineCn}>作品集</p>
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

