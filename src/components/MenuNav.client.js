"use client";

import { useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "../app/layout.module.scss";

export default function MenuNav() {
  const [activeHref, setActiveHref] = useState("#home");

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

  return (
    <nav className={styles.menu} aria-label="Menu" onClick={onClick}>
      <p className={styles.menuTitle} data-anim="menu-title">
        <span>Меню</span>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span>Menu</span>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span className={styles.menuTitleCn}>菜单</span>
      </p>
      <ul className={styles.menuList} data-anim="menu-list">
        <li>
          <a
            className={`${styles.menuLink} ${
              activeHref === "#home" ? styles.menuLinkActive : ""
            }`}
            href="#home"
          >
            <span className={styles.menuLinkLabel}>
              <span>Главная</span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span>Home</span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span className={styles.menuCn}>首页</span>
            </span>
            <span className={styles.menuLinkUnderline} aria-hidden="true" />
          </a>
        </li>
        <li>
          <a
            className={`${styles.menuLink} ${
              activeHref === "#about" ? styles.menuLinkActive : ""
            }`}
            href="#about"
          >
            <span className={styles.menuLinkLabel}>
              <span>О нас</span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span>About Us</span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span className={styles.menuCn}>关于我们</span>
            </span>
            <span className={styles.menuLinkUnderline} aria-hidden="true" />
          </a>
        </li>
        <li>
          <a
            className={`${styles.menuLink} ${
              activeHref === "#work" ? styles.menuLinkActive : ""
            }`}
            href="#work"
          >
            <span className={styles.menuLinkLabel}>
              <span>Работы</span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span>Portfolio</span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span className={styles.menuCn}>作品集</span>
            </span>
            <span className={styles.menuLinkUnderline} aria-hidden="true" />
          </a>
        </li>
        <li>
          <a
            className={`${styles.menuLink} ${
              activeHref === "#contact" ? styles.menuLinkActive : ""
            }`}
            href="#contact"
          >
            <span className={styles.menuLinkLabel}>
              <span>Контакты</span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span>Contact Us</span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span className={styles.menuCn}>联系我们</span>
            </span>
            <span className={styles.menuLinkUnderline} aria-hidden="true" />
          </a>
        </li>
      </ul>
    </nav>
  );
}
