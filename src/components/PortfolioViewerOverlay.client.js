"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import styles from "./PortfolioViewerOverlay.module.scss";
import PortfolioPreviewCard from "./PortfolioPreviewCard";

function clampIndex(i, len) {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(len - 1, i));
}

function getFirstVisibleIndex(index, len) {
  if (len <= 3) return 0;
  const maxFirst = len - 3;
  return Math.max(0, Math.min(maxFirst, index - 1));
}

export default function PortfolioViewerOverlay({ cards, initialIndex, onClose }) {
  const slides = useMemo(() => cards ?? [], [cards]);
  const CAROUSEL_DURATION = 1;
  const WIPE_DURATION = 0.5;
  const MASK_DURATION = 0.5;
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const startIndex = useMemo(
    () => Math.max(0, Math.min(slides.length - 1, initialIndex ?? 0)),
    [initialIndex, slides.length],
  );

  const previewViewportRef = useRef(null);
  const previewTrackRef = useRef(null);
  const rightColRef = useRef(null);
  const mediaTrackRef = useRef(null);
  const overlayRef = useRef(null);
  const overlayMaskRef = useRef(null);
  const wipeRef = useRef(null);
  const closingRef = useRef(false);
  const stepRef = useRef(0);
  const mediaStepRef = useRef(0);
  const wheelLockRef = useRef(0);
  const animatingRef = useRef(false);
  const activeIndexRef = useRef(0);
  const infoRef = useRef(null);
  const mediaRef = useRef(null);
  const didInitRef = useRef(false);
  const fadeTlRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const mask = overlayMaskRef.current;
    const wipe = wipeRef.current;
    if (!mask || !wipe) return;

    gsap.set(wipe, { scaleY: 0, transformOrigin: "top" });
    gsap.set(mask, {
      WebkitMaskSize: "100% 0%",
      maskSize: "100% 0%",
    });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power1.inOut" } });
    tl.to(wipe, { scaleY: 1, duration: WIPE_DURATION });
    tl.to(mask, { WebkitMaskSize: "100% 100%", maskSize: "100% 100%", duration: MASK_DURATION });
    requestAnimationFrame(() => tl.play(0));

    return () => tl.kill();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const targets = [infoRef.current, mediaRef.current].filter(Boolean);
    if (targets.length) {
      gsap.set(targets, { autoAlpha: 1 });
    }
    didInitRef.current = true;
  }, [mounted]);

  const handleClose = () => {
    if (closingRef.current) return;
    const mask = overlayMaskRef.current;
    const wipe = wipeRef.current;
    if (!mask || !wipe) {
      onClose?.();
      return;
    }

    closingRef.current = true;
    const tl = gsap.timeline({
      defaults: { ease: "power1.inOut" },
      onComplete: () => onClose?.(),
    });

    gsap.set(mask, {
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
      WebkitMaskPosition: "bottom",
      maskPosition: "bottom",
    });
    gsap.set(wipe, { scaleY: 1, transformOrigin: "bottom" });

    tl.to(mask, { WebkitMaskSize: "100% 0%", maskSize: "100% 0%", duration: MASK_DURATION });
    tl.to(wipe, { scaleY: 0, transformOrigin: "bottom", duration: WIPE_DURATION });
  };

  useEffect(() => {
    setActiveIndex(startIndex);
    setPreviewActiveIndex(startIndex);
    setDisplayIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const measureStep = () => {
    const track = previewTrackRef.current;
    if (!track) return 0;
    const card = track.querySelector("[data-preview-item]");
    if (!card) return 0;
    const w = card.getBoundingClientRect().width;
    const cs = window.getComputedStyle(track);
    const gap = parseFloat(cs.gap || cs.columnGap || "0") || 0;
    const step = w + gap;
    stepRef.current = step;
    return step;
  };

  const measureMediaStep = () => {
    const media = mediaRef.current;
    if (!media) return 0;
    const w = media.getBoundingClientRect().width;
    mediaStepRef.current = w;
    return w;
  };

  const setTrackXByPos = (pos, { animate } = { animate: true }) => {
    const track = previewTrackRef.current;
    const step = stepRef.current || measureStep();
    if (!track || !step) return;
    const x = -pos * step;
    if (animate) {
      gsap.to(track, { x, duration: CAROUSEL_DURATION, ease: "power1.inOut", overwrite: true });
    } else {
      gsap.set(track, { x });
    }
  };

  const setMediaXByIndex = (index, { animate } = { animate: true }) => {
    const track = mediaTrackRef.current;
    const step = mediaStepRef.current || measureMediaStep();
    if (!track || !step) return;
    const x = -index * step;
    if (animate) {
      gsap.to(track, { x, duration: CAROUSEL_DURATION, ease: "power1.inOut", overwrite: true });
    } else {
      gsap.set(track, { x });
    }
  };

  const runFadeTo = (nextIndex) => {
    if (!mounted) {
      setDisplayIndex(nextIndex);
      return;
    }

    const targets = [infoRef.current].filter(Boolean);
    if (!targets.length) {
      setDisplayIndex(nextIndex);
      return;
    }

    gsap.killTweensOf(targets);
    fadeTlRef.current?.kill();

    const tl = gsap.timeline({ defaults: { ease: "power1.inOut" } });
    tl.to(targets, { autoAlpha: 0, duration: 0.5 });
    tl.add(() => setDisplayIndex(nextIndex));
    tl.to(targets, { autoAlpha: 1, duration: 0.5 });
    fadeTlRef.current = tl;
  };

  useLayoutEffect(() => {
    if (!mounted) return;
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    const ro = new ResizeObserver(() => {
      measureStep();
      const len = slides.length;
      const firstVisible = getFirstVisibleIndex(activeIndex, len);
      setTrackXByPos(firstVisible, { animate: false });
    });
    ro.observe(viewport);

    requestAnimationFrame(() => {
      measureStep();
      const len = slides.length;
      const firstVisible = getFirstVisibleIndex(activeIndex, len);
      setTrackXByPos(firstVisible, { animate: false });
    });

    return () => ro.disconnect();
  }, [mounted, activeIndex, slides.length]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const media = mediaRef.current;
    if (!media) return;

    const ro = new ResizeObserver(() => {
      measureMediaStep();
      setMediaXByIndex(activeIndex, { animate: false });
    });
    ro.observe(media);

    requestAnimationFrame(() => {
      measureMediaStep();
      setMediaXByIndex(activeIndex, { animate: false });
    });

    return () => ro.disconnect();
  }, [mounted, activeIndex]);

  useEffect(() => {
    const len = slides.length;
    if (!len) return;
    const firstVisible = getFirstVisibleIndex(activeIndex, len);
    setTrackXByPos(firstVisible, { animate: false });
  }, [activeIndex, slides.length]);

  useEffect(() => {
    setMediaXByIndex(activeIndex, { animate: false });
  }, [activeIndex]);

  useLayoutEffect(() => {
    if (!mounted) return;

    const col = rightColRef.current;
    const media = mediaRef.current;
    const previews = previewViewportRef.current;
    if (!col || !media || !previews) return;

    const compute = () => {
      // Available height inside the right column container (it has top+bottom)
      const colH = col.getBoundingClientRect().height;
      const colW = col.getBoundingClientRect().width;
      const styles = window.getComputedStyle(col);
      const gap = parseFloat(styles.rowGap || styles.gap || "0") || 0;
      const previewsH = previews.getBoundingClientRect().height;

      // Ideal 16:9 height for full width
      const ideal = (colW * 9) / 16;
      const available = Math.max(180, colH - previewsH - gap); // keep some minimum
      const h = Math.min(ideal, available);

      col.style.setProperty("--media-h", `${h}px`);

      // Compute preview card width from actual right column width (always 3 cards)
      const track = previewTrackRef.current;
      if (track) {
        const trackStyles = window.getComputedStyle(track);
        const trackGap =
          parseFloat(trackStyles.gap || trackStyles.columnGap || "0") || 0;
        const count = 3;
        const cardW = (colW - trackGap * (count - 1)) / count;
        col.style.setProperty("--preview-card-fit", `${cardW}px`);
      }
    };

    const ro = new ResizeObserver(compute);
    ro.observe(col);
    ro.observe(previews);

    compute();
    return () => ro.disconnect();
  }, [mounted]);

  const goTo = (next) => {
    const len = slides.length;
    if (!len) return;
    if (animatingRef.current) return;
    const nextIndex = clampIndex(next, len);
    if (nextIndex === activeIndexRef.current) return;

    animatingRef.current = true;

    const track = previewTrackRef.current;
    const step = stepRef.current || measureStep();
    if (!track || !step) {
      animatingRef.current = false;
      return;
    }

    const firstVisible = getFirstVisibleIndex(nextIndex, len);

    // Start info fade immediately with carousel motion
    runFadeTo(nextIndex);
    // Update preview opacity immediately on scroll start
    setPreviewActiveIndex(nextIndex);

    gsap.to(track, {
      x: -firstVisible * step,
      duration: CAROUSEL_DURATION,
      ease: "power1.inOut",
      overwrite: true,
      onComplete: () => {
        setActiveIndex(() => nextIndex);
        gsap.set(track, { x: -firstVisible * step });
        animatingRef.current = false;
      },
    });

    setMediaXByIndex(nextIndex);
  };

  const go = (dir) => {
    goTo(activeIndexRef.current + dir);
  };

  const onPreviewWheel = (e) => {
    // Step projects by wheel/trackpad input; we animate the strip only.
    e.preventDefault();

    const now = performance.now();
    if (now - wheelLockRef.current < 120) return;

    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    const d = absX > absY ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 2) return;

    wheelLockRef.current = now;
    go(d > 0 ? 1 : -1);
  };

  useEffect(() => {
    if (!mounted) return;

    const onWheel = (e) => {
      // Allow scrolling anywhere on the overlay to change slides
      if (e.target?.closest?.("input, textarea, select, button")) return;
      e.preventDefault();

      const now = performance.now();
      if (now - wheelLockRef.current < 120) return;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const d = absX > absY ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 2) return;

      wheelLockRef.current = now;
      go(d > 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [mounted]);

  if (!mounted) return null;

  const active = slides[displayIndex] ?? slides[0];
  const trackItems = slides;

  return createPortal(
    <div className={styles.overlay} ref={overlayRef} role="dialog" aria-modal="true">
      <div className={styles.wipe} ref={wipeRef} aria-hidden="true" />
      <div className={styles.overlayMask} ref={overlayMaskRef}>
        <div className={styles.overlayContent}>
          <div className={styles.info} ref={infoRef}>
          <p className={styles.date}>{active?.date}</p>
          <p className={styles.title}>{active?.title}</p>
          <div className={styles.desc}>
            <p>
              Создание мультимедийного пространства для регионального филиала
              Национального центра «Россия» во Владивостоке, Приморский Край.
            </p>
            <p>
              Development of a multimedia space for the regional branch of the
              &quot;Rossiya&quot; National Centre in Vladivostok, Primorsky Krai.
            </p>
            <p>
              为位于滨海边疆区符拉迪沃斯托克的“ROSSIYA”国家中心区域分部打造多媒体空间。
            </p>
          </div>
        </div>

          <div className={styles.rightCol} ref={rightColRef}>
          <div className={styles.media} aria-label="Video carousel" ref={mediaRef}>
            <div className={styles.mediaTrack} ref={mediaTrackRef}>
              {slides.map((c, idx) => (
                <div className={styles.mediaSlide} key={`${c?.id ?? "media"}-${idx}`}>
                  <div
                    className={styles.mediaInner}
                    style={{ backgroundImage: `url(${c?.imageSrc})` }}
                  >
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={styles.previewsViewport}
            ref={previewViewportRef}
            aria-label="Project previews"
          >
            <div
              className={styles.previewsTrack}
              ref={previewTrackRef}
              onWheel={onPreviewWheel}
            >
              {trackItems.map((c, idx) => {
                const isActive = idx === previewActiveIndex;
                const isDim = !isActive;

                return (
                  <PortfolioPreviewCard
                    key={`${c?.id ?? "item"}-${idx}`}
                    card={c}
                    dim={isDim}
                    onClick={() => goTo(idx)}
                    ariaLabel={isActive ? "Current project" : "Open project"}
                    data-preview-item
                  />
                );
              })}
            </div>
          </div>

          <div className={styles.carouselActions}>
            <button
              type="button"
              className={styles.prevBtn}
              onClick={() => go(-1)}
              aria-label="Previous project"
            >
              <img
                className={`${styles.btnIcon} ${styles.btnIconLeft}`}
                src="/svg/arrow.svg"
                alt=""
                aria-hidden="true"
              />
            <span className={styles.btnText}>
              Предыдущая работа · Previous project ·
              <span className={styles.btnTextCn}>上一个项目</span>
            </span>
            </button>

            <button
              type="button"
              className={styles.nextBtn}
              onClick={() => go(1)}
              aria-label="Next project"
            >
            <span className={styles.btnText}>
              Следующая работа · Next project ·
              <span className={styles.btnTextCn}>下一个项目</span>
            </span>
              <img
                className={`${styles.btnIcon} ${styles.btnIconRight}`}
                src="/svg/arrow.svg"
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <button type="button" className={styles.backBtn} onClick={handleClose}>
          <img
            className={`${styles.btnIcon} ${styles.btnIconLeft}`}
            src="/svg/arrow.svg"
            alt=""
            aria-hidden="true"
          />
          <span className={styles.btnText}>
            Назад · Back · <span className={styles.btnTextCn}>返回</span>
          </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

