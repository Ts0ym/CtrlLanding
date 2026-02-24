"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger);

/* Timeline position where --header-shift starts animating (logo should appear) */
const HEADER_SHIFT_START = 1;

export default function ScrollTransitions() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
    const useInstantScrub = Boolean(ScrollTrigger.isTouch || isMobileViewport);
    const useMobilePerfMode = useInstantScrub;

    let tl;
    let tickerFn;

    const aboutEarly = document.querySelector('[data-scroll="about"]');
    if (aboutEarly) {
      gsap.set(aboutEarly, { autoAlpha: 0, pointerEvents: "none" });
    }

    document.body.setAttribute("data-header-state", "hero");

    /**
     * Sync `data-header-state` with the scrubbed timeline position.
     * Called every frame via gsap.ticker AND on-demand when the menu closes.
     *
     * opts.force          – bypass the "menu-open" guard (used when closing menu)
     * opts.forceHeroIfNearTop – safety net: if scroll is near 0, force "hero"
     */
    function syncHeaderState(opts) {
      const body = document.body;

      /* Don't override while menu is open (unless forced by menu-close) */
      if (
        body.getAttribute("data-header-state") === "menu-open" &&
        !(opts && opts.force)
      ) {
        return;
      }

      /* Keep header expanded while portfolio viewer is open */
      if (body.hasAttribute("data-portfolio-viewer")) {
        body.setAttribute("data-header-state", "expanded");
        return;
      }

      /* Safety net for menu-close at the very top of the page */
      if (opts && opts.forceHeroIfNearTop) {
        const smoother = ScrollSmoother.get?.();
        const scrollTop = smoother?.scrollTop?.() ?? window.scrollY ?? 0;
        if (scrollTop < 80) {
          body.setAttribute("data-header-state", "hero");
          return;
        }
      }

      /* Read the SCRUBBED timeline time so the state matches the visual
         header expansion driven by --header-shift (no instant/lagged mismatch) */
      const time = tl ? tl.time() : 0;
      body.setAttribute(
        "data-header-state",
        time >= HEADER_SHIFT_START ? "expanded" : "hero"
      );
    }

    const init = () => {
      const stage = document.querySelector('[data-scroll="stage"]');
      const aboutSection = document.querySelector('[data-scroll="about"]');
      if (!stage || !aboutSection) return;

      const root = document.documentElement;

      const heroOutEls = gsap.utils.toArray('[data-scroll="hero-out"]');
      const aboutInEls = gsap.utils.toArray('[data-scroll="about-in"]');
      const heroLogoEls = heroOutEls.filter((el) => el?.dataset?.anim === "logo");
      const heroTextEls = heroOutEls.filter((el) => el?.dataset?.anim !== "logo");

      gsap.set(heroOutEls, {
        yPercent: 0,
        opacity: 1,
        force3D: useMobilePerfMode,
      });
      gsap.set(aboutInEls, {
        yPercent: 120,
        opacity: useMobilePerfMode ? 1 : 0,
        force3D: useMobilePerfMode,
      });
      gsap.set(aboutSection, { autoAlpha: 0, pointerEvents: "none" });
      gsap.set(root, {
        "--header-shift": "0rem",
        "--burger-top": "calc(var(--pad) + 1em)",
      });

      tl = gsap.timeline({
        scrollTrigger: {
          id: "stage-transition",
          trigger: stage,
          start: "top top",
          end: useMobilePerfMode ? "+=160%" : "+=200%",
          // On mobile/touch, scrub smoothing looks like "self-scrolling" when re-entering the pinned stage.
          scrub: useInstantScrub ? true : 1,
          pin: true,
          anticipatePin: useInstantScrub ? 0 : 1,
          invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
      });

      if (useMobilePerfMode) {
        tl.to(
          heroTextEls,
          { yPercent: 120, stagger: 0, duration: 1, force3D: true },
          0
        );

        if (heroLogoEls.length) {
          tl.to(
            heroLogoEls,
            { yPercent: 40, opacity: 0, duration: 0.9, force3D: true },
            0.05
          );
        }

        tl.set(aboutSection, { autoAlpha: 1, pointerEvents: "auto" }, 1).to(
          aboutInEls,
          { yPercent: 0, opacity: 1, stagger: 0, duration: 0.9, force3D: true },
          1
        );

        // Avoid layout-heavy header variable tweening during touch scrub.
        tl.set(
          root,
          {
            "--header-shift": "2.4rem",
            "--burger-top": "var(--pad)",
          },
          1
        );
      } else {
        tl.to(
          heroOutEls,
          { yPercent: 120, opacity: 0, stagger: 0.05, duration: 1 },
          0
        )
          .set(aboutSection, { autoAlpha: 1, pointerEvents: "auto" }, 1)
          .to(
            aboutInEls,
            { yPercent: 0, opacity: 1, stagger: 0.1, duration: 1 },
            1
          );

        tl.to(
          root,
          {
            "--header-shift": "2.4rem",
            "--burger-top": "var(--pad)",
            duration: 0.4,
          },
          1
        );
      }

      /* Sync header state every frame using the scrubbed tl.time() */
      tickerFn = () => syncHeaderState();
      gsap.ticker.add(tickerFn);

      window.__syncHeaderState = syncHeaderState;
      syncHeaderState();
      ScrollTrigger.refresh();
    };

    const onDone = () => init();
    window.addEventListener("intro:done", onDone, { once: true });
    if (window.__introDone) init();

    return () => {
      delete window.__syncHeaderState;
      if (tickerFn) gsap.ticker.remove(tickerFn);
      tl?.scrollTrigger?.kill();
      tl?.kill();
    };
  }, []);

  return null;
}

