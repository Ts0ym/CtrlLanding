"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";

const TIME_SCALE = 1; 

export default function IntroAnimation() {
  const prevOverflowRef = useRef("");
  const prevHtmlOverflowRef = useRef("");
  const preventRef = useRef(null);

  useLayoutEffect(() => {
    prevOverflowRef.current = document.body.style.overflow;
    prevHtmlOverflowRef.current = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const prevent = (e) => e.preventDefault();
    preventRef.current = prevent;
    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });

    const smoother = ScrollSmoother.get?.();
    if (smoother) smoother.paused(true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.body.removeAttribute("data-intro-active");
      document.body.style.overflow = prevOverflowRef.current || "";
      document.documentElement.style.overflow = prevHtmlOverflowRef.current || "";
      window.removeEventListener("wheel", preventRef.current);
      window.removeEventListener("touchmove", preventRef.current);
      if (smoother) smoother.paused(false);
      return;
    }

    let tl;

    const start = () => {
      const logo = document.querySelector('[data-anim="logo"]');
      const frameLines = gsap.utils.toArray('[data-anim="line"]');
      const heroLines = gsap.utils.toArray('[data-anim="hero-headline-line"]');
      const menuTitle = document.querySelector('[data-anim="menu-title"]');
      const menuList = document.querySelector('[data-anim="menu-list"]');
      const arrow = document.querySelector('[data-anim="arrow"]');

      gsap.set(logo, { yPercent: 100, opacity: 0 });
      gsap.set(frameLines, { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(heroLines, { yPercent: 100, opacity: 0 });
      gsap.set([menuTitle, menuList], { yPercent: 100, opacity: 0 });
      gsap.set(arrow, { y: -12, opacity: 0 });

      tl = gsap.timeline();
      tl.timeScale(TIME_SCALE);

      tl.to(logo, {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        ease: "power1.inOut",
      })
        .to(frameLines, { scaleX: 1, duration: 1.2, ease: "power1.inOut" }, ">-0.1")
        .to(
          heroLines,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power1.inOut",
          },
          ">-0.05"
        )
        .to(
          menuTitle,
          { yPercent: 0, opacity: 1, duration: 0.55, ease: "power1.inOut" },
          ">-0.05"
        )
        .to(
          menuList,
          { yPercent: 0, opacity: 1, duration: 0.55, ease: "power1.inOut" },
          "<"
        )
        .to(
          arrow,
          { y: 0, opacity: 1, duration: 0.4, ease: "power1.inOut" },
          ">-0.05"
        );

      tl.eventCallback("onComplete", () => {
        window.__introDone = true;
        document.body.removeAttribute("data-intro-active");
        document.body.style.overflow = prevOverflowRef.current || "";
        document.documentElement.style.overflow = prevHtmlOverflowRef.current || "";
        window.removeEventListener("wheel", preventRef.current);
        window.removeEventListener("touchmove", preventRef.current);
        if (smoother) smoother.paused(false);
        window.dispatchEvent(new Event("intro:done"));
      });
    };

    document.body.setAttribute("data-intro-active", "true");
    (document.fonts?.ready ?? Promise.resolve()).then(start);
    return () => {
      tl?.kill();
      document.body.style.overflow = prevOverflowRef.current || "";
      document.documentElement.style.overflow = prevHtmlOverflowRef.current || "";
      window.removeEventListener("wheel", preventRef.current);
      window.removeEventListener("touchmove", preventRef.current);
      if (smoother) smoother.paused(false);
    };
  }, []);

  return null;
}

