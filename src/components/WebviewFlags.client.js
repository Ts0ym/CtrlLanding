"use client";

import { useEffect } from "react";

function setWebviewFlag(value) {
  if (typeof document === "undefined") return;

  const targets = [document.documentElement, document.body];
  targets.forEach((node) => {
    if (!node) return;

    if (value) {
      node.setAttribute("data-webview", value);
    } else {
      node.removeAttribute("data-webview");
    }
  });
}

export default function WebviewFlags() {
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isTelegram =
      /Telegram/i.test(ua) ||
      typeof window.TelegramWebviewProxy !== "undefined";

    if (!isTelegram) return undefined;

    setWebviewFlag("telegram");
    return () => setWebviewFlag(null);
  }, []);

  return null;
}
