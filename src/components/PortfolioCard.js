import styles from "./PortfolioCard.module.scss";
import Image from "next/image";

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
          <Image
            className={styles.image}
            src={card.imageSrc}
            alt=""
            fill
            sizes="(max-width: 800px) 100vw, 33vw"
          />
        </div>
        <div className={styles.meta}>
          <p className={styles.date}>{card.date}</p>
          <p className={styles.title}>{card.title}</p>
        </div>
      </button>
    </article>
  );
}

