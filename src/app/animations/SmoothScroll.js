"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const MOBILE_BREAKPOINT = "(max-width: 768px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export default function SmoothScroll() {
  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia(REDUCED_MOTION).matches;

    // При «Уменьшить движение» используем обычный скролл (как на мобильном).
    if (prefersReducedMotion) {
      document.body.setAttribute("data-scroll-mode", "native");
      try {
        window.history.scrollRestoration = "manual";
      } catch {}
      ScrollTrigger.clearScrollMemory("manual");
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
      return () => {
        document.body.removeAttribute("data-scroll-mode");
      };
    }

    // Prevent "starts on portfolio" caused by scroll restoration (browser + ScrollTrigger).
    try {
      window.history.scrollRestoration = "manual";
    } catch {}
    ScrollTrigger.clearScrollMemory("manual");
    window.scrollTo(0, 0);

    const isMobile = window.matchMedia(MOBILE_BREAKPOINT).matches;
    let smoother = null;

    if (!isMobile) {
      smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.6,
        smoothTouch: 0,
        effects: false,
      });
      smoother.scrollTop(0);
    }

    ScrollTrigger.refresh();

    return () => {
      smoother?.kill();
    };
  }, []);

  return null;
}

