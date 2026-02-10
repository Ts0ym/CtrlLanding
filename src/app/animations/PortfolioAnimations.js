"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PortfolioAnimations() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
          start: "top 70%",
          end: "top 45%",
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

