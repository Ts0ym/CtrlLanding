"use client";

import Image from "next/image";
import styles from "../app/layout.module.scss";
import { getAssetUrl } from "../lib/assetUrl";

export default function HeaderLogoButton() {
  const handleClick = () => {
    if (!document.body.hasAttribute("data-portfolio-viewer")) return;
    window.dispatchEvent(new CustomEvent("portfolio-viewer:request-close"));
  };

  return (
    <button
      type="button"
      className={styles.headerLogo}
      data-anim="header-logo"
      aria-label="Close portfolio viewer"
      onClick={handleClick}
    >
      <Image
        className={styles.headerLogoImg}
        src={getAssetUrl("/svg/ctrl..svg")}
        alt=""
        width={180}
        height={32}
        priority
      />
    </button>
  );
}
