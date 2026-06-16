"use client";

import { LANGUAGES } from "../lib/languages";
import styles from "../app/layout.module.scss";

export default function DesktopLanguageSwitcher({
  activeLanguage,
  onLanguageChange,
}) {
  return (
    <div
      className={styles.desktopLanguageSwitcher}
      data-anim="menu-title"
      role="group"
      aria-label="Language"
    >
      {LANGUAGES.map((language, index) => {
        const isActive = activeLanguage === language.code;

        return (
          <span className={styles.languageItem} key={language.code}>
            <button
              type="button"
              className={`${styles.languageButton} ${
                isActive ? styles.languageButtonActive : ""
              } ${language.code === "cn" ? styles.languageButtonCn : ""}`}
              aria-pressed={isActive}
              lang={language.htmlLang}
              onClick={() => onLanguageChange(language.code)}
            >
              {language.label}
            </button>
            {index < LANGUAGES.length - 1 ? (
              <span className={styles.languageSep} aria-hidden="true">
                ·
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
