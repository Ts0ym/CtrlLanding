"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import styles from "./PortfolioViewerOverlay.module.scss";
import { getAssetUrl } from "../lib/assetUrl";
import {
  getLocalizedProjectDescription,
  getLocalizedProjectField,
} from "../lib/portfolioProjects";

function clampIndex(i, len) {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(len - 1, i));
}

function getFirstVisibleIndex(index, len) {
  if (len <= 3) return 0;
  const maxFirst = len - 3;
  return Math.max(0, Math.min(maxFirst, index - 1));
}

const defaultDesc = {
  ru: "Создание мультимедийного пространства для регионального филиала Национального центра «Россия» во Владивостоке, Приморский Край.",
  en: "Development of a multimedia space for the regional branch of the \"Rossiya\" National Centre in Vladivostok, Primorsky Krai.",
  cn: "为位于滨海边疆区符拉迪沃斯托克的“ROSSIYA”国家中心区域分部打造多媒体空间。",
};
const DEFAULT_VIDEO_VOLUME = 0.5;
const VIDEO_VOLUME_STORAGE_KEY = "portfolio-viewer-volume";
const VIDEO_MUTED_STORAGE_KEY = "portfolio-viewer-muted";
const PORTFOLIO_VIEWER_HISTORY_KEY = "__portfolioViewer";
const END_VIDEO_INTERACTION_MS = 1800;
const END_VIDEO_SNAP_IDLE_MS = 120;
const END_VIDEO_SNAP_DURATION = 0.42;
const END_VIDEO_SNAP_THRESHOLD = 0.5;

function clampVolume(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_VIDEO_VOLUME;
  return Math.max(0, Math.min(1, num));
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function resolveMediaSource(videoSrc) {
  if (!videoSrc) return null;

  if (isAbsoluteUrl(videoSrc)) {
    return videoSrc;
  }

  return getAssetUrl(videoSrc);
}

function getEmbedMatch(videoEmbedCode, attributeName) {
  if (!videoEmbedCode) return null;

  const match = videoEmbedCode.match(
    new RegExp(`${attributeName}\\s*=\\s*["']([^"']+)["']`, "i"),
  );

  return match?.[1] ?? null;
}

function getVideoInputValue(value) {
  if (!value) return "";

  const trimmed = String(value).trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("<iframe")) {
    return getEmbedMatch(trimmed, "src") ?? "";
  }

  return trimmed;
}

function buildYouTubeEmbed(url) {
  const host = url.hostname.replace(/^www\./, "");
  let videoId = "";

  if (host === "youtu.be") {
    videoId = url.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") || "";
    } else if (url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/")[2] || "";
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2] || "";
    }
  }

  if (!videoId) return null;

  return {
    src: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
    allow:
      "autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;",
  };
}

function buildVimeoEmbed(url) {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const videoId =
    host === "player.vimeo.com" && parts[0] === "video" ? parts[1] : parts[0];

  if (!videoId) return null;

  return {
    src: `https://player.vimeo.com/video/${videoId}`,
    allow:
      "autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;",
  };
}

function buildKinescopeEmbed(url) {
  const host = url.hostname.replace(/^www\./, "");
  if (
    host !== "kinescope.io" &&
    host !== "kinescope.ru" &&
    host !== "player.kinescope.io"
  ) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const embedIndex = parts.indexOf("embed");
  const videoId =
    embedIndex !== -1 ? parts[embedIndex + 1] : parts[parts.length - 1];

  if (!videoId) return null;

  return {
    src: `https://kinescope.io/embed/${videoId}`,
    allow:
      "autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;",
  };
}

function parseVkVideoIds(url) {
  const directMatch = url.pathname.match(/video(-?\d+)_([0-9]+)/i);
  if (directMatch) {
    return {
      oid: directMatch[1],
      id: directMatch[2],
    };
  }

  const zValue = url.searchParams.get("z") || "";
  const zMatch = zValue.match(/video(-?\d+)_([0-9]+)/i);
  if (zMatch) {
    return {
      oid: zMatch[1],
      id: zMatch[2],
    };
  }

  const oid = url.searchParams.get("oid");
  const id = url.searchParams.get("id");
  if (oid && id) {
    return { oid, id };
  }

  return null;
}

function buildVkEmbed(url) {
  const host = url.hostname.replace(/^www\./, "");
  if (
    host !== "vk.com" &&
    host !== "m.vk.com" &&
    host !== "vkvideo.ru"
  ) {
    return null;
  }

  if (url.pathname.includes("video_ext.php")) {
    return {
      src: url.toString(),
      allow:
        "autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;",
    };
  }

  const videoIds = parseVkVideoIds(url);
  if (!videoIds) return null;

  return {
    src: `https://vk.com/video_ext.php?oid=${videoIds.oid}&id=${videoIds.id}&hd=2`,
    allow:
      "autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;",
  };
}

function resolveEmbedConfig(videoEmbedCode) {
  const rawValue = getVideoInputValue(videoEmbedCode);
  if (!rawValue) return null;

  let parsedUrl = null;
  try {
    parsedUrl = new URL(rawValue);
  } catch {
    return {
      src: rawValue,
      allow:
        "autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;",
    };
  }

  return (
    buildYouTubeEmbed(parsedUrl) ||
    buildVimeoEmbed(parsedUrl) ||
    buildKinescopeEmbed(parsedUrl) ||
    buildVkEmbed(parsedUrl) || {
      src: parsedUrl.toString(),
      allow:
        "autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;",
    }
  );
}

function getAutoplayEmbedSrc(src) {
  if (!src) return src;

  try {
    const base =
      typeof window === "undefined" ? "https://localhost" : window.location.href;
    const url = new URL(src, base);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("playsinline", "1");

    return url.toString();
  } catch {
    return src;
  }
}

function hasHanScript(text) {
  return /[\p{Script=Han}]/u.test(text);
}

function renderTitleWithChineseSpans(title, className) {
  const value = String(title ?? "");

  return value.split(/([\p{Script=Han}]+)/gu).map((part, index) => {
    if (!part) return null;

    if (/[\p{Script=Han}]/u.test(part)) {
      return (
        <span key={`han-${index}`} className={className}>
          {part}
        </span>
      );
    }

    return part;
  });
}

function splitDescriptionText(text) {
  return String(text)
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDescriptionBlocks(desc) {
  if (!desc) return [];

  if (typeof desc === "string") {
    return splitDescriptionText(desc).map((text, index) => ({
      key: `text-${index}`,
      text,
      className: hasHanScript(text) ? styles.descCh : "",
    }));
  }

  return [
    { key: "ru", text: desc.ru, className: "" },
    { key: "en", text: desc.en, className: "" },
    { key: "cn", text: desc.cn, className: styles.descCh },
  ].flatMap((item) =>
    splitDescriptionText(item.text).map((text, index) => ({
      key: `${item.key}-${index}`,
      text,
      className: item.className || (hasHanScript(text) ? styles.descCh : ""),
    })),
  );
}

function isFullscreenActive() {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement,
  );
}

function isVideoFullscreenActive(videoRefs) {
  if (isFullscreenActive()) return true;

  return videoRefs.current.some((videoEl) => {
    if (!videoEl) return false;

    return Boolean(
      videoEl.webkitDisplayingFullscreen ||
        videoEl.webkitPresentationMode === "fullscreen" ||
        videoEl === document.fullscreenElement,
    );
  });
}

function setPortfolioViewerStage(stage) {
  if (typeof document === "undefined") return;

  const targets = [document.documentElement, document.body];
  targets.forEach((node) => {
    if (!node) return;

    if (stage) {
      node.setAttribute("data-portfolio-viewer-stage", stage);
    } else {
      node.removeAttribute("data-portfolio-viewer-stage");
    }
  });
}

function StaticProjectMedia({ item, title, loading = "lazy", autoPlay = false }) {
  const mediaType = item?.mediaType || (item?.videoEmbedCode ? "video" : "image");
  const embedConfig = mediaType === "video" ? resolveEmbedConfig(item?.videoEmbedCode) : null;

  if (embedConfig) {
    return (
      <iframe
        key={autoPlay ? "autoplay" : "idle"}
        className={`${styles.mediaIframe} ${styles.mediaIframeReady}`}
        src={autoPlay ? getAutoplayEmbedSrc(embedConfig.src) : embedConfig.src}
        title={title || "Project media"}
        allow={embedConfig.allow}
        allowFullScreen
        loading={loading}
      />
    );
  }

  if (item?.imageSrc) {
    return (
      <img
        className={styles.mediaImage}
        src={getAssetUrl(item.imageSrc)}
        alt=""
        loading={loading}
      />
    );
  }

  return null;
}

function ProjectBlockDivider() {
  return (
    <div className={styles.blockDivider} aria-hidden="true">
      <span className={`${styles.blockDividerLine} ${styles.blockDividerLineLeft}`} />
      <span className={`${styles.blockDividerLine} ${styles.blockDividerLineRight}`} />
    </div>
  );
}

export default function PortfolioViewerOverlay({
  cards,
  initialIndex,
  language = "ru",
  onClose,
}) {
  const slides = useMemo(() => cards ?? [], [cards]);
  const CAROUSEL_DURATION = 1;
  const WIPE_DURATION = 0.5;
  const MASK_DURATION = 0.5;
  const [mounted, setMounted] = useState(false);
  const [isMax1200, setIsMax1200] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [activeEmbedReady, setActiveEmbedReady] = useState(false);
  const mediaAspectRatio =
    slides[previewActiveIndex]?.videoAspectRatio ??
    slides[activeIndex]?.videoAspectRatio ??
    slides[displayIndex]?.videoAspectRatio ??
    16 / 9;
  const startIndex = useMemo(
    () => Math.max(0, Math.min(slides.length - 1, initialIndex ?? 0)),
    [initialIndex, slides.length],
  );

  const previewViewportRef = useRef(null);
  const previewTrackRef = useRef(null);
  const rightColRef = useRef(null);
  const mediaTrackRef = useRef(null);
  const overlayRef = useRef(null);
  const overlayContentRef = useRef(null);
  const overlayMaskRef = useRef(null);
  const wipeRef = useRef(null);
  const closingRef = useRef(false);
  const stepRef = useRef(0);
  const mediaStepRef = useRef(0);
  const animatingRef = useRef(false);
  const activeIndexRef = useRef(0);
  const infoRef = useRef(null);
  const descRef = useRef(null);
  const mediaRef = useRef(null);
  const endVideoBlockRef = useRef(null);
  const endVideoProgressRef = useRef(0);
  const endVideoTweenRef = useRef(null);
  const endVideoSnapTimeoutRef = useRef(0);
  const endVideoLastDeltaRef = useRef(0);
  const endVideoTouchYRef = useRef(0);
  const isEndVideoPinnedRef = useRef(false);
  const endVideoInteractionTimeoutRef = useRef(0);
  const videoRefs = useRef([]);
  const fullscreenVideoRef = useRef(false);
  const didInitRef = useRef(false);
  const fadeTlRef = useRef(null);
  const touchYRef = useRef(0);
  const savedVolumeRef = useRef(DEFAULT_VIDEO_VOLUME);
  const savedMutedRef = useRef(false);
  const [isEndVideoPinned, setIsEndVideoPinned] = useState(false);
  const [isEndVideoInteractive, setIsEndVideoInteractive] = useState(false);
  const [shouldAutoplayEndVideo, setShouldAutoplayEndVideo] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 1200px)");
    const update = () => setIsMax1200(media.matches);
    update();

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedVolume = window.localStorage.getItem(VIDEO_VOLUME_STORAGE_KEY);
    const storedMuted = window.localStorage.getItem(VIDEO_MUTED_STORAGE_KEY);

    if (storedVolume !== null) {
      savedVolumeRef.current = clampVolume(storedVolume);
    }

    if (storedMuted !== null) {
      savedMutedRef.current = storedMuted === "true";
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const overlayEl = overlayRef.current;
    if (!overlayEl) return;

    const updateViewportOffsets = () => {
      const vv = window.visualViewport;
      if (!vv) {
        overlayEl.style.setProperty("--viewer-bottom-ui-offset", "0px");
        return;
      }

      const bottomOffset = Math.max(
        0,
        Math.round(window.innerHeight - (vv.height + vv.offsetTop)),
      );

      overlayEl.style.setProperty(
        "--viewer-bottom-ui-offset",
        `${bottomOffset}px`,
      );
    };

    updateViewportOffsets();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", updateViewportOffsets);
    vv?.addEventListener("scroll", updateViewportOffsets);
    window.addEventListener("resize", updateViewportOffsets);
    window.addEventListener("orientationchange", updateViewportOffsets);

    return () => {
      vv?.removeEventListener("resize", updateViewportOffsets);
      vv?.removeEventListener("scroll", updateViewportOffsets);
      window.removeEventListener("resize", updateViewportOffsets);
      window.removeEventListener("orientationchange", updateViewportOffsets);
      overlayEl.style.removeProperty("--viewer-bottom-ui-offset");
    };
  }, [mounted]);

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
    tl.eventCallback("onComplete", () => {
      if (!closingRef.current) {
        setPortfolioViewerStage("opened");
        window.dispatchEvent(new CustomEvent("portfolio-viewer:lock-scroll"));
      }
    });
    requestAnimationFrame(() => tl.play(0));

    return () => tl.kill();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const targets = [
      infoRef.current,
      mediaRef.current,
      isMax1200 ? descRef.current : null,
    ].filter(Boolean);
    if (targets.length) {
      gsap.set(targets, { autoAlpha: 1 });
    }
    didInitRef.current = true;
  }, [mounted, isMax1200]);

  const handleClose = ({ fromHistory = false } = {}) => {
    if (closingRef.current) return;

    if (
      !fromHistory &&
      typeof window !== "undefined" &&
      window.history.state?.[PORTFOLIO_VIEWER_HISTORY_KEY]?.open
    ) {
      window.history.back();
      return;
    }

    const mask = overlayMaskRef.current;
    const wipe = wipeRef.current;
    if (!mask || !wipe) {
      onClose?.();
      return;
    }

    closingRef.current = true;
    setPortfolioViewerStage("closing");
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

  useLayoutEffect(() => {
    setActiveIndex(startIndex);
    setPreviewActiveIndex(startIndex);
    setDisplayIndex(startIndex);
  }, [startIndex]);

  useLayoutEffect(() => {
    setActiveEmbedReady(false);
  }, [previewActiveIndex]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (!mounted) return;

    videoRefs.current.forEach((videoEl, idx) => {
      if (!videoEl) return;
      if (idx === previewActiveIndex) {
        videoEl.muted = savedMutedRef.current;
        videoEl.defaultMuted = savedMutedRef.current;
        videoEl.volume = clampVolume(savedVolumeRef.current);
        const playPromise = videoEl.play();
        if (playPromise?.catch) playPromise.catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }, [mounted, previewActiveIndex, slides.length]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const targets = [document.documentElement, document.body];

    targets.forEach((node) => {
      if (!node) return;

      if (isEndVideoPinned) {
        node.setAttribute("data-portfolio-end-video", "open");
      } else {
        node.removeAttribute("data-portfolio-end-video");
      }
    });

    return () => {
      targets.forEach((node) => {
        node?.removeAttribute("data-portfolio-end-video");
      });
    };
  }, [isEndVideoPinned]);

  useEffect(() => {
    if (!mounted) return;

    const syncFullscreenState = () => {
      fullscreenVideoRef.current = isVideoFullscreenActive(videoRefs);
    };

    const onDocumentFullscreenChange = () => {
      syncFullscreenState();
    };

    document.addEventListener("fullscreenchange", onDocumentFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onDocumentFullscreenChange);
    document.addEventListener("mozfullscreenchange", onDocumentFullscreenChange);
    document.addEventListener("MSFullscreenChange", onDocumentFullscreenChange);

    const cleanups = [];

    videoRefs.current.forEach((videoEl) => {
      if (!videoEl) return;

      const onVideoFullscreenEnter = () => {
        fullscreenVideoRef.current = true;
      };

      const onVideoFullscreenExit = () => {
        fullscreenVideoRef.current = false;
      };

      videoEl.addEventListener("webkitbeginfullscreen", onVideoFullscreenEnter);
      videoEl.addEventListener("webkitendfullscreen", onVideoFullscreenExit);
      videoEl.addEventListener("enterpictureinpicture", onVideoFullscreenEnter);
      videoEl.addEventListener("leavepictureinpicture", onVideoFullscreenExit);

      cleanups.push(() => {
        videoEl.removeEventListener("webkitbeginfullscreen", onVideoFullscreenEnter);
        videoEl.removeEventListener("webkitendfullscreen", onVideoFullscreenExit);
        videoEl.removeEventListener("enterpictureinpicture", onVideoFullscreenEnter);
        videoEl.removeEventListener("leavepictureinpicture", onVideoFullscreenExit);
      });
    });

    syncFullscreenState();

    return () => {
      document.removeEventListener("fullscreenchange", onDocumentFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onDocumentFullscreenChange,
      );
      document.removeEventListener("mozfullscreenchange", onDocumentFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onDocumentFullscreenChange);
      cleanups.forEach((cleanup) => cleanup());
      fullscreenVideoRef.current = false;
    };
  }, [mounted, slides.length, previewActiveIndex]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  useEffect(() => {
    const onRequestClose = (event) =>
      handleClose({ fromHistory: Boolean(event?.detail?.fromHistory) });
    window.addEventListener("portfolio-viewer:request-close", onRequestClose);
    return () =>
      window.removeEventListener("portfolio-viewer:request-close", onRequestClose);
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

    const targets = [
      infoRef.current,
      isMax1200 ? descRef.current : null,
    ].filter(Boolean);
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
    if (!col || !media) return;

    const compute = () => {
      const colW = col.getBoundingClientRect().width;
      const styles = window.getComputedStyle(col);
      const content = overlayContentRef.current;
      const contentStyles = content ? window.getComputedStyle(content) : null;
      const contentPaddingTop = parseFloat(contentStyles?.paddingTop || "0") || 0;
      const contentPaddingBottom =
        parseFloat(contentStyles?.paddingBottom || "0") || 0;
      const gap = parseFloat(styles.rowGap || styles.gap || "0") || 0;
      const previewsH = previews?.getBoundingClientRect().height ?? 0;
      const viewportH = window.visualViewport?.height ?? window.innerHeight;

      // Keep native media aspect ratio in JS; mobile 16:9 is handled in CSS.
      const ratio = mediaAspectRatio > 0 ? mediaAspectRatio : 16 / 9;
      const ideal = colW / ratio;
      const available = Math.max(
        260,
        viewportH - contentPaddingTop - contentPaddingBottom - previewsH - gap,
      );
      const h = Math.min(ideal, available);
      col.style.setProperty("--media-h", `${h}px`);
      col.style.removeProperty("--media-w");

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
    if (overlayContentRef.current) ro.observe(overlayContentRef.current);
    if (previews) ro.observe(previews);
    window.addEventListener("resize", compute);
    window.visualViewport?.addEventListener("resize", compute);

    compute();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.visualViewport?.removeEventListener("resize", compute);
    };
  }, [mounted, isMax1200, mediaAspectRatio]);

  const goTo = (next) => {
    const len = slides.length;
    if (!len) return;
    if (animatingRef.current) return;
    const nextIndex = clampIndex(next, len);
    if (nextIndex === activeIndexRef.current) return;

    animatingRef.current = true;

    const track = previewTrackRef.current;
    const step = stepRef.current || measureStep();
    const firstVisible = getFirstVisibleIndex(nextIndex, len);

    // Start info fade immediately with carousel motion
    runFadeTo(nextIndex);
    // Update preview opacity immediately on scroll start
    setPreviewActiveIndex(nextIndex);

    if (track && step) {
      // Desktop: preview track drives timing, media animates in parallel
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
    } else {
      // Mobile: no preview track — animate media, update state on complete
      const mTrack = mediaTrackRef.current;
      const mStep = mediaStepRef.current || measureMediaStep();
      if (mTrack && mStep) {
        gsap.to(mTrack, {
          x: -nextIndex * mStep,
          duration: CAROUSEL_DURATION,
          ease: "power1.inOut",
          overwrite: true,
          onComplete: () => {
            setActiveIndex(nextIndex);
            animatingRef.current = false;
          },
        });
      } else {
        setActiveIndex(nextIndex);
        animatingRef.current = false;
      }
    }
  };

  const go = (dir) => {
    goTo(activeIndexRef.current + dir);
  };

  const setEndVideoInteraction = (nextInteractive) => {
    if (endVideoInteractionTimeoutRef.current) {
      window.clearTimeout(endVideoInteractionTimeoutRef.current);
      endVideoInteractionTimeoutRef.current = 0;
    }

    setIsEndVideoInteractive(nextInteractive);

    if (nextInteractive) {
      endVideoInteractionTimeoutRef.current = window.setTimeout(() => {
        setIsEndVideoInteractive(false);
        endVideoInteractionTimeoutRef.current = 0;
      }, END_VIDEO_INTERACTION_MS);
    }
  };

  useEffect(() => {
    if (!mounted || !isMax1200) return;

    const scrollEl = overlayContentRef.current;
    if (!scrollEl) return;

    const onTouchStart = (e) => {
      if (!e.touches?.length) return;
      touchYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (!e.touches?.length) return;

      const target = e.target;
      if (!(target instanceof Element)) {
        e.preventDefault();
        return;
      }

      if (!scrollEl.contains(target)) {
        e.preventDefault();
        return;
      }

      const nextY = e.touches[0].clientY;
      const deltaY = nextY - touchYRef.current;
      touchYRef.current = nextY;

      const canScroll = scrollEl.scrollHeight > scrollEl.clientHeight + 1;
      if (!canScroll) {
        e.preventDefault();
        return;
      }

      const atTop = scrollEl.scrollTop <= 0;
      const atBottom =
        scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;

      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("touchmove", onTouchMove, true);
    };
  }, [mounted, isMax1200]);

  const rememberVideoAudioState = (videoEl) => {
    if (!videoEl || typeof window === "undefined") return;

    const nextVolume = clampVolume(videoEl.volume);
    const nextMuted = Boolean(videoEl.muted);

    savedVolumeRef.current = nextVolume;
    savedMutedRef.current = nextMuted;

    window.localStorage.setItem(VIDEO_VOLUME_STORAGE_KEY, String(nextVolume));
    window.localStorage.setItem(VIDEO_MUTED_STORAGE_KEY, String(nextMuted));
  };

  const active = slides[displayIndex] ?? slides[0];
  const hasEndVideo = Boolean(active?.endVideoEmbedCode);

  useEffect(() => {
    setIsEndVideoInteractive(false);
    setShouldAutoplayEndVideo(false);

    if (!hasEndVideo || isMax1200) {
      return undefined;
    }

    return () => {
      if (!endVideoInteractionTimeoutRef.current) return;
      window.clearTimeout(endVideoInteractionTimeoutRef.current);
      endVideoInteractionTimeoutRef.current = 0;
    };
  }, [hasEndVideo, isMax1200, displayIndex]);

  useLayoutEffect(() => {
    if (!mounted || !hasEndVideo || isMax1200) {
      endVideoProgressRef.current = 0;
      isEndVideoPinnedRef.current = false;
      setIsEndVideoPinned(false);
      return;
    }

    const scrollEl = overlayContentRef.current;
    const overlayEl = overlayRef.current;
    const endVideoEl = endVideoBlockRef.current;
    if (!scrollEl || !overlayEl || !endVideoEl) return;
    const getViewportHeight = () =>
      Math.max(1, window.visualViewport?.height ?? window.innerHeight);

    gsap.set(endVideoEl, {
      "--end-video-y": "100%",
      "--end-video-opacity": 0,
      pointerEvents: "none",
    });

    const getMaxScroll = () => {
      return Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    };

    const getScrollTop = () => scrollEl.scrollTop;

    const setScrollTop = (value) => {
      const nextValue = Math.max(0, Math.min(getMaxScroll(), value));
      scrollEl.scrollTop = nextValue;
    };

    const isAtBottom = () => getScrollTop() >= getMaxScroll() - 1;

    const getRevealDistance = () => getViewportHeight();

    const clearEndVideoSnap = () => {
      if (!endVideoSnapTimeoutRef.current) return;
      window.clearTimeout(endVideoSnapTimeoutRef.current);
      endVideoSnapTimeoutRef.current = 0;
    };

    const setEndVideoProgress = (
      nextProgress,
      { duration = 0.18, ease = "power2.out" } = {},
    ) => {
      const progress = Math.min(1, Math.max(0, nextProgress));
      const nextPinned = progress > 0.001;
      const nextAutoplay = progress >= 0.999;

      endVideoProgressRef.current = progress;
      setShouldAutoplayEndVideo((current) =>
        current === nextAutoplay ? current : nextAutoplay,
      );

      if (!nextAutoplay) {
        setEndVideoInteraction(false);
      }

      endVideoTweenRef.current?.kill();
      endVideoTweenRef.current = gsap.to(endVideoEl, {
        "--end-video-y": `${(1 - progress) * 100}%`,
        "--end-video-opacity": progress,
        duration,
        ease,
        overwrite: true,
      });

      if (isAtBottom() && getScrollTop() !== getMaxScroll()) {
        setScrollTop(getMaxScroll());
      }

      if (isEndVideoPinnedRef.current !== nextPinned) {
        isEndVideoPinnedRef.current = nextPinned;
        setIsEndVideoPinned(nextPinned);
      }
    };

    const snapEndVideo = () => {
      endVideoSnapTimeoutRef.current = 0;

      const progress = endVideoProgressRef.current;
      if (progress <= 0.001 || progress >= 0.999) return;

      const lastDelta = endVideoLastDeltaRef.current;
      const target =
        lastDelta > 0
          ? 1
          : lastDelta < 0
            ? 0
            : progress >= END_VIDEO_SNAP_THRESHOLD
              ? 1
              : 0;

      setEndVideoProgress(target, {
        duration: END_VIDEO_SNAP_DURATION,
        ease: "power3.out",
      });
    };

    const scheduleEndVideoSnap = () => {
      const progress = endVideoProgressRef.current;
      clearEndVideoSnap();

      if (progress <= 0.001 || progress >= 0.999) return;

      endVideoSnapTimeoutRef.current = window.setTimeout(
        snapEndVideo,
        END_VIDEO_SNAP_IDLE_MS,
      );
    };

    const consumeDelta = (deltaY, { snap = true } = {}) => {
      if (!Number.isFinite(deltaY) || deltaY === 0) return false;

      const currentProgress = endVideoProgressRef.current;
      const maxScroll = getMaxScroll();
      const remainingScroll = Math.max(0, maxScroll - getScrollTop());
      const shouldRevealThreshold = Math.max(2, Math.abs(deltaY) * 1.2);
      const shouldReveal =
        deltaY > 0 &&
        (currentProgress > 0 ||
          isAtBottom() ||
          remainingScroll <= shouldRevealThreshold);
      const shouldHide = deltaY < 0 && currentProgress > 0;

      if (!shouldReveal && !shouldHide) return false;

      if (shouldReveal) {
        setScrollTop(maxScroll);
      }

      if (Math.abs(deltaY) > 0.5) {
        endVideoLastDeltaRef.current = deltaY;
      }

      setEndVideoProgress(currentProgress + deltaY / getRevealDistance());
      if (snap) scheduleEndVideoSnap();
      return true;
    };

    const onWheel = (event) => {
      if (!consumeDelta(event.deltaY)) return;
      event.preventDefault();
    };

    const onTouchStart = (event) => {
      if (!event.touches?.length) return;
      clearEndVideoSnap();
      endVideoTouchYRef.current = event.touches[0].clientY;
    };

    const onTouchMove = (event) => {
      if (!event.touches?.length) return;

      const nextY = event.touches[0].clientY;
      const deltaY = endVideoTouchYRef.current - nextY;
      endVideoTouchYRef.current = nextY;

      if (!consumeDelta(deltaY, { snap: false })) return;
      event.preventDefault();
    };

    const onTouchEnd = () => {
      scheduleEndVideoSnap();
    };

    const onScroll = () => {
      if (endVideoProgressRef.current <= 0) return;
      setScrollTop(getMaxScroll());
    };

    setEndVideoProgress(0);
    document.addEventListener("wheel", onWheel, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchend", onTouchEnd, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchcancel", onTouchEnd, {
      passive: true,
      capture: true,
    });
    scrollEl.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearEndVideoSnap();
      document.removeEventListener("wheel", onWheel, true);
      document.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("touchmove", onTouchMove, true);
      document.removeEventListener("touchend", onTouchEnd, true);
      document.removeEventListener("touchcancel", onTouchEnd, true);
      scrollEl.removeEventListener("scroll", onScroll);
      endVideoTweenRef.current?.kill();
      endVideoTweenRef.current = null;
      endVideoSnapTimeoutRef.current = 0;
      endVideoLastDeltaRef.current = 0;
      endVideoProgressRef.current = 0;
      endVideoEl.style.removeProperty("--end-video-y");
      endVideoEl.style.removeProperty("--end-video-opacity");
      gsap.set(endVideoEl, { clearProps: "pointerEvents" });
      isEndVideoPinnedRef.current = false;
      setIsEndVideoPinned(false);
    };
  }, [mounted, hasEndVideo, isMax1200, displayIndex]);

  if (!mounted) return null;

  const activeDate = getLocalizedProjectField(active, "date", language);
  const activeTitle = getLocalizedProjectField(active, "title", language);
  const activeDesc =
    getLocalizedProjectDescription(active, language) || active?.desc || defaultDesc;
  const descriptionBlocks = getDescriptionBlocks(activeDesc);
  const additionalBlocks = Array.isArray(active?.blocks)
    ? [...active.blocks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];

  return createPortal(
    <>
      <div
        className={`${styles.overlay} ${isEndVideoPinned ? styles.overlayEndVideoPinned : ""}`}
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.wipe} ref={wipeRef} aria-hidden="true" />
        <div className={styles.overlayMask} ref={overlayMaskRef}>
          <div
            className={`${styles.overlayContent} ${isMax1200 ? styles.overlayContentMax1200 : ""} ${
              hasEndVideo ? styles.overlayContentHasEndVideo : ""
            }`}
            ref={overlayContentRef}
          >
          <section className={`${styles.projectBlock} ${styles.projectBlockMain}`}>
            <button type="button" className={styles.backBtn} onClick={handleClose}>
              <Image
                className={`${styles.btnIcon} ${styles.btnIconLeft}`}
                src={getAssetUrl("/svg/arrow.svg")}
                alt=""
                aria-hidden="true"
                width={15}
                height={16}
              />
              <span className={styles.btnText}>
                Назад · Back · <span className={styles.btnTextCn}>返回</span>
              </span>
            </button>

            <div className={styles.info} ref={infoRef}>
              <p className={styles.date}>{activeDate}</p>
              <p className={styles.title}>
                {renderTitleWithChineseSpans(activeTitle, styles.titleCh)}
              </p>
              {!isMax1200 && (
                <div className={styles.desc}>
                  {descriptionBlocks.map((block) => (
                    <p key={block.key} className={block.className}>
                      {block.text}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div
              className={`${styles.rightCol} ${isMax1200 ? styles.rightColMax1200 : ""}`}
              ref={rightColRef}
            >
              <div
                className={styles.media}
                aria-label="Video carousel"
                ref={mediaRef}
                style={{ "--media-aspect-ratio": mediaAspectRatio }}
              >
                <div className={styles.mediaTrack} ref={mediaTrackRef}>
                  {slides.map((c, idx) => (
                    <div className={styles.mediaSlide} key={`${c?.id ?? "media"}-${idx}`}>
                      <div className={styles.mediaInner}>
                        {(() => {
                          const isActiveMedia = idx === previewActiveIndex;
                          const mediaTitle = getLocalizedProjectField(c, "title", language);
                          const embedConfig = resolveEmbedConfig(c?.videoEmbedCode);
                          const mediaSource = resolveMediaSource(c?.videoSrc);
                          const shouldLoadVideo = Math.abs(idx - previewActiveIndex) <= 1;
                          const shouldLoadEmbed = idx === previewActiveIndex;

                          if (embedConfig && shouldLoadEmbed) {
                            const previewImageSrc = c?.imageSrc
                              ? getAssetUrl(c.imageSrc)
                              : null;

                            return (
                              <>
                                {previewImageSrc ? (
                                  <img
                                    className={`${styles.mediaImage} ${styles.mediaPoster} ${
                                      activeEmbedReady ? styles.mediaPosterHidden : ""
                                    }`}
                                    src={previewImageSrc}
                                    alt=""
                                  />
                                ) : (
                                  <div
                                    className={`${styles.mediaLoadingFallback} ${
                                      activeEmbedReady ? styles.mediaLoadingFallbackHidden : ""
                                    }`}
                                    aria-hidden="true"
                                  >
                                    Загружаем видео...
                                  </div>
                                )}

                                <iframe
                                  className={`${styles.mediaIframe} ${
                                    activeEmbedReady ? styles.mediaIframeReady : ""
                                  }`}
                                  src={embedConfig.src}
                                  title={mediaTitle || "Project video"}
                                  allow={embedConfig.allow}
                                  allowFullScreen
                                  loading="eager"
                                  onLoad={() => setActiveEmbedReady(true)}
                                />
                              </>
                            );
                          }

                          if (mediaSource && shouldLoadVideo) {
                            return (
                              <video
                                ref={(el) => {
                                  videoRefs.current[idx] = el;
                                }}
                                onVolumeChange={(e) => {
                                  if (idx !== previewActiveIndex) return;
                                  rememberVideoAudioState(e.currentTarget);
                                }}
                                className={styles.mediaVideo}
                                src={mediaSource}
                                aria-label={mediaTitle || c.videoTitle || "Project video"}
                                controls={isActiveMedia}
                                autoPlay={isActiveMedia}
                                loop
                                playsInline
                                preload={isActiveMedia ? "metadata" : "none"}
                                poster={c?.imageSrc ? getAssetUrl(c.imageSrc) : undefined}
                              />
                            );
                          }

                          if (c?.imageSrc) {
                            return (
                              <img
                                className={styles.mediaImage}
                                src={getAssetUrl(c.imageSrc)}
                                alt=""
                              />
                            );
                          }

                          return null;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isMax1200 && (
                <div className={`${styles.desc} ${styles.descMobile}`} ref={descRef}>
                  {descriptionBlocks.map((block) => (
                    <p key={block.key} className={block.className}>
                      {block.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>

          {active?.showDividerAfter ? <ProjectBlockDivider /> : null}

          {additionalBlocks.map((block, index) => {
            const blockDescription = getDescriptionBlocks(
              getLocalizedProjectDescription(block, language),
            );
            const mediaKey = block.id ?? `${block.sortOrder ?? index}-${index}`;
            const isTextBlock = block.mediaType === "text";

            return (
              <Fragment key={`block-${mediaKey}`}>
                <section
                  className={`${styles.projectBlock} ${
                    isTextBlock ? styles.projectBlockText : ""
                  }`}
                >
                  <div className={`${styles.info} ${styles.blockInfo}`}>
                    <div className={`${styles.desc} ${styles.blockDesc}`}>
                      {blockDescription.map((descBlock) => (
                        <p key={descBlock.key} className={descBlock.className}>
                          {descBlock.text}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`${styles.rightCol} ${styles.blockMediaCol} ${
                      isTextBlock ? styles.blockTextMediaCol : ""
                    }`}
                  >
                    {isTextBlock ? (
                      <div className={styles.blockTextMediaPlaceholder} aria-hidden="true" />
                    ) : (
                      <div className={`${styles.media} ${styles.blockMedia}`}>
                        <div className={styles.mediaInner}>
                          <StaticProjectMedia item={block} title={activeTitle} />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {block.showDividerAfter ? <ProjectBlockDivider /> : null}
              </Fragment>
            );
          })}

          {isMax1200 && hasEndVideo ? (
            <section className={styles.endVideoBlockMobile}>
              <div className={`${styles.media} ${styles.endVideoMedia}`}>
                <div className={styles.mediaInner}>
                  <StaticProjectMedia
                    item={{
                      mediaType: "video",
                      videoEmbedCode: active.endVideoEmbedCode,
                    }}
                    title={activeTitle}
                    loading="eager"
                  />
                </div>
              </div>
            </section>
          ) : null}

          {isMax1200 && !hasEndVideo && (
            <div className={styles.mobileScrollSpacer} aria-hidden="true" />
          )}
          </div>
        </div>
      </div>

      {hasEndVideo && !isMax1200 ? (
        <section
          className={`${styles.endVideoBlock} ${
            isEndVideoInteractive ? styles.endVideoBlockInteractive : ""
          }`}
          ref={endVideoBlockRef}
        >
          <div className={`${styles.media} ${styles.endVideoMedia}`}>
            <div className={styles.mediaInner}>
              <StaticProjectMedia
                item={{
                  mediaType: "video",
                  videoEmbedCode: active.endVideoEmbedCode,
                }}
                title={activeTitle}
                loading="eager"
                autoPlay={shouldAutoplayEndVideo}
              />
            </div>
            <button
              type="button"
              className={styles.endVideoInteractionLayer}
              aria-label="Enable video controls"
              onClick={() => setEndVideoInteraction(true)}
            />
          </div>
        </section>
      ) : null}
    </>,
    document.body,
  );
}
