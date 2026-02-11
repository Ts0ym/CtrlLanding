import styles from "./PortfolioPreviewCard.module.scss";
import Image from "next/image";

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
        <Image
          className={styles.image}
          src={card.imageSrc}
          alt=""
          fill
          sizes="(max-width: 1200px) 28vw, 16vw"
        />
      </div>
      <div className={styles.meta}>
        <p className={styles.date}>{card.date}</p>
        <p className={styles.title}>{card.title}</p>
      </div>
    </button>
  );
}

