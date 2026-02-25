"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PortfolioAnimations() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Lower % = trigger later (headline appears when it is higher in the viewport).
    const HEADLINE_FADE_START = "top 60%";
    const HEADLINE_FADE_END = "top 35%";

    const els = gsap.utils.toArray(
      '[data-anim="portfolio-headline"], [data-anim="contacts-headline"]',
    );
    if (!els.length) return;

    const tweens = els.map((el) => {
      gsap.set(el, { autoAlpha: 0 });

      return gsap.to(el, {
        autoAlpha: 1,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: HEADLINE_FADE_START,
          end: HEADLINE_FADE_END,
          scrub: true,
        },
      });
    });

    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
    };
  }, []);

  return null;
}
