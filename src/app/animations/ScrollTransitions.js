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
    const userAgent = window.navigator.userAgent;
    const isMobileSafari =
      isMobileViewport &&
      /Safari/i.test(userAgent) &&
      !/(CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Android|Telegram|Instagram|FBAN|FBAV)/i.test(
        userAgent,
      );
    const useInstantScrub = Boolean(ScrollTrigger.isTouch || isMobileViewport);
    const useMobilePerfMode = useInstantScrub;
    const useTextForce3D = useMobilePerfMode && !isMobileSafari;
    const useSafariStageFallback = isMobileSafari;
    const getElementShift = (multiplier) => (_, el) =>
      Math.max(1, el?.offsetHeight || el?.getBoundingClientRect?.().height || 1) *
      multiplier;
    const enableScrollSnap = !useMobilePerfMode;
    const STAGE_SCROLL_END_DESKTOP = "+=130%";
    const STAGE_SCROLL_END_MOBILE = "+=110%";
    const STAGE_SCROLL_END_SAFARI = "+=180%";
    const STAGE_SCRUB_DESKTOP = 1;
    const stageSnap = {
      snapTo: (value) => {
        const now = window.performance?.now?.() ?? Date.now();
        const suppressedUntil = window.__suppressStageSnapUntil ?? 0;

        if (now < suppressedUntil) return value;
        return value < 0.5 ? 0 : 1;
      },
      delay: 0.05,
      duration: useMobilePerfMode ? { min: 0.14, max: 0.22 } : { min: 0.18, max: 0.3 },
      ease: "power1.out",
      inertia: false,
    };

    let tl;
    let tickerFn;
    let sectionSnapTrigger;
    let blockJumpTween;
    let blockJumpTriggers = [];
    let sectionSnapPoints = [];

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
      const playSafariStage = (self) => {
        const animation = self?.animation;
        if (!animation) return;

        animation.play();
      };
      const reverseSafariStage = (self) => {
        const animation = self?.animation;
        if (!animation) return;

        animation.reverse();
      };
      const syncSafariStage = (self) => {
        const animation = self?.animation;
        if (!animation || !self?.isActive || animation.isActive()) return;

        if (self.direction > 0 && animation.progress() <= 0.001) {
          animation.play(0);
        } else if (self.direction < 0 && animation.progress() >= 0.999) {
          animation.reverse();
        }
      };

      if (isMobileSafari) {
        gsap.set(heroOutEls, {
          y: 0,
          yPercent: 0,
          opacity: 1,
          force3D: false,
          willChange: "transform",
        });
        gsap.set(aboutInEls, {
          y: getElementShift(1.2),
          yPercent: 0,
          opacity: 1,
          force3D: false,
          willChange: "transform",
        });
      } else {
        gsap.set(heroOutEls, {
          yPercent: 0,
          opacity: 1,
          force3D: useTextForce3D,
        });
        gsap.set(aboutInEls, {
          yPercent: 120,
          opacity: useMobilePerfMode ? 1 : 0,
          force3D: useTextForce3D,
        });
      }
      gsap.set(aboutSection, { autoAlpha: 0, pointerEvents: "none" });
      gsap.set(root, {
        "--header-shift": "0rem",
        "--burger-top": "calc(var(--pad) + 1em)",
      });

      tl = gsap.timeline({
        scrollTrigger: {
          id: "stage-transition",
          trigger: stage,
          start: useSafariStageFallback ? "top+=1 top" : "top top",
          // Shorter range = stronger scroll influence (less wheel/touch distance to finish Hero -> About).
          end: useSafariStageFallback
            ? STAGE_SCROLL_END_SAFARI
            : useMobilePerfMode
              ? STAGE_SCROLL_END_MOBILE
              : STAGE_SCROLL_END_DESKTOP,
          // Add extra inertia only for the Hero -> About transition.
          scrub: useSafariStageFallback
            ? false
            : useInstantScrub
              ? true
              : STAGE_SCRUB_DESKTOP,
          snap: enableScrollSnap ? stageSnap : false,
          toggleActions: useSafariStageFallback
            ? "none none none none"
            : undefined,
          onEnter: useSafariStageFallback ? playSafariStage : undefined,
          onUpdate: useSafariStageFallback ? syncSafariStage : undefined,
          onLeave: useSafariStageFallback ? playSafariStage : undefined,
          onEnterBack: useSafariStageFallback ? reverseSafariStage : undefined,
          onLeaveBack: useSafariStageFallback ? reverseSafariStage : undefined,
          pin: true,
          anticipatePin: useInstantScrub ? 0 : 1,
          invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
      });

      if (useMobilePerfMode) {
        tl.to(
          heroTextEls,
          isMobileSafari
            ? { y: getElementShift(1.2), stagger: 0, duration: 1, force3D: false }
            : { yPercent: 120, stagger: 0, duration: 1, force3D: useTextForce3D },
          0
        );

        if (heroLogoEls.length) {
          tl.to(
            heroLogoEls,
            isMobileSafari
              ? { y: getElementShift(0.4), opacity: 0, duration: 0.9, force3D: false }
              : {
                  yPercent: 40,
                  opacity: 0,
                  duration: 0.9,
                  force3D: useTextForce3D,
                },
            0.05
          );
        }

        tl.set(aboutSection, { autoAlpha: 1, pointerEvents: "auto" }, 1).to(
          aboutInEls,
          isMobileSafari
            ? { y: 0, opacity: 1, stagger: 0, duration: 0.9, force3D: false }
            : {
                yPercent: 0,
                opacity: 1,
                stagger: 0,
                duration: 0.9,
                force3D: useTextForce3D,
              },
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

      const workSection = document.querySelector("#work");
      const contactSection = document.querySelector("#contact");
      const stageTrigger = tl.scrollTrigger;

      const killBlockJumpTriggers = () => {
        blockJumpTween?.kill();
        blockJumpTween = null;
        blockJumpTriggers.forEach((trigger) => trigger.kill());
        blockJumpTriggers = [];
      };

      const createDesktopBlockJumps = () => {
        if (!enableScrollSnap || !stageTrigger || !workSection) return;

        const getSmoother = () => ScrollSmoother.get?.();
        const getScrollTop = () =>
          getSmoother()?.scrollTop?.() ?? window.scrollY ?? 0;
        const setScrollTop = (value) => {
          const smoother = getSmoother();

          if (smoother?.scrollTop) {
            smoother.scrollTop(value);
          } else {
            window.scrollTo(0, value);
          }
        };
        const getElementTop = (element) =>
          element.getBoundingClientRect().top + getScrollTop();
        const isSuppressed = () => {
          const now = window.performance?.now?.() ?? Date.now();
          const suppressedUntil = window.__suppressStageSnapUntil ?? 0;

          return now < suppressedUntil;
        };
        const jumpToScroll = (targetScroll, direction = 0) => {
          if (
            !Number.isFinite(targetScroll) ||
            blockJumpTween ||
            isSuppressed() ||
            document.body.hasAttribute("data-portfolio-viewer")
          ) {
            return;
          }

          const current = getScrollTop();
          const maxScroll = ScrollTrigger.maxScroll(window);
          const target = gsap.utils.clamp(0, maxScroll, targetScroll);

          if (direction > 0 && target <= current + 24) return;
          if (direction < 0 && target >= current - 24) return;
          if (direction === 0 && Math.abs(target - current) <= 24) return;

          const proxy = { scroll: current };
          const duration = 0.8;
          window.__suppressStageSnapUntil =
            (window.performance?.now?.() ?? Date.now()) + duration * 1000 + 250;

          blockJumpTween = gsap.to(proxy, {
            scroll: target,
            duration,
            ease: "power2.out",
            overwrite: true,
            onUpdate: () => {
              setScrollTop(proxy.scroll);
              ScrollTrigger.update();
            },
            onComplete: () => {
              blockJumpTween = null;
              window.__syncHeaderState?.();
            },
            onInterrupt: () => {
              blockJumpTween = null;
            },
          });
        };
        const jumpToSection = (targetSection, direction) => {
          if (!targetSection) return;
          jumpToScroll(getElementTop(targetSection), direction);
        };
        const jumpToAboutStage = () => {
          jumpToScroll(stageTrigger.end - 1, -1);
        };

        killBlockJumpTriggers();

        const triggerOffset = () => Math.max(4, window.innerHeight * 0.1);

        blockJumpTriggers.push(
          ScrollTrigger.create({
            id: "desktop-block-jump-stage-work",
            trigger: document.body,
            start: () => stageTrigger.end + triggerOffset(),
            end: () => stageTrigger.end + Math.max(4, window.innerHeight * 0.5),
            onEnter: (self) => {
              if (self.direction > 0) jumpToSection(workSection, 1);
            },
            onEnterBack: (self) => {
              if (self.direction < 0) jumpToAboutStage();
            },
            invalidateOnRefresh: true,
          }),
        );

        if (contactSection) {
          blockJumpTriggers.push(
            ScrollTrigger.create({
              id: "desktop-block-jump-work-contact",
              trigger: workSection,
              start: "bottom 90%",
              end: () => `+=${Math.max(4, window.innerHeight * 0.5)}`,
              onEnter: (self) => {
                if (self.direction > 0) jumpToSection(contactSection, 1);
              },
              onEnterBack: (self) => {
                if (self.direction < 0) jumpToSection(workSection, -1);
              },
              invalidateOnRefresh: true,
            }),
          );
        }
      };

      if (enableScrollSnap && workSection && stageTrigger) {
        const updateSectionSnapPoints = () => {
          const start = stageTrigger.end;
          const end = ScrollTrigger.maxScroll(window);
          const range = Math.max(1, end - start);
          const smoother = ScrollSmoother.get?.();
          const scrollTop = smoother?.scrollTop?.() ?? window.scrollY ?? 0;
          const clampPoint = gsap.utils.clamp(start, end);
          const getTop = (el) =>
            el.getBoundingClientRect().top + scrollTop;

          const workSnapBefore = Math.max(260, window.innerHeight * 0.9);
          const workSnapAfter = Math.max(120, window.innerHeight * 0.25);

          sectionSnapPoints = [
            {
              scroll: clampPoint(getTop(workSection)),
              beforeLimit: workSnapBefore,
              afterLimit: workSnapAfter,
            },
          ]
            .filter(
              (point, index, arr) =>
                arr.findIndex((item) => item.scroll === point.scroll) === index,
            )
            .map((point) => ({
              ...point,
              progress: (point.scroll - start) / range,
            }));
        };

        sectionSnapTrigger?.kill();
        sectionSnapTrigger = ScrollTrigger.create({
          id: "section-snap",
          trigger: document.body,
          start: () => stageTrigger.end,
          end: () => ScrollTrigger.maxScroll(window),
          onRefresh: updateSectionSnapPoints,
          snap: {
            snapTo: (progress) => {
              const now = window.performance?.now?.() ?? Date.now();
              const suppressedUntil = window.__suppressStageSnapUntil ?? 0;

              if (now < suppressedUntil) return progress;

              const start = stageTrigger.end;
              const end = ScrollTrigger.maxScroll(window);
              const range = Math.max(1, end - start);
              const currentScroll = start + progress * range;
              const points = sectionSnapPoints
                .map((point) => ({
                  progress: point.progress,
                  scroll: point.scroll,
                  beforeLimit: point.beforeLimit,
                  afterLimit: point.afterLimit,
                  distance: Math.abs(point.scroll - currentScroll),
                  isBefore: currentScroll <= point.scroll,
                }))
                .filter((point) =>
                  point.isBefore
                    ? point.distance <= point.beforeLimit
                    : point.distance <= point.afterLimit,
                );

              if (!points.length) return progress;

              const closest = points.reduce((currentClosest, point) =>
                point.distance < currentClosest.distance ? point : currentClosest,
              );

              return closest.progress;
            },
            delay: 0.08,
            duration: useMobilePerfMode
              ? { min: 0.14, max: 0.22 }
              : { min: 0.18, max: 0.32 },
            ease: "power1.out",
            inertia: false,
          },
          invalidateOnRefresh: true,
        });
        updateSectionSnapPoints();
      }

      createDesktopBlockJumps();
    };

    const onDone = () => init();
    window.addEventListener("intro:done", onDone, { once: true });
    if (window.__introDone) init();

    return () => {
      delete window.__syncHeaderState;
      if (tickerFn) gsap.ticker.remove(tickerFn);
      blockJumpTween?.kill();
      blockJumpTriggers.forEach((trigger) => trigger.kill());
      sectionSnapTrigger?.kill();
      tl?.scrollTrigger?.kill();
      tl?.kill();
    };
  }, []);

  return null;
}
