import styles from "./PortfolioPreviewCard.module.scss";
import { getAssetUrl } from "../lib/assetUrl";

export default function PortfolioPreviewCard({
  card,
  className,
  dim = false,
  onClick,
  ariaLabel,
  ...rest
}) {
  const rootClassName = [styles.card, dim ? styles.dim : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={rootClassName} onClick={onClick} aria-label={ariaLabel} {...rest}>
      <div className={styles.imageWrap}>
        <img className={styles.image} src={getAssetUrl(card.imageSrc)} alt="" />
      </div>
      <div className={styles.meta}>
        <p className={styles.date}>{card.date}</p>
        <p className={styles.title}>{card.title}</p>
      </div>
    </button>
  );
}

