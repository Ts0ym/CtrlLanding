"use client";

import { useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DesktopLanguageSwitcher from "./DesktopLanguageSwitcher.client";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getLanguageMeta,
  isSupportedLanguage,
} from "../lib/languages";
import styles from "../app/layout.module.scss";

const MENU_ITEMS = [
  {
    href: "#home",
    label: {
      ru: "Главная",
      en: "Home",
      cn: "首页",
    },
  },
  {
    href: "#about",
    label: {
      ru: "О нас",
      en: "About Us",
      cn: "关于我们",
    },
  },
  {
    href: "#work",
    label: {
      ru: "Работы",
      en: "Portfolio",
      cn: "作品集",
    },
  },
  {
    href: "#contact",
    label: {
      ru: "Контакты",
      en: "Contact Us",
      cn: "联系我们",
    },
  },
];

export default function MenuNav() {
  const [activeHref, setActiveHref] = useState("#home");
  const [activeLanguage, setActiveLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const nextLanguage = isSupportedLanguage(storedLanguage)
      ? storedLanguage
      : DEFAULT_LANGUAGE;

    setActiveLanguage(nextLanguage);
    document.documentElement.lang = getLanguageMeta(nextLanguage).htmlLang;
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const isMobileTransition = Boolean(
      ScrollTrigger.isTouch || window.matchMedia("(max-width: 768px)").matches
    );
    // Keep in sync with ScrollTransitions.js, otherwise the menu switches to #work too early.
    const STAGE_SCROLL_END_DESKTOP = "+=130%";
    const STAGE_SCROLL_END_MOBILE = "+=110%";
    const stage = document.querySelector('[data-scroll="stage"]');
    const work = document.querySelector("#work");
    const contact = document.querySelector("#contact");
    const triggers = [];

    let stageTrigger = null;
    if (stage) {
      stageTrigger = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: isMobileTransition ? STAGE_SCROLL_END_MOBILE : STAGE_SCROLL_END_DESKTOP,
        onUpdate: (self) => {
          setActiveHref(self.progress < 0.5 ? "#home" : "#about");
        },
        onLeave: () => setActiveHref("#work"),
        onLeaveBack: () => setActiveHref("#home"),
      });
      triggers.push(stageTrigger);
    }

    if (work) {
      triggers.push(
        ScrollTrigger.create({
          trigger: work,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActiveHref("#work"),
          onEnterBack: () => setActiveHref("#work"),
        })
      );
    }

    if (contact) {
      triggers.push(
        ScrollTrigger.create({
          trigger: contact,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActiveHref("#contact"),
          onEnterBack: () => setActiveHref("#contact"),
        })
      );
    }

    const current = ScrollSmoother.get?.()?.scrollTop?.() ?? window.scrollY ?? 0;
    const mid = current + window.innerHeight * 0.5;
    const inView = (el) => {
      if (!el) return false;
      const top = el.getBoundingClientRect().top + current;
      const bottom = top + el.offsetHeight;
      return mid >= top && mid <= bottom;
    };

    if (inView(contact)) {
      setActiveHref("#contact");
    } else if (inView(work)) {
      setActiveHref("#work");
    } else if (stageTrigger) {
      const progress =
        (current - stageTrigger.start) / (stageTrigger.end - stageTrigger.start);
      setActiveHref(progress < 0.5 ? "#home" : "#about");
    }

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  const onClick = useCallback((e) => {
    const link = e.target?.closest?.("a[href^='#']");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href) return;

    e.preventDefault();
    window.dispatchEvent(new CustomEvent("mobile-menu:close"));
    window.dispatchEvent(new CustomEvent("portfolio-viewer:close"));
    setActiveHref(href);

    const doScroll = () => {
      // Prevent stage snap from hijacking programmatic section jumps.
      window.__suppressStageSnapUntil =
        (window.performance?.now?.() ?? Date.now()) + 1200;

      const isMobile = window.matchMedia("(max-width: 800px)").matches;
      const smoother = ScrollSmoother.get?.();
      const current = smoother?.scrollTop?.() ?? window.scrollY ?? 0;

      ScrollTrigger.refresh();

      if (href === "#home") {
        if (smoother?.scrollTo) smoother.scrollTo(0, true);
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (href === "#about") {
        const stage = document.querySelector('[data-scroll="stage"]');
        const stageST =
          ScrollTrigger.getById?.("stage-transition") ||
          (stage
            ? ScrollTrigger.getAll().find(
                (t) => t.trigger === stage && (t.vars?.pin || t.pin)
              )
            : null);
        if (stageST) {
          const range = Math.max(0, stageST.end - stageST.start);
          const tlDuration =
            stageST.animation?.totalDuration?.() ??
            stageST.animation?.duration?.() ??
            2;
          // `About` is fully visible close to the end of the stage-transition timeline.
          // Land just before the end to avoid slipping into the next section.
          const targetTime = Math.max(0, tlDuration - 0.01);
          const targetProgress = tlDuration > 0 ? targetTime / tlDuration : 0.99;
          const target = Math.min(
            stageST.end - 1,
            stageST.start + range * targetProgress + 1
          );
          if (smoother?.scrollTo) smoother.scrollTo(target, true);
          else window.scrollTo({ top: target, behavior: "smooth" });
        } else {
          const aboutEl = document.querySelector("#about");
          if (aboutEl) aboutEl.scrollIntoView({ behavior: "smooth" });
        }
        return;
      }

      if (isMobile) {
        const targetEl = document.querySelector(href);
        if (targetEl) targetEl.scrollIntoView({ behavior: "smooth" });
        return;
      }

      const targetEl = document.querySelector(href);
      if (!targetEl) return;
      const rectTop = targetEl.getBoundingClientRect().top;
      const targetTop = rectTop + current;

      if (smoother?.scrollTo) smoother.scrollTo(targetTop, true);
      else window.scrollTo({ top: targetTop, behavior: "smooth" });
    };

    requestAnimationFrame(() => requestAnimationFrame(doScroll));
  }, []);

  const handleLanguageChange = useCallback((language) => {
    if (!isSupportedLanguage(language)) return;

    setActiveLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = getLanguageMeta(language).htmlLang;
    window.dispatchEvent(
      new CustomEvent("language:change", {
        detail: { language },
      })
    );
  }, []);

  const activeLanguageMeta = getLanguageMeta(activeLanguage);

  return (
    <nav className={styles.menu} aria-label="Menu" onClick={onClick}>
      <DesktopLanguageSwitcher
        activeLanguage={activeLanguage}
        onLanguageChange={handleLanguageChange}
      />
      <ul className={styles.menuList} data-anim="menu-list">
        {MENU_ITEMS.map((item) => (
          <li key={item.href}>
            <a
              className={`${styles.menuLink} ${
                activeHref === item.href ? styles.menuLinkActive : ""
              }`}
              href={item.href}
            >
              <span
                className={`${styles.menuLinkLabel} ${
                  activeLanguage === "cn" ? styles.menuCn : ""
                }`}
                lang={activeLanguageMeta.htmlLang}
              >
                {item.label[activeLanguage]}
              </span>
              <span className={styles.menuLinkUnderline} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
