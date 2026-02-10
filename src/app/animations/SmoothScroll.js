"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export default function SmoothScroll() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Prevent "starts on portfolio" caused by scroll restoration (browser + ScrollTrigger).
    try {
      window.history.scrollRestoration = "manual";
    } catch {}
    ScrollTrigger.clearScrollMemory("manual");
    window.scrollTo(0, 0);

    // Create (or recreate) the singleton smoother
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.6,
      smoothTouch: 0.2,
      effects: false,
    });

    // Ensure we're truly at the top after smoother attaches
    smoother.scrollTop(0);
    ScrollTrigger.refresh();

    return () => {
      smoother?.kill();
    };
  }, []);

  return null;
}

