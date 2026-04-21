import styles from "./PortfolioCard.module.scss";
import { getAssetUrl } from "../lib/assetUrl";

function renderTitleWithChineseSpans(title) {
  const value = String(title ?? "");

  return value.split(/([\p{Script=Han}]+)/gu).map((part, index) => {
    if (!part) return null;

    if (/[\p{Script=Han}]/u.test(part)) {
      return (
        <span key={`han-${index}`} className={styles.titleCh}>
          {part}
        </span>
      );
    }

    return part;
  });
}

export default function PortfolioCard({ card, onClick }) {
  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.cardButton}
        onClick={onClick}
        aria-label="Open project"
      >
        <div className={styles.imageWrap}>
          <img
            className={styles.image}
            src={getAssetUrl(card.imageSrc)}
            alt=""
          />
        </div>
        <div className={styles.meta}>
          <p className={styles.date}>{card.date}</p>
          <p className={styles.title}>{renderTitleWithChineseSpans(card?.title)}</p>
        </div>
      </button>
    </article>
  );
}
