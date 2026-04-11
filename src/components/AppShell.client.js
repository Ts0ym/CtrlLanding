"use client";

import { usePathname } from "next/navigation";
import IntroAnimation from "../app/animations/IntroAnimation";
import ScrollTransitions from "../app/animations/ScrollTransitions";
import SmoothScroll from "../app/animations/SmoothScroll";
import ScrollDownArrow from "./ScrollDownArrow";
import MenuNav from "./MenuNav.client";
import PortfolioAnimations from "../app/animations/PortfolioAnimations";
import MobileMenuToggle from "./MobileMenuToggle.client";
import HeaderLogoButton from "./HeaderLogoButton.client";
import WebviewFlags from "./WebviewFlags.client";
import styles from "../app/layout.module.scss";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminEditor = pathname?.startsWith("/admineditor");

  if (isAdminEditor) {
    return <main className={styles.adminMain}>{children}</main>;
  }

  return (
    <>
      <WebviewFlags />
      <IntroAnimation />
      <SmoothScroll />
      <ScrollTransitions />
      <PortfolioAnimations />

      <div className={styles.shell}>
        <div className={styles.headerBg} aria-hidden="true" />
        <div className={styles.footerBg} aria-hidden="true" />
        <HeaderLogoButton />
        <div className={styles.topLineLeft} data-anim="line" aria-hidden="true" />
        <div className={styles.topLineRight} data-anim="line" aria-hidden="true" />
        <div className={styles.bottomLineLeft} data-anim="line" aria-hidden="true" />
        <div className={styles.bottomLineRight} data-anim="line" aria-hidden="true" />
        <MobileMenuToggle />

        <div data-nosnippet>
          <MenuNav />
        </div>

        <ScrollDownArrow
          className={styles.scrollHint}
          iconClassName={styles.scrollHintIcon}
        />

        <div id="smooth-wrapper" className={styles.smoothWrapper}>
          <div id="smooth-content" className={styles.smoothContent}>
            <main className={styles.main}>{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}
