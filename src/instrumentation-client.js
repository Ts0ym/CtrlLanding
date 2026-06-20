const LOCAL_VIDEO_VISIBLE_RATIO = 0.25;
const observedVideos = new WeakSet();

function isManagedLocalVideo(node) {
  const source = node.currentSrc || node.getAttribute("src") || "";

  return (
    node instanceof HTMLVideoElement &&
    node.matches("video[muted][loop]:not([controls])") &&
    source.includes("/uploads/")
  );
}

function playVideo(video) {
  const playRequest = video.play();

  if (playRequest?.catch) {
    playRequest.catch(() => {});
  }
}

function setupLocalVideoVisibilityPlayback() {
  if (typeof IntersectionObserver === "undefined") {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= LOCAL_VIDEO_VISIBLE_RATIO) {
          playVideo(video);
        } else {
          video.pause();
        }
      });
    },
    { threshold: [0, LOCAL_VIDEO_VISIBLE_RATIO, 0.6, 1] },
  );

  const observeVideo = (video) => {
    if (!isManagedLocalVideo(video) || observedVideos.has(video)) {
      return;
    }

    observedVideos.add(video);
    video.autoplay = false;
    video.removeAttribute("autoplay");
    video.pause();
    observer.observe(video);
  };

  const observeNode = (node) => {
    if (!(node instanceof Element)) {
      return;
    }

    observeVideo(node);
    node.querySelectorAll?.("video").forEach(observeVideo);
  };

  document.querySelectorAll("video").forEach(observeVideo);

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(observeNode);
    });
  });

  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupLocalVideoVisibilityPlayback, {
    once: true,
  });
} else {
  setupLocalVideoVisibilityPlayback();
}
