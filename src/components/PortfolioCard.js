import styles from "./PortfolioCard.module.scss";
import { getAssetUrl } from "../lib/assetUrl";
import { getLocalizedProjectField } from "../lib/portfolioProjects";

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

export default function PortfolioCard({ card, language = "ru", onClick }) {
  const date = getLocalizedProjectField(card, "date", language);
  const title = getLocalizedProjectField(card, "title", language);

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
          <p className={styles.date}>{date}</p>
          <p className={styles.title}>{renderTitleWithChineseSpans(title)}</p>
        </div>
      </button>
    </article>
  );
}
